import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import {
  listFeatures,
  createFeature,
  updateFeature,
  archiveFeature,
  toggleFlag,
} from '../controllers/features.controller.js';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  archiveProject,
  listEnvironments,
  createEnvironment,
} from '../controllers/projects.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.patch('/:id', updateProject);
router.delete('/:id', archiveProject);

router.get('/:id/environments', listEnvironments);
router.post('/:id/environments', createEnvironment);

// Features & Flags
router.get('/:id/features', listFeatures);
router.post('/:id/features', createFeature);
router.patch('/:id/features/:key', updateFeature);
router.delete('/:id/features/:key', archiveFeature);

router.patch('/:id/flags/:envSlug/:key', toggleFlag);

// Audit Logs
router.get('/:id/audit-logs', getAuditLogs);

export default router;
