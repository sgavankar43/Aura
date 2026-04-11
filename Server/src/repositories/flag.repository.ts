/**
 * Flag Repository — Prisma-backed data access for the Flag Engine.
 *
 * Architecture: Repository layer — abstracts all Prisma queries.
 * Imports from: Models (types/interfaces), Utils.
 * Imported by: Services (via IFlagRepository interface).
 *
 * This is the production implementation. Tests use InMemoryFlagRepository.
 */

import type { PrismaClient } from '@prisma/client';
import type {
  Feature,
  Environment,
  FlagState,
  IFlagRepository,
} from '../models/flag.models.js';

export class FlagRepository implements IFlagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getFeature(projectId: string, featureKey: string): Promise<Feature | null> {
    return this.prisma.feature.findFirst({
      where: {
        projectId,
        key: featureKey,
        archivedAt: null, // Exclude archived features
      },
    });
  }

  async getFlagState(featureId: string, environmentId: string): Promise<FlagState | null> {
    return this.prisma.flagState.findUnique({
      where: {
        featureId_environmentId: {
          featureId,
          environmentId,
        },
      },
    });
  }

  async getEnvironment(projectId: string, envSlug: string): Promise<Environment | null> {
    return this.prisma.environment.findUnique({
      where: {
        projectId_slug: {
          projectId,
          slug: envSlug,
        },
      },
    });
  }

  async getFeaturesByProject(projectId: string): Promise<Feature[]> {
    return this.prisma.feature.findMany({
      where: {
        projectId,
        archivedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getFlagStatesByEnvironment(environmentId: string): Promise<FlagState[]> {
    return this.prisma.flagState.findMany({
      where: { environmentId },
    });
  }
}
