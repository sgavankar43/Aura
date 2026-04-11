/**
 * Centralized error handling middleware.
 *
 * Architecture: Middleware layer — last in the middleware chain.
 * Security: Sanitizes error responses in production (no stack traces).
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler — catches all unhandled errors.
 *
 * - Logs the full error (including stack) server-side
 * - Returns sanitized error to client (no internals in production)
 * - Distinguishes operational errors (expected) from programmer errors
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode || 500;
  const requestId = req.headers['x-request-id'] as string;

  // Always log the full error server-side
  logger.error('Unhandled error', {
    requestId,
    statusCode,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Sanitize response based on environment
  const response: Record<string, unknown> = {
    status: statusCode,
    error: statusCode >= 500 ? 'Internal Server Error' : err.message,
    requestId,
  };

  // Only include details in development
  if (config.nodeEnv === 'development') {
    response['stack'] = err.stack;
    response['details'] = err.message;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler — catches requests to undefined routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.headers['x-request-id'],
  });
}
