/**
 * Flag Engine domain types.
 *
 * Architecture: Model layer — pure types, no logic, no imports from other layers.
 * These mirror the Prisma schema but are decoupled from the ORM so the
 * repository can be tested with in-memory fakes.
 */

// --- Core Entities ---

export interface Project {
  id: string;
  name: string;
  description: string | null;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface Environment {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  sortOrder: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  defaultEnabled: boolean;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface FlagState {
  id: string;
  enabled: boolean;
  featureId: string;
  environmentId: string;
  updatedAt: Date;
  updatedBy: string | null;
}

// --- Flag Evaluation Result ---

export interface FlagEvaluation {
  /** The feature key being evaluated */
  key: string;
  /** Whether the flag is enabled */
  enabled: boolean;
  /** Where the value came from */
  source: 'flag_state' | 'default' | 'not_found';
}

// --- Repository Interface ---

/**
 * Contract for flag data access.
 *
 * Architecture: Defined in the Model layer so Services can depend on the
 * interface without importing the concrete Prisma-backed implementation.
 * This enables testing with in-memory fakes.
 */
export interface IFlagRepository {
  /**
   * Get a feature by project ID and feature key.
   * Returns null if the feature doesn't exist or is archived.
   */
  getFeature(projectId: string, featureKey: string): Promise<Feature | null>;

  /**
   * Get the environment-specific flag state for a feature.
   * Returns null if no override exists for this environment.
   */
  getFlagState(featureId: string, environmentId: string): Promise<FlagState | null>;

  /**
   * Get an environment by project ID and environment slug.
   * Returns null if the environment doesn't exist.
   */
  getEnvironment(projectId: string, envSlug: string): Promise<Environment | null>;

  /**
   * Get all features for a project (excluding archived).
   */
  getFeaturesByProject(projectId: string): Promise<Feature[]>;

  /**
   * Get all flag states for a given environment.
   */
  getFlagStatesByEnvironment(environmentId: string): Promise<FlagState[]>;
}
