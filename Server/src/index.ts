/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server entry point.
 *
 * This file only starts the server — all app configuration is in app.ts.
 * This separation is intentional for testability (TDD pattern).
 *
 * Milestone 2: Attaches Socket.io WebSocket gateway to the HTTP server.
 * The gateway subscribes to Redis Pub/Sub and relays flag updates
 * to connected clients in real-time.
 *
 * Stability: Redis and Postgres connections are resilient —
 * the server starts even if they are temporarily unavailable.
 * Subscribers retry in the background with no crash risk.
 */

import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { WebSocketGateway } from './gateways/websocket.gateway.js';
import { logger } from './utils/logger.js';

const app = createApp();

// Create HTTP server (shared between Express and Socket.io)
const httpServer = createServer(app);

// --- Socket.io + WebSocket Gateway ---
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

/**
 * Create a resilient Redis client for the subscriber.
 *
 * Key settings:
 * - maxRetriesPerRequest: null — prevents MaxRetriesPerRequestError crashes.
 *   ioredis will retry indefinitely in the background.
 * - lazyConnect: true — don't connect until we explicitly call .connect().
 * - retryStrategy: exponential backoff with a cap at 5s.
 * - enableOfflineQueue: true — queue commands while disconnected.
 */
function createResilientRedisClient(url: string): Redis {
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis reconnecting (attempt ${times}, next in ${delay}ms)`);
      return delay;
    },
  });

  client.on('connect', () => logger.info('✅ Redis Subscriber connected'));
  client.on('error', (err) => logger.error('❌ Redis Subscriber error', { error: err.message }));
  client.on('close', () => logger.warn('⚠️  Redis Subscriber connection closed'));
  client.on('reconnecting', () => logger.info('🔄 Redis Subscriber reconnecting...'));

  return client;
}

// Placeholder repository — will be replaced with Prisma-backed repo once DB is initialized
// For now, use a no-op that rejects all connections (safe default)
const noopRepository = {
  getFeature: async () => null,
  getFlagState: async () => null,
  getEnvironment: async () => null,
  getFeaturesByProject: async () => [],
  getFlagStatesByEnvironment: async () => [],
  upsertFlagState: async () => {
    throw new Error('Not implemented');
  },
  getProjectByApiKey: async () => null,
};

// --- Verify Integrations and Start Server ---
const prisma = new PrismaClient();

async function start() {
  // 1. Attempt database connection (non-blocking — server starts regardless)
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (err: any) {
    logger.error('❌ Database connection failed (server will still start)', {
      error: err.message,
    });
  }

  // 2. Create Redis subscriber with resilient settings
  const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
  const redisSubscriber = createResilientRedisClient(redisUrl);

  // 3. Attempt Redis connection (non-blocking — gateway starts regardless)
  try {
    await redisSubscriber.connect();
  } catch (err: any) {
    logger.error('❌ Redis Subscriber initial connection failed (will retry)', {
      error: err.message,
    });
  }

  // 4. Initialize WebSocket gateway
  const gateway = new WebSocketGateway(io, redisSubscriber as any, noopRepository);
  gateway.initialize();
  logger.info('🔌 WebSocket gateway initialized', { redisUrl });

  // 5. Start HTTP server
  httpServer.listen(config.port, config.host, () => {
    logger.info(`🚀 Aura server running`, {
      port: config.port,
      host: config.host,
      env: config.nodeEnv,
      websocket: true,
    });
  });

  // --- Graceful Shutdown ---
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    // 1. Stop accepting new connections
    httpServer.close(() => {
      logger.info('HTTP server closed.');
    });

    // 2. Close Socket.io
    io.close(() => {
      logger.info('Socket.io server closed.');
    });

    // 3. Close Redis subscriber
    try {
      await gateway.shutdown();
      logger.info('Redis subscriber closed.');
    } catch {
      logger.error('Error closing Redis subscriber.');
    }

    // 4. Close database
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected.');
    } catch {
      logger.error('Error disconnecting database.');
    }

    // 5. Exit
    setTimeout(() => {
      logger.error('Forced shutdown — connections did not close in time.');
      process.exit(1);
    }, 10000);

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
