/**
 * Express application factory.
 *
 * Architecture: Separating app creation from server start enables
 * testing via supertest without binding to a port (TDD best practice).
 *
 * Middleware order matters:
 * 1. Request ID (for tracing)
 * 2. Security headers (helmet)
 * 3. CORS
 * 4. Rate limiting
 * 5. Body parsing
 * 6. Security audit logging
 * 7. Request logging
 * 8. Routes
 * 9. 404 handler
 * 10. Error handler
 */

import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  helmetMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  requestIdMiddleware,
  requestLoggerMiddleware,
} from './middleware/security.js';
import { securityAuditMiddleware } from './middleware/securityAudit.js';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import projectsRoutes from './routes/projects.routes.js';

export function createApp(): express.Application {
  const app = express();

  // --- Security & Infrastructure Middleware ---
  app.use(requestIdMiddleware);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(rateLimitMiddleware);

  // --- Body Parsing ---
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- Audit & Logging ---
  app.use(securityAuditMiddleware);
  app.use(requestLoggerMiddleware);

  // --- Routes ---
  app.use(healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectsRoutes);

  // --- Error Handling (must be last) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
