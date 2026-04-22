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

// --- Request Context for Observability ---

/**
 * Propagation context threaded through the service layer.
 * Enables distributed tracing: every log entry, metric, and Pub/Sub event
 * can be correlated back to the originating HTTP request.
 *
 * Milestone 5: Advanced Telemetry & Request Correlation.
 */
export interface AuraContext {
  /** Unique request identifier for distributed tracing */
  requestId: string;
  /** Authenticated user ID (if available) */
  userId?: string;
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

  /**
   * Upsert a flag state for a given feature and environment.
   * Creates or updates the FlagState record and returns the result.
   */
  upsertFlagState(
    featureId: string,
    environmentId: string,
    enabled: boolean,
    updatedBy: string | null,
  ): Promise<FlagState>;

  /**
   * Get a project by its API key.
   * Used for WebSocket handshake authentication.
   * Returns null if no project matches the key or the project is archived.
   */
  getProjectByApiKey(apiKey: string): Promise<Project | null>;
}

// --- Pub/Sub Event Types ---

/**
 * Payload broadcast via Redis Pub/Sub when a flag state changes.
 * Subscribers (WebSocket gateways, other server instances) use this
 * to push real-time updates to connected clients.
 *
 * See: docs/adr/004-redis-pubsub-flag-sync.md
 */
export interface FlagUpdateEvent {
  /** The project this flag belongs to */
  projectId: string;
  /** The environment where the state changed */
  environmentId: string;
  /** The feature key that was toggled */
  featureKey: string;
  /** The new enabled/disabled value */
  enabled: boolean;
  /** Who triggered the change (user ID, API key, "system") */
  source: string;
  /** ISO 8601 timestamp of the change */
  timestamp: string;
  /** Links this event back to the originating HTTP request (Milestone 5) */
  correlationId: string;
}

// --- Pub/Sub Service Interface ---

/**
 * Contract for publishing flag update events.
 *
 * Architecture: Defined in the Model layer (dependency inversion)
 * so Services depend on the interface, not the concrete Redis class.
 * This enables testing with a mock/spy IPubSubService.
 */
export interface IPubSubService {
  /**
   * Publish a flag update event to the real-time channel.
   * Returns the number of subscribers that received the message.
   */
  publishFlagUpdate(event: FlagUpdateEvent): Promise<number>;

  /**
   * Gracefully close the underlying connection (Redis client).
   */
  disconnect(): Promise<void>;
}
