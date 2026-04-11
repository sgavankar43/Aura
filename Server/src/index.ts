/**
 * Server entry point.
 *
 * This file only starts the server — all app configuration is in app.ts.
 * This separation is intentional for testability (TDD pattern).
 *
 * Milestone 2: Attaches Socket.io WebSocket gateway to the HTTP server.
 * The gateway subscribes to Redis Pub/Sub and relays flag updates
 * to connected clients in real-time.
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

// Redis subscriber — separate client from the publisher (ioredis requirement)
const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
const redisSubscriber = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redisSubscriber.on('connect', () => logger.info('✅ Redis Subscriber connected'));
redisSubscriber.on('error', (err) =>
  logger.error('❌ Redis Subscriber connection failed:', err.message),
);

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

const gateway = new WebSocketGateway(io, redisSubscriber as any, noopRepository);
gateway.initialize();

logger.info('🔌 WebSocket gateway initialized', { redisUrl });

// --- Verify Integrations and Start Server ---
const prisma = new PrismaClient();

async function start() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (err: any) {
    logger.error('❌ Database connection failed:', err.message);
  }

  httpServer.listen(config.port, config.host, () => {
    logger.info(`🚀 Aura server running`, {
      port: config.port,
      host: config.host,
      env: config.nodeEnv,
      websocket: true,
    });
  });
}

start();

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

  // 4. Exit
  setTimeout(() => {
    logger.error('Forced shutdown — connections did not close in time.');
    process.exit(1);
  }, 10000);

  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
