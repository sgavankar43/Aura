/**
 * Application configuration loaded from environment variables.
 *
 * Architecture: Utility layer — single source of truth for config.
 * Security: Validates all config at startup; fails fast on missing values.
 */

import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().int().nonnegative().default(3001),
  host: z.string().default('0.0.0.0'),
  corsOrigin: z.string().default('http://localhost:5173'),
  rateLimitWindowMs: z.coerce.number().int().positive().default(900000),
  rateLimitMaxRequests: z.coerce.number().int().positive().default(100),
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
});

export type AppConfig = z.infer<typeof configSchema>;

function loadConfig(): AppConfig {
  const result = configSchema.safeParse({
    nodeEnv: process.env['NODE_ENV'],
    port: process.env['PORT'],
    host: process.env['HOST'],
    corsOrigin: process.env['CORS_ORIGIN'],
    rateLimitWindowMs: process.env['RATE_LIMIT_WINDOW_MS'],
    rateLimitMaxRequests: process.env['RATE_LIMIT_MAX_REQUESTS'],
    logLevel: process.env['LOG_LEVEL'],
  });

  if (!result.success) {
    console.error('❌ Invalid configuration:', result.error.flatten().fieldErrors);
    throw new Error('Configuration validation failed. Check environment variables.');
  }

  return result.data;
}

export const config = loadConfig();
