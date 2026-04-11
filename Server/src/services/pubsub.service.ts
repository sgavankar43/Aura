/**
 * PubSubService — Redis Pub/Sub for real-time flag update broadcasting.
 *
 * Architecture: Service layer — publishes flag change events to Redis.
 * Imports from: Models (types/interfaces).
 * Imported by: FlagService (to broadcast after state changes).
 *
 * Design: Accepts an ioredis client via constructor injection so tests
 * can pass a mock. In production, create with `PubSubService.create(redisUrl)`.
 *
 * See: docs/adr/004-redis-pubsub-flag-sync.md
 */

import Redis from 'ioredis';
import type { FlagUpdateEvent, IPubSubService } from '../models/flag.models.js';

/** The Redis channel for flag update events */
export const FLAG_UPDATE_CHANNEL = 'aura:flags:updates';

export class PubSubService implements IPubSubService {
  private readonly redis: Redis;

  /**
   * Create a PubSubService with an injected Redis client.
   * Use PubSubService.create() for production, or inject a mock for tests.
   */
  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  /**
   * Factory method for production use.
   * Creates a PubSubService with a real Redis connection.
   */
  static create(redisUrl: string): PubSubService {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Log connection status and prevent unhandled promise rejections on connection failure
    client.on('connect', () => console.log('✅ Redis Publisher connected'));
    client.on('error', (err) =>
      console.error('❌ Redis Publisher connection failed:', err.message),
    );

    return new PubSubService(client);
  }

  /**
   * Publish a flag update event to the real-time channel.
   *
   * The payload is JSON-stringified and sent to the `aura:flags:updates`
   * channel. Returns the number of subscribers that received the message.
   */
  async publishFlagUpdate(event: FlagUpdateEvent): Promise<number> {
    const payload = JSON.stringify(event);
    const subscriberCount = await this.redis.publish(FLAG_UPDATE_CHANNEL, payload);
    return subscriberCount;
  }

  /**
   * Gracefully close the Redis connection.
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
