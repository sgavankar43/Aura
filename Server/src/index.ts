/**
 * Server entry point.
 *
 * This file only starts the server — all app configuration is in app.ts.
 * This separation is intentional for testability (TDD pattern).
 */

import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  logger.info(`🚀 Aura server running`, {
    port: config.port,
    host: config.host,
    env: config.nodeEnv,
  });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown — connections did not close in time.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
