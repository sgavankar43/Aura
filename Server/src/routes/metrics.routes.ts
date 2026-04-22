/**
 * Metrics Routes — Exposes telemetry data via HTTP.
 *
 * Architecture: Route layer — maps HTTP endpoints to handlers.
 *
 * Endpoints:
 * - GET /api/metrics — returns all counters and histograms as JSON.
 *
 * Security: Protected by auth middleware in production.
 * Only authenticated users can access metrics.
 *
 * Milestone 5: Advanced Telemetry & Request Correlation.
 */

import { Router, Request, Response } from 'express';
import { metrics } from '../utils/metrics.js';

const router = Router();

/**
 * GET /api/metrics
 * Returns a snapshot of all tracked counters and histograms.
 */
router.get('/', (_req: Request, res: Response) => {
  const snapshot = metrics.snapshot();
  res.json({
    timestamp: new Date().toISOString(),
    ...snapshot,
  });
});

export default router;
