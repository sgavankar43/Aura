/**
 * Flag Service — flag evaluation and mutation business logic.
 *
 * Architecture: Service layer — contains business logic.
 * Imports from: Models (types), Repositories (via interface).
 * Imported by: Controllers.
 *
 * Dependency Injection: Takes an IFlagRepository and optional IPubSubService
 * in constructor, so it can be tested with fakes/mocks.
 *
 * Milestone 2: When a flag state is changed via updateFlagState(),
 * the service broadcasts the change via PubSub for real-time sync.
 */

import type {
  IFlagRepository,
  IPubSubService,
  FlagEvaluation,
  FlagUpdateEvent,
  FlagState,
} from '../models/flag.models.js';

/** Result of a flag state update operation */
export interface FlagUpdateResult {
  /** The updated flag state */
  flagState: FlagState;
  /** Whether PubSub broadcast succeeded */
  published: boolean;
  /** Number of subscribers that received the update */
  subscriberCount: number;
}

export class FlagService {
  constructor(
    private readonly repository: IFlagRepository,
    private readonly pubsub?: IPubSubService,
  ) {}

  /**
   * Evaluate a single feature flag for a given project and environment.
   *
   * Resolution order:
   * 1. Look up the environment by slug → if not found, return not_found
   * 2. Look up the feature by key → if not found (or archived), return not_found
   * 3. Look up the FlagState for (feature, environment) → if found, use it
   * 4. If no FlagState exists, fall back to Feature.defaultEnabled
   */
  async evaluateFlag(
    projectId: string,
    envSlug: string,
    featureKey: string,
  ): Promise<FlagEvaluation> {
    // Step 1: Resolve environment
    const environment = await this.repository.getEnvironment(projectId, envSlug);
    if (!environment) {
      return { key: featureKey, enabled: false, source: 'not_found' };
    }

    // Step 2: Resolve feature (excludes archived)
    const feature = await this.repository.getFeature(projectId, featureKey);
    if (!feature) {
      return { key: featureKey, enabled: false, source: 'not_found' };
    }

    // Step 3: Check for environment-specific override
    const flagState = await this.repository.getFlagState(feature.id, environment.id);
    if (flagState) {
      return { key: featureKey, enabled: flagState.enabled, source: 'flag_state' };
    }

    // Step 4: Fall back to default
    return { key: featureKey, enabled: feature.defaultEnabled, source: 'default' };
  }

  /**
   * Evaluate all feature flags for a project and environment.
   *
   * Returns an array of FlagEvaluation for every non-archived feature.
   * Each flag is resolved using the same logic as evaluateFlag.
   */
  async evaluateAllFlags(
    projectId: string,
    envSlug: string,
  ): Promise<FlagEvaluation[]> {
    // Step 1: Resolve environment
    const environment = await this.repository.getEnvironment(projectId, envSlug);
    if (!environment) {
      return [];
    }

    // Step 2: Get all non-archived features for the project
    const features = await this.repository.getFeaturesByProject(projectId);
    if (features.length === 0) {
      return [];
    }

    // Step 3: Get all flag states for the environment
    const flagStates = await this.repository.getFlagStatesByEnvironment(environment.id);
    const stateMap = new Map(flagStates.map((s) => [s.featureId, s]));

    // Step 4: Evaluate each feature
    return features.map((feature) => {
      const state = stateMap.get(feature.id);
      if (state) {
        return { key: feature.key, enabled: state.enabled, source: 'flag_state' as const };
      }
      return { key: feature.key, enabled: feature.defaultEnabled, source: 'default' as const };
    });
  }

  /**
   * Update a flag state for a given project, environment, and feature.
   *
   * 1. Resolves the environment and feature
   * 2. Upserts the FlagState in the repository
   * 3. Broadcasts the change via PubSub (if configured)
   *
   * Returns null if the environment or feature can't be found.
   */
  async updateFlagState(
    projectId: string,
    envSlug: string,
    featureKey: string,
    enabled: boolean,
    updatedBy: string,
  ): Promise<FlagUpdateResult | null> {
    // Step 1: Resolve environment
    const environment = await this.repository.getEnvironment(projectId, envSlug);
    if (!environment) {
      return null;
    }

    // Step 2: Resolve feature (excludes archived)
    const feature = await this.repository.getFeature(projectId, featureKey);
    if (!feature) {
      return null;
    }

    // Step 3: Persist the state change
    const flagState = await this.repository.upsertFlagState(
      feature.id,
      environment.id,
      enabled,
      updatedBy,
    );

    // Step 4: Broadcast via PubSub (best-effort — don't fail the mutation)
    let published = false;
    let subscriberCount = 0;

    if (this.pubsub) {
      try {
        const event: FlagUpdateEvent = {
          projectId,
          environmentId: environment.id,
          featureKey,
          enabled,
          source: updatedBy,
          timestamp: new Date().toISOString(),
        };
        subscriberCount = await this.pubsub.publishFlagUpdate(event);
        published = true;
      } catch {
        // PubSub failures are non-critical — the DB write succeeded.
        // Log in production, but don't re-throw.
        published = false;
      }
    }

    return { flagState, published, subscriberCount };
  }
}
