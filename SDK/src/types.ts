/**
 * Aura SDK Types
 *
 * Architecture: Pure type definitions — no runtime code.
 * These types define the public API contract for the SDK.
 *
 * TypeScript Reviewer: Uses generic `TFlags extends string` to provide
 * autocomplete for flag keys when developers define their known flags.
 *
 * See: docs/adr/006-client-sdk.md
 */

// --- Configuration ---

/** Storage strategy for offline mode */
export type StorageStrategy = 'memory' | 'localStorage';

/** Configuration for initializing the AuraClient */
export interface AuraClientConfig {
  /** The project's API key (from the Aura dashboard) */
  apiKey: string;
  /** The Aura server URL (e.g., 'https://aura.example.com') */
  serverUrl: string;
  /** The environment slug to evaluate flags against (e.g., 'dev', 'prod') */
  environment: string;
  /** Storage strategy for offline fallback. Default: 'memory' */
  storage?: StorageStrategy;
  /** Custom storage key prefix for localStorage. Default: 'aura_flags' */
  storageKey?: string;
  /** Initial flag values to use before the first fetch. Default: {} */
  defaults?: Record<string, boolean>;
  /** Timeout for the initial fetch in ms. Default: 5000 */
  fetchTimeoutMs?: number;
}

// --- Events ---

/** Payload received from the server when a flag changes */
export interface FlagUpdateEvent {
  /** The project this flag belongs to */
  projectId: string;
  /** The environment where the state changed */
  environmentId: string;
  /** The feature key that was toggled */
  featureKey: string;
  /** The new enabled/disabled value */
  enabled: boolean;
  /** Who triggered the change */
  source: string;
  /** ISO 8601 timestamp */
  timestamp: string;
}

/** Callback for flag update notifications */
export type FlagUpdateCallback<TFlags extends string = string> = (
  key: TFlags,
  enabled: boolean,
  event: FlagUpdateEvent,
) => void;

// --- Flag Cache ---

/** Read-only snapshot of all flag values */
export type FlagSnapshot<TFlags extends string = string> = Record<TFlags, boolean>;

// --- Transport Interface ---

/**
 * Contract for the real-time transport layer.
 * Decoupled from Socket.io for testability — tests inject a mock.
 */
export interface ITransport {
  /** Connect to the server */
  connect(): void;
  /** Disconnect from the server */
  disconnect(): void;
  /** Register a listener for flag update events */
  onFlagUpdate(callback: (event: FlagUpdateEvent) => void): void;
  /** Check if connected */
  isConnected(): boolean;
}

// --- Storage Interface ---

/**
 * Contract for flag persistence (offline mode).
 * Decoupled from localStorage for testability.
 */
export interface IFlagStorage {
  /** Save flags to persistent storage */
  save(flags: Record<string, boolean>): void;
  /** Load flags from persistent storage. Returns null if nothing stored. */
  load(): Record<string, boolean> | null;
  /** Clear stored flags */
  clear(): void;
}
