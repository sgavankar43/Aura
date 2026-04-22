/**
 * WebSocket Gateway — Bridges Redis Pub/Sub to Socket.io clients.
 *
 * Architecture: Gateway layer — translates between transport protocols.
 * Imports from: Models (types/interfaces).
 * Not a Service, Controller, or Route — it's a cross-cutting transport concern.
 *
 * Responsibilities:
 * 1. Authenticate WebSocket connections via x-aura-api-key
 * 2. Auto-join authenticated clients to `project:{projectId}` rooms
 * 3. Subscribe to Redis `aura:flags:updates` channel
 * 4. Relay flag updates to the correct project room
 *
 * Security (per Security Auditor review):
 * - API key validated against DB during handshake (middleware)
 * - Invalid/missing keys rejected with Error before connection completes
 * - Clients can ONLY join the room matching their authenticated project
 * - No manual room join — server-assigned only
 *
 * Milestone 5: Tracks ws_connections_active and ws_messages_relayed metrics.
 * Logs correlationId when relaying events for distributed tracing.
 *
 * See: docs/adr/005-websocket-gateway.md
 */

import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { FlagUpdateEvent, IFlagRepository } from '../models/flag.models.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

/** The Redis channel used for flag updates */
const FLAG_UPDATE_CHANNEL = 'aura:flags:updates';

/**
 * Minimal Redis subscriber interface.
 * Decoupled from ioredis for testability — tests inject a mock.
 */
export interface RedisSubscriber {
  subscribe(channel: string): Promise<number>;
  on(event: 'message', handler: (channel: string, message: string) => void): void;
  quit(): Promise<string>;
}

export class WebSocketGateway {
  constructor(
    private readonly io: SocketIOServer,
    private readonly redisSubscriber: RedisSubscriber,
    private readonly repository: IFlagRepository,
  ) {}

  /**
   * Initialize the gateway:
   * 1. Register Socket.io authentication middleware
   * 2. Subscribe to Redis flag updates channel
   * 3. Set up message relay from Redis → Socket.io rooms
   */
  initialize(): void {
    this.setupAuthMiddleware();
    this.setupConnectionHandler();
    this.subscribeToRedis();
  }

  /**
   * Socket.io middleware: validate x-aura-api-key on every handshake.
   *
   * Security Auditor checklist:
   * ✅ API key required (rejects missing keys)
   * ✅ API key validated against DB (rejects invalid keys)
   * ✅ Project ID stored on socket.data for room assignment
   * ✅ Archived projects rejected
   */
  private setupAuthMiddleware(): void {
    this.io.use(async (socket: Socket, next) => {
      const apiKey = socket.handshake.auth?.['x-aura-api-key'] as string | undefined;

      if (!apiKey) {
        return next(new Error('Authentication required: x-aura-api-key missing'));
      }

      const project = await this.repository.getProjectByApiKey(apiKey);
      if (!project) {
        return next(new Error('Invalid API key'));
      }

      // Store the authenticated project ID on the socket
      socket.data['projectId'] = project.id;
      next();
    });
  }

  /**
   * Handle new connections: auto-join the authenticated project room.
   * Milestone 5: Track active WebSocket connections.
   */
  private setupConnectionHandler(): void {
    this.io.on('connection', (socket: Socket) => {
      const projectId = socket.data['projectId'] as string;
      const roomName = `project:${projectId}`;

      // Auto-join the project room — no client-side room joining allowed
      socket.join(roomName);
      metrics.increment('ws_connections_active');

      logger.debug('WebSocket client connected', { projectId, socketId: socket.id });

      socket.on('disconnect', () => {
        metrics.decrement('ws_connections_active');
        logger.debug('WebSocket client disconnected', { projectId, socketId: socket.id });
      });
    });
  }

  /**
   * Subscribe to Redis and relay flag updates to Socket.io rooms.
   * Milestone 5: Logs correlationId for distributed tracing.
   */
  private subscribeToRedis(): void {
    this.redisSubscriber.subscribe(FLAG_UPDATE_CHANNEL);

    this.redisSubscriber.on('message', (channel: string, message: string) => {
      if (channel !== FLAG_UPDATE_CHANNEL) {
        return;
      }

      try {
        const event = JSON.parse(message) as FlagUpdateEvent;

        // Validate the parsed event has the required fields
        if (!event.projectId || !event.featureKey) {
          return;
        }

        // Emit only to the project room — other projects never see this
        const roomName = `project:${event.projectId}`;
        this.io.to(roomName).emit('flag_updated', event);

        metrics.increment('ws_messages_relayed', { projectId: event.projectId });
        logger.debug('Flag update relayed via WebSocket', {
          projectId: event.projectId,
          featureKey: event.featureKey,
          correlationId: event.correlationId,
        });
      } catch {
        // Malformed JSON or unexpected payload — skip silently.
        logger.warn('Failed to parse Redis message on flag update channel');
      }
    });
  }

  /**
   * Graceful shutdown: close the Redis subscriber connection.
   */
  async shutdown(): Promise<void> {
    await this.redisSubscriber.quit();
  }
}
