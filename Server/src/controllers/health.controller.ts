/**
 * Health check controller.
 *
 * Architecture: Controller layer — handles HTTP concerns, delegates to services.
 * Distributed systems pattern: /health for liveness, /ready for readiness.
 */

import type { Request, Response } from 'express';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, { status: string; latency?: string }>;
}

/**
 * Liveness probe — is the process alive?
 * Used by load balancers and container orchestrators (K8s, ECS, etc.)
 */
export function healthCheck(_req: Request, res: Response): void {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env['npm_package_version'] || '1.0.0',
    checks: {
      server: { status: 'up' },
      // Add database, cache, and external service checks here
    },
  };

  res.status(200).json(health);
}

/**
 * Readiness probe — is the service ready to accept traffic?
 * Returns 503 if dependencies (DB, cache) are not ready.
 */
export function readinessCheck(_req: Request, res: Response): void {
  const checks: Record<string, { status: string }> = {
    server: { status: 'ready' },
    // TODO: Add dependency checks (DB connection, cache ping, etc.)
  };

  const allReady = Object.values(checks).every((c) => c.status === 'ready');

  res.status(allReady ? 200 : 503).json({
    status: allReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  });
}
