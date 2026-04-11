/**
 * PubSubService Test Suite
 *
 * TDD: Written FIRST, before implementation (Red → Green → Refactor).
 *
 * Tests cover:
 * 1. publishFlagUpdate calls Redis PUBLISH with correct channel and payload
 * 2. Payload is stringified JSON matching FlagUpdateEvent shape
 * 3. Returns the subscriber count from Redis
 * 4. disconnect() calls Redis quit()
 * 5. Error handling when Redis publish fails
 *
 * Architecture: Mocks ioredis to avoid needing a live Redis instance.
 * The PubSubService is a thin wrapper — we test the contract, not Redis.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PubSubService, FLAG_UPDATE_CHANNEL } from '../../services/pubsub.service.js';
import type { FlagUpdateEvent } from '../../models/flag.models.js';

// =============================================================================
// ioredis Mock
// =============================================================================

// Create a mock Redis client matching the ioredis interface
function createMockRedis() {
  return {
    publish: vi.fn().mockResolvedValue(2),
    quit: vi.fn().mockResolvedValue('OK'),
    status: 'ready' as const,
  };
}

// =============================================================================
// Test Fixtures
// =============================================================================

const sampleEvent: FlagUpdateEvent = {
  projectId: 'project-001',
  environmentId: 'env-prod-001',
  featureKey: 'dark-mode',
  enabled: true,
  source: 'user-123',
  timestamp: '2026-04-11T10:00:00.000Z',
};

// =============================================================================
// Tests
// =============================================================================

describe('PubSubService', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let pubsub: PubSubService;

  beforeEach(() => {
    mockRedis = createMockRedis();
    // Inject mock Redis client instead of connecting to a real instance
    pubsub = new PubSubService(mockRedis as any);
  });

  // =========================================================================
  // Channel Constant
  // =========================================================================

  describe('FLAG_UPDATE_CHANNEL', () => {
    it('should be defined as a namespaced channel', () => {
      expect(FLAG_UPDATE_CHANNEL).toBe('aura:flags:updates');
    });
  });

  // =========================================================================
  // publishFlagUpdate
  // =========================================================================

  describe('publishFlagUpdate', () => {
    it('should call Redis PUBLISH with the correct channel name', async () => {
      await pubsub.publishFlagUpdate(sampleEvent);

      expect(mockRedis.publish).toHaveBeenCalledTimes(1);
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'aura:flags:updates',
        expect.any(String),
      );
    });

    it('should publish a JSON-stringified FlagUpdateEvent payload', async () => {
      await pubsub.publishFlagUpdate(sampleEvent);

      const publishedPayload = mockRedis.publish.mock.calls[0][1];
      const parsed = JSON.parse(publishedPayload);

      expect(parsed).toEqual({
        projectId: 'project-001',
        environmentId: 'env-prod-001',
        featureKey: 'dark-mode',
        enabled: true,
        source: 'user-123',
        timestamp: '2026-04-11T10:00:00.000Z',
      });
    });

    it('should return the number of subscribers that received the message', async () => {
      mockRedis.publish.mockResolvedValue(3);

      const subscriberCount = await pubsub.publishFlagUpdate(sampleEvent);

      expect(subscriberCount).toBe(3);
    });

    it('should return 0 when no subscribers are listening', async () => {
      mockRedis.publish.mockResolvedValue(0);

      const subscriberCount = await pubsub.publishFlagUpdate(sampleEvent);

      expect(subscriberCount).toBe(0);
    });

    it('should propagate errors when Redis publish fails', async () => {
      mockRedis.publish.mockRejectedValue(new Error('Redis connection lost'));

      await expect(pubsub.publishFlagUpdate(sampleEvent)).rejects.toThrow(
        'Redis connection lost',
      );
    });

    it('should handle events with enabled=false', async () => {
      const disableEvent: FlagUpdateEvent = {
        ...sampleEvent,
        enabled: false,
      };

      await pubsub.publishFlagUpdate(disableEvent);

      const publishedPayload = mockRedis.publish.mock.calls[0][1];
      const parsed = JSON.parse(publishedPayload);

      expect(parsed.enabled).toBe(false);
    });

    it('should preserve all event fields in the published payload', async () => {
      const fullEvent: FlagUpdateEvent = {
        projectId: 'proj-999',
        environmentId: 'env-staging',
        featureKey: 'beta-feature',
        enabled: true,
        source: 'ci-pipeline',
        timestamp: '2026-04-11T12:00:00.000Z',
      };

      await pubsub.publishFlagUpdate(fullEvent);

      const published = JSON.parse(mockRedis.publish.mock.calls[0][1]);
      expect(published.projectId).toBe('proj-999');
      expect(published.environmentId).toBe('env-staging');
      expect(published.featureKey).toBe('beta-feature');
      expect(published.source).toBe('ci-pipeline');
      expect(published.timestamp).toBe('2026-04-11T12:00:00.000Z');
    });
  });

  // =========================================================================
  // disconnect
  // =========================================================================

  describe('disconnect', () => {
    it('should call Redis quit() to gracefully close the connection', async () => {
      await pubsub.disconnect();

      expect(mockRedis.quit).toHaveBeenCalledTimes(1);
    });

    it('should not throw if disconnect is called multiple times', async () => {
      await pubsub.disconnect();
      await expect(pubsub.disconnect()).resolves.not.toThrow();
    });
  });
});
