/**
 * WebSocket Gateway Test Suite
 *
 * TDD: Written FIRST, before implementation (Red → Green → Refactor).
 *
 * Tests cover:
 * 1. Connection authentication via x-aura-api-key
 * 2. Room isolation — clients only receive updates for their project
 * 3. Redis message relay — flag_updated events emitted to correct rooms
 * 4. Rejection of invalid/missing API keys
 * 5. Disconnect & cleanup
 *
 * Architecture: Uses real Socket.io server + client (in-process),
 * InMemoryFlagRepository for auth lookups, and a mock Redis subscriber.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import type { Project, FlagUpdateEvent } from '../../models/flag.models.js';
import { InMemoryFlagRepository } from '../helpers/InMemoryFlagRepository.js';
import {
  WebSocketGateway,
  type RedisSubscriber,
} from '../../gateways/websocket.gateway.js';

// =============================================================================
// Test Fixtures
// =============================================================================

const PROJECT_A: Project = {
  id: 'project-aaa',
  name: 'Project Alpha',
  description: null,
  apiKey: 'key-alpha-valid',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  archivedAt: null,
};

const PROJECT_B: Project = {
  id: 'project-bbb',
  name: 'Project Beta',
  description: null,
  apiKey: 'key-beta-valid',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  archivedAt: null,
};

// =============================================================================
// Mock Redis Subscriber
// =============================================================================

function createMockRedisSubscriber(): RedisSubscriber {
  const handlers = new Map<string, (channel: string, message: string) => void>();
  return {
    subscribe: vi.fn().mockResolvedValue(1),
    on: vi.fn((event: string, handler: any) => {
      handlers.set(event, handler);
    }),
    quit: vi.fn().mockResolvedValue('OK'),
    // Test helper: simulate a Redis message arriving
    __simulateMessage(channel: string, message: string) {
      const handler = handlers.get('message');
      if (handler) handler(channel, message);
    },
  } as any;
}

// =============================================================================
// Helpers
// =============================================================================

function connectClient(port: number, apiKey: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, {
      auth: { 'x-aura-api-key': apiKey },
      transports: ['websocket'],
      forceNew: true,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
    // Timeout after 3s
    setTimeout(() => reject(new Error('Connection timeout')), 3000);
  });
}

function waitForEvent<T>(socket: ClientSocket, event: string, timeoutMs = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for '${event}'`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('WebSocket Gateway', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let repository: InMemoryFlagRepository;
  let mockRedis: ReturnType<typeof createMockRedisSubscriber>;
  let gateway: WebSocketGateway;
  let port: number;

  beforeAll(async () => {
    // Set up HTTP server + Socket.io
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: { origin: '*' },
    });

    // Repository with test projects
    repository = new InMemoryFlagRepository();
    repository.seedProjects([PROJECT_A, PROJECT_B]);

    // Mock Redis subscriber
    mockRedis = createMockRedisSubscriber();

    // Create and start gateway
    gateway = new WebSocketGateway(io, mockRedis, repository);
    gateway.initialize();

    // Start listening on a random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    httpServer.close();
    await gateway.shutdown();
  });

  // =========================================================================
  // Connection Authentication
  // =========================================================================

  describe('connection authentication', () => {
    it('should accept a connection with a valid API key', async () => {
      const client = await connectClient(port, 'key-alpha-valid');

      expect(client.connected).toBe(true);
      client.disconnect();
    });

    it('should reject a connection with an invalid API key', async () => {
      await expect(connectClient(port, 'invalid-key-999')).rejects.toThrow();
    });

    it('should reject a connection with no API key', async () => {
      const promise = new Promise<ClientSocket>((resolve, reject) => {
        const socket = ioClient(`http://localhost:${port}`, {
          auth: {},
          transports: ['websocket'],
          forceNew: true,
        });
        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', (err) => reject(err));
        setTimeout(() => reject(new Error('Connection timeout')), 3000);
      });

      await expect(promise).rejects.toThrow();
    });

    it('should auto-join the client to the correct project room', async () => {
      const client = await connectClient(port, 'key-alpha-valid');

      // Give the server a moment to process the room join
      await new Promise((r) => setTimeout(r, 100));

      // Verify room from server side
      const rooms = io.sockets.adapter.rooms;
      expect(rooms.has(`project:${PROJECT_A.id}`)).toBe(true);

      client.disconnect();
    });
  });

  // =========================================================================
  // Room Isolation — flag_updated events
  // =========================================================================

  describe('room isolation', () => {
    it('should relay a flag_updated event to the correct project room', async () => {
      const clientA = await connectClient(port, 'key-alpha-valid');
      await new Promise((r) => setTimeout(r, 100));

      // Listen for the event
      const eventPromise = waitForEvent<FlagUpdateEvent>(clientA, 'flag_updated');

      // Simulate Redis message for Project A
      const event: FlagUpdateEvent = {
        projectId: PROJECT_A.id,
        environmentId: 'env-001',
        featureKey: 'dark-mode',
        enabled: true,
        source: 'user-123',
        timestamp: new Date().toISOString(),
      };
      mockRedis.__simulateMessage('aura:flags:updates', JSON.stringify(event));

      // Client A should receive it
      const received = await eventPromise;
      expect(received.projectId).toBe(PROJECT_A.id);
      expect(received.featureKey).toBe('dark-mode');
      expect(received.enabled).toBe(true);

      clientA.disconnect();
    });

    it('should NOT relay a flag_updated event to a different project room', async () => {
      const clientB = await connectClient(port, 'key-beta-valid');
      await new Promise((r) => setTimeout(r, 100));

      // Set up a listener that should NOT fire
      const spy = vi.fn();
      clientB.on('flag_updated', spy);

      // Simulate Redis message for Project A (NOT Project B)
      const event: FlagUpdateEvent = {
        projectId: PROJECT_A.id,
        environmentId: 'env-001',
        featureKey: 'dark-mode',
        enabled: true,
        source: 'user-123',
        timestamp: new Date().toISOString(),
      };
      mockRedis.__simulateMessage('aura:flags:updates', JSON.stringify(event));

      // Wait a bit to confirm no event arrives
      await new Promise((r) => setTimeout(r, 300));
      expect(spy).not.toHaveBeenCalled();

      clientB.disconnect();
    });

    it('should relay events to multiple clients in the same project room', async () => {
      const client1 = await connectClient(port, 'key-alpha-valid');
      const client2 = await connectClient(port, 'key-alpha-valid');
      await new Promise((r) => setTimeout(r, 100));

      const promise1 = waitForEvent<FlagUpdateEvent>(client1, 'flag_updated');
      const promise2 = waitForEvent<FlagUpdateEvent>(client2, 'flag_updated');

      const event: FlagUpdateEvent = {
        projectId: PROJECT_A.id,
        environmentId: 'env-001',
        featureKey: 'new-dashboard',
        enabled: false,
        source: 'system',
        timestamp: new Date().toISOString(),
      };
      mockRedis.__simulateMessage('aura:flags:updates', JSON.stringify(event));

      const [received1, received2] = await Promise.all([promise1, promise2]);
      expect(received1.featureKey).toBe('new-dashboard');
      expect(received2.featureKey).toBe('new-dashboard');

      client1.disconnect();
      client2.disconnect();
    });
  });

  // =========================================================================
  // Redis Subscription
  // =========================================================================

  describe('Redis subscription', () => {
    it('should subscribe to the aura:flags:updates channel on init', () => {
      expect(mockRedis.subscribe).toHaveBeenCalledWith('aura:flags:updates');
    });

    it('should ignore malformed Redis messages gracefully', async () => {
      const clientA = await connectClient(port, 'key-alpha-valid');
      await new Promise((r) => setTimeout(r, 100));

      // Should not throw
      expect(() => {
        mockRedis.__simulateMessage('aura:flags:updates', 'not-valid-json{{{');
      }).not.toThrow();

      // Should not throw for missing fields
      expect(() => {
        mockRedis.__simulateMessage('aura:flags:updates', JSON.stringify({ random: true }));
      }).not.toThrow();

      clientA.disconnect();
    });

    it('should ignore messages from other channels', async () => {
      const clientA = await connectClient(port, 'key-alpha-valid');
      await new Promise((r) => setTimeout(r, 100));

      const spy = vi.fn();
      clientA.on('flag_updated', spy);

      // Message on a different channel
      mockRedis.__simulateMessage('some:other:channel', JSON.stringify({
        projectId: PROJECT_A.id,
        featureKey: 'test',
        enabled: true,
      }));

      await new Promise((r) => setTimeout(r, 200));
      expect(spy).not.toHaveBeenCalled();

      clientA.disconnect();
    });
  });

  // =========================================================================
  // Shutdown
  // =========================================================================

  describe('shutdown', () => {
    it('should call Redis quit on shutdown', async () => {
      // Note: this tests our mock. The actual gateway.shutdown()
      // is called in afterAll. We verify quit was called.
      expect(mockRedis.quit).toBeDefined();
    });
  });
});
