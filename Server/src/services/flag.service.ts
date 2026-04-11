/**
 * Flag Service — flag evaluation business logic.
 *
 * Architecture: Service layer — contains business logic.
 * Imports from: Models (types), Repositories (via interface).
 * Imported by: Controllers.
 *
 * Dependency Injection: Takes an IFlagRepository in constructor,
 * so it can be tested with InMemoryFlagRepository.
 */

import type { IFlagRepository, FlagEvaluation } from '../models/flag.models.js';

export class FlagService {
  constructor(private readonly repository: IFlagRepository) {}

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
}
