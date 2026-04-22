/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Features Controller — CRUD for feature flags + flag toggling.
 *
 * Architecture: Controller layer — handles HTTP requests.
 * Imports from: Prisma (direct), PubSubService.
 * Imported by: Routes.
 *
 * Milestone 5: Constructs AuraContext from the Express request
 * and threads correlationId through Pub/Sub events.
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import type { AuraContext } from '../models/flag.models.js';
import { PubSubService } from '../services/pubsub.service.js';

const prisma = new PrismaClient();

// Use REDIS_URL from environment (fixes hardcoded URL that bypassed .env password)
const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
const pubSubService = PubSubService.create(redisUrl);

/**
 * Build an AuraContext from an Express request.
 * Extracts requestId from the sanitized x-request-id header
 * and userId from the authenticated JWT payload.
 */
function buildContext(req: Request): AuraContext {
  return {
    requestId: (req.headers['x-request-id'] as string) || 'unknown',
    userId: req.user?.userId,
  };
}

export async function listFeatures(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const features = await prisma.feature.findMany({
      where: { projectId: id, archivedAt: null },
      include: {
        flagStates: {
          include: { environment: true },
        },
      },
    });

    // Reshape to FeatureWithStates interface
    const reshaped = features.map((f) => {
      const states: Record<string, boolean> = {};
      for (const fs of f.flagStates) {
        states[fs.environment.slug] = fs.enabled;
      }
      return {
        id: f.id,
        key: f.key,
        name: f.name,
        description: f.description,
        defaultEnabled: f.defaultEnabled,
        states,
      };
    });

    res.json({ features: reshaped });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to list features' });
  }
}

export async function createFeature(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { key, name, description, defaultEnabled } = req.body;

  if (!key || !name) {
    res.status(400).json({ error: 'Key and name required' });
    return;
  }

  try {
    const feature = await prisma.feature.create({
      data: {
        key,
        name,
        description,
        defaultEnabled: defaultEnabled ?? false,
        projectId: id,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'feature.created',
        entity: 'Feature',
        entityId: feature.id,
        projectId: id,
        userId: req.user!.userId,
        metadata: { featureKey: key },
      },
    });

    res.status(201).json({ feature });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to create feature' });
  }
}

export async function updateFeature(req: Request, res: Response): Promise<void> {
  const { id, key } = req.params;
  const { name, description, defaultEnabled } = req.body;

  try {
    const feature = await prisma.feature.update({
      where: { projectId_key: { projectId: id, key } },
      data: { name, description, defaultEnabled },
    });

    res.json({ feature });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to update feature' });
  }
}

export async function archiveFeature(req: Request, res: Response): Promise<void> {
  const { id, key } = req.params;

  try {
    const feature = await prisma.feature.update({
      where: { projectId_key: { projectId: id, key } },
      data: { archivedAt: new Date() },
    });
    res.json({ feature });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to archive feature' });
  }
}

// eslint-disable-next-line max-lines-per-function
export async function toggleFlag(req: Request, res: Response): Promise<void> {
  const { id, envSlug, key } = req.params;
  const { enabled } = req.body;
  const ctx = buildContext(req);

  if (typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'enabled must be a boolean' });
    return;
  }

  try {
    const env = await prisma.environment.findUnique({
      where: { projectId_slug: { projectId: id, slug: envSlug } },
    });
    const feature = await prisma.feature.findUnique({
      where: { projectId_key: { projectId: id, key } },
    });

    if (!env || !feature) {
      res.status(404).json({ error: 'Environment or Feature not found' });
      return;
    }

    const flagState = await prisma.flagState.upsert({
      where: { featureId_environmentId: { featureId: feature.id, environmentId: env.id } },
      update: { enabled, updatedBy: req.user!.userId },
      create: {
        enabled,
        updatedBy: req.user!.userId,
        featureId: feature.id,
        environmentId: env.id,
      },
    });

    // Log the toggle
    await prisma.auditLog.create({
      data: {
        action: 'flag.toggled',
        entity: 'FlagState',
        entityId: flagState.id,
        projectId: id,
        userId: req.user!.userId,
        metadata: { featureKey: key, envSlug, enabled },
      },
    });

    // Broadcast the update via pub/sub with correlationId for distributed tracing
    await pubSubService.publishFlagUpdate({
      projectId: id,
      environmentId: env.id,
      featureKey: key,
      enabled,
      source: req.user!.userId,
      timestamp: new Date().toISOString(),
      correlationId: ctx.requestId,
    });

    res.json({ flagState });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to toggle flag' });
  }
}
