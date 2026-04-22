/**
 * Structured JSON logger with sensitive field redaction.
 *
 * Architecture: Utility layer — can be imported by any layer.
 * Security: Redacts passwords, tokens, API keys, and authorization headers.
 *
 * Milestone 5: Adds sanitizeRequestId() and withContext() for
 * distributed tracing with AuraContext.
 */

import type { AuraContext } from '../models/flag.models.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/** Fields whose values should be redacted from logs */
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'creditcard',
  'credit_card',
  'ssn',
  'cvv',
]);

const REDACTED = '[REDACTED]';

/**
 * Recursively redact sensitive fields from an object.
 * Creates a deep copy — never mutates the original.
 */
function redactSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitive);
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        redacted[key] = REDACTED;
      } else {
        redacted[key] = redactSensitive(value);
      }
    }
    return redacted;
  }

  return obj;
}

function getCurrentLevel(): number {
  const envLevel = (process.env['LOG_LEVEL'] || 'info') as LogLevel;
  return LOG_LEVELS[envLevel] ?? LOG_LEVELS.info;
}

function formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: redactSensitive(meta) } : {}),
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (getCurrentLevel() <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (getCurrentLevel() <= LOG_LEVELS.info) {
      console.info(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (getCurrentLevel() <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (getCurrentLevel() <= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, meta));
    }
  },
};

export { redactSensitive, SENSITIVE_FIELDS };

// =============================================================================
// Milestone 5: Request ID Sanitization & Context-aware Logging
// =============================================================================

/**
 * Sanitize a request ID to prevent XSS/injection via user-supplied headers.
 * Only allows UUID-safe characters: alphanumeric + hyphens.
 * Truncates to 64 characters max.
 *
 * Security: The x-request-id header can be set by the client.
 * Without sanitization, a malicious request ID could inject
 * log forging payloads or XSS into monitoring dashboards.
 */
export function sanitizeRequestId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
}

/**
 * Create a child logger pre-bound with AuraContext fields.
 * Every log entry automatically includes requestId and userId.
 *
 * Usage:
 * ```ts
 * const log = withContext(ctx);
 * log.info('Flag evaluated', { key: 'dark-mode' });
 * // Output: { requestId: 'abc-123', userId: 'user-1', message: 'Flag evaluated', ... }
 * ```
 */
export function withContext(ctx: AuraContext) {
  const base = { requestId: ctx.requestId, userId: ctx.userId };
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { ...base, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>) => logger.info(msg, { ...base, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(msg, { ...base, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { ...base, ...meta }),
  };
}
