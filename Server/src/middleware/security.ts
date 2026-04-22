/**
 * Security middleware stack.
 *
 * Architecture: Middleware layer — applied globally to all routes.
 * Security: Implements OWASP security headers, CORS, and rate limiting.
 *
 * References:
 * - architect.md § Security: "Defense in depth", "Secure by default"
 * - OWASP Secure Headers Project
 */

import cors from 'cors';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger, sanitizeRequestId } from '../utils/logger.js';

/**
 * Helmet — sets secure HTTP headers.
 * Disables CSP in development for easier debugging.
 */
export const helmetMiddleware: RequestHandler = helmet({
  contentSecurityPolicy: config.nodeEnv === 'production',
  crossOriginEmbedderPolicy: config.nodeEnv === 'production',
});

/**
 * CORS — restricts cross-origin access to configured origins.
 */
export const corsMiddleware: RequestHandler = cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
});

/**
 * Rate limiter — prevents abuse and brute-force attacks.
 */
export const rateLimitMiddleware: RequestHandler = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
});

/**
 * Request ID — injects a unique ID for distributed tracing.
 *
 * Security (Milestone 5): Sanitizes user-supplied x-request-id headers
 * to prevent log forging and XSS in monitoring dashboards.
 * Only allows [a-zA-Z0-9-], truncated to 64 chars.
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const raw = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = sanitizeRequestId(raw);
  next();
}

/**
 * Request logger — logs every incoming request with timing.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
}
