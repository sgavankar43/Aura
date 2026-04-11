/**
 * Health check routes.
 *
 * Architecture: Route layer — maps HTTP endpoints to controllers.
 * Dependency direction: Routes → Controllers (never the reverse).
 */

import { Router } from 'express';
import { healthCheck, readinessCheck } from '../controllers/health.controller.js';

const router = Router();

/** GET /health — liveness probe */
router.get('/health', healthCheck);

/** GET /ready — readiness probe */
router.get('/ready', readinessCheck);

export default router;
