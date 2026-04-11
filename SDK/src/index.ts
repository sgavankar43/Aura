/**
 * @aura/sdk — Public API
 *
 * Feature flag client SDK with zero-latency evaluation and real-time updates.
 *
 * @example
 * ```typescript
 * import { init, AuraClient } from '@aura/sdk';
 *
 * // Define your flag keys for autocomplete
 * type MyFlags = 'dark-mode' | 'new-dashboard' | 'beta-feature';
 *
 * // Initialize the client
 * const client = await init<MyFlags>({
 *   apiKey: process.env.AURA_API_KEY,
 *   serverUrl: 'https://aura.example.com',
 *   environment: 'production',
 *   storage: 'localStorage', // Persist flags for offline access
 * });
 *
 * // Evaluate flags (zero-latency — reads from in-memory cache)
 * if (client.isEnabled('dark-mode')) {
 *   enableDarkMode();
 * }
 *
 * // Listen for real-time updates
 * const unsub = client.onUpdate((key, enabled) => {
 *   console.log(`Flag ${key} is now ${enabled}`);
 * });
 *
 * // Cleanup when done
 * client.destroy();
 * ```
 *
 * @packageDocumentation
 */

// --- Primary API ---
export { init } from './init.js';
export { AuraClient } from './client.js';

// --- Types ---
export type {
  AuraClientConfig,
  FlagUpdateEvent,
  FlagUpdateCallback,
  FlagSnapshot,
  StorageStrategy,
  ITransport,
  IFlagStorage,
} from './types.js';

// --- Storage Strategies (for advanced usage) ---
export { MemoryStorage, BrowserStorage } from './storage.js';
export { SocketTransport } from './transport.js';
