/**
 * AuraClient — Feature flag client with zero-latency evaluation.
 *
 * Architecture: Core SDK class. Maintains an in-memory cache populated
 * from initial fetch + real-time WebSocket updates.
 *
 * Design pattern: Observer (onUpdate callbacks) + Strategy (ITransport, IFlagStorage).
 *
 * TypeScript: Generic `TFlags extends string` provides autocomplete for
 * flag keys when developers supply their known flag names.
 *
 * See: docs/adr/006-client-sdk.md
 */

import type { ITransport, IFlagStorage, FlagUpdateEvent, FlagUpdateCallback } from './types.js';

// --- Constructor Options (internal, not the user-facing config) ---

export interface AuraClientOptions {
  /** The real-time transport (Socket.io wrapper or mock) */
  transport: ITransport;
  /** The storage layer for offline persistence */
  storage: IFlagStorage;
  /** Flags fetched from the initial API call */
  initialFlags: Record<string, boolean>;
  /** Default flag values to use when no other source provides them */
  defaults?: Record<string, boolean>;
}

export class AuraClient<TFlags extends string = string> {
  private readonly cache: Map<string, boolean>;
  private readonly transport: ITransport;
  private readonly storage: IFlagStorage;
  private readonly listeners: Set<FlagUpdateCallback<TFlags>>;
  private destroyed = false;

  constructor(options: AuraClientOptions) {
    this.transport = options.transport;
    this.storage = options.storage;
    this.listeners = new Set();
    this.cache = new Map();

    // --- Initialize cache with priority: defaults → stored → initialFlags ---

    // 1. Load defaults (lowest priority)
    if (options.defaults) {
      for (const [key, value] of Object.entries(options.defaults)) {
        this.cache.set(key, value);
      }
    }

    // 2. Load from persistent storage (medium priority)
    const stored = this.storage.load();
    if (stored) {
      for (const [key, value] of Object.entries(stored)) {
        this.cache.set(key, value);
      }
    }

    // 3. Apply initial flags from server (highest priority)
    for (const [key, value] of Object.entries(options.initialFlags)) {
      this.cache.set(key, value);
    }

    // Persist the merged state
    this.persistToStorage();

    // --- Connect transport and listen for updates ---
    this.transport.onFlagUpdate((event) => this.handleFlagUpdate(event));
    this.transport.connect();
  }

  /**
   * Evaluate a feature flag.
   *
   * Zero-latency: reads from in-memory cache, no network call.
   * Returns `false` for unknown keys (safe default).
   */
  isEnabled(key: TFlags | string): boolean {
    return this.cache.get(key) ?? false;
  }

  /**
   * Get a snapshot of all flag values.
   *
   * Returns a copy — mutations won't affect the internal cache.
   */
  getAllFlags(): Record<string, boolean> {
    const snapshot: Record<string, boolean> = {};
    for (const [key, value] of this.cache) {
      snapshot[key] = value;
    }
    return snapshot;
  }

  /**
   * Register a callback for flag update notifications.
   *
   * Called whenever a flag changes (via WebSocket or cache update).
   * Returns an unsubscribe function.
   */
  onUpdate(callback: FlagUpdateCallback<TFlags>): () => void {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Tear down the client: disconnect transport, clear listeners.
   *
   * The cache is preserved (for offline access via storage),
   * but no more updates will be received or callbacks fired.
   */
  destroy(): void {
    this.destroyed = true;
    this.listeners.clear();
    this.transport.disconnect();
  }

  // --- Private ---

  private handleFlagUpdate(event: FlagUpdateEvent): void {
    if (this.destroyed) {
      return;
    }

    // Update cache
    this.cache.set(event.featureKey, event.enabled);

    // Persist to storage
    this.persistToStorage();

    // Notify listeners
    for (const listener of this.listeners) {
      listener(event.featureKey as TFlags, event.enabled, event);
    }
  }

  private persistToStorage(): void {
    this.storage.save(this.getAllFlags());
  }
}
