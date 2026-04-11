/**
 * In-Memory Flag Repository — test fake.
 *
 * Architecture: Test helper — implements IFlagRepository with in-memory
 * storage so tests run without a database. This is NOT a mock — it has
 * real behavior (filtering, lookups) matching the Prisma implementation.
 *
 * TDD pattern: Fakes over mocks for repositories — they validate real
 * query logic without database I/O.
 */

import type {
  Feature,
  Environment,
  FlagState,
  IFlagRepository,
} from '../../models/flag.models.js';

export class InMemoryFlagRepository implements IFlagRepository {
  private features: Feature[] = [];
  private environments: Environment[] = [];
  private flagStates: FlagState[] = [];

  // --- Seed methods for test setup ---

  seedFeatures(features: Feature[]): void {
    this.features = [...features];
  }

  seedEnvironments(environments: Environment[]): void {
    this.environments = [...environments];
  }

  seedFlagStates(states: FlagState[]): void {
    this.flagStates = [...states];
  }

  // --- IFlagRepository implementation ---

  async getFeature(projectId: string, featureKey: string): Promise<Feature | null> {
    return (
      this.features.find(
        (f) => f.projectId === projectId && f.key === featureKey && f.archivedAt === null,
      ) ?? null
    );
  }

  async getFlagState(featureId: string, environmentId: string): Promise<FlagState | null> {
    return (
      this.flagStates.find(
        (s) => s.featureId === featureId && s.environmentId === environmentId,
      ) ?? null
    );
  }

  async getEnvironment(projectId: string, envSlug: string): Promise<Environment | null> {
    return (
      this.environments.find(
        (e) => e.projectId === projectId && e.slug === envSlug,
      ) ?? null
    );
  }

  async getFeaturesByProject(projectId: string): Promise<Feature[]> {
    return this.features.filter(
      (f) => f.projectId === projectId && f.archivedAt === null,
    );
  }

  async getFlagStatesByEnvironment(environmentId: string): Promise<FlagState[]> {
    return this.flagStates.filter((s) => s.environmentId === environmentId);
  }
}
