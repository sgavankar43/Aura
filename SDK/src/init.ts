/**
 * AuraClient.init() — High-level factory for initializing the SDK.
 *
 * This is the primary entry point for consumers:
 *
 *   import { init } from '@aura/sdk';
 *   const client = await init({ apiKey, serverUrl, environment });
 *   client.isEnabled('dark-mode');
 *
 * Handles:
 * 1. Creating the transport (Socket.io) and storage (memory or localStorage)
 * 2. Fetching initial flags from the server via REST
 * 3. Falling back to storage/defaults on fetch failure
 * 4. Constructing and returning the AuraClient
 */

import { AuraClient } from './client.js';
import { MemoryStorage, BrowserStorage } from './storage.js';
import { SocketTransport } from './transport.js';
import type { AuraClientConfig, IFlagStorage } from './types.js';

/**
 * Initialize the Aura SDK.
 *
 * Connects to the Aura server, fetches initial flag state, and establishes
 * a real-time WebSocket connection for live updates.
 *
 * @example
 * ```typescript
 * type MyFlags = 'dark-mode' | 'new-dashboard';
 * const client = await init<MyFlags>({
 *   apiKey: process.env.AURA_API_KEY,
 *   serverUrl: 'https://aura.example.com',
 *   environment: 'production',
 * });
 * client.isEnabled('dark-mode'); // ✅ autocomplete
 * ```
 */
export async function init<TFlags extends string = string>(
  config: AuraClientConfig,
): Promise<AuraClient<TFlags>> {
  // 1. Create storage
  const storage = createStorage(config);

  // 2. Fetch initial flags from the server
  let initialFlags: Record<string, boolean> = {};
  try {
    initialFlags = await fetchFlags(config);
  } catch {
    // Fetch failed — will fall back to stored/default values
  }

  // 3. Create transport
  const transport = new SocketTransport(config.serverUrl, config.apiKey);

  // 4. Construct and return the client
  return new AuraClient<TFlags>({
    transport,
    storage,
    initialFlags,
    defaults: config.defaults,
  });
}

// --- Internal helpers ---

function createStorage(config: AuraClientConfig): IFlagStorage {
  const strategy = config.storage ?? 'memory';
  const storageKey = config.storageKey ?? 'aura_flags';

  switch (strategy) {
    case 'localStorage':
      return new BrowserStorage(storageKey);
    case 'memory':
    default:
      return new MemoryStorage();
  }
}

async function fetchFlags(config: AuraClientConfig): Promise<Record<string, boolean>> {
  const url = `${config.serverUrl}/api/flags/${config.environment}`;
  const timeoutMs = config.fetchTimeoutMs ?? 5000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'x-aura-api-key': config.apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Flag fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as Array<{ key: string; enabled: boolean }>;

    // Convert array of { key, enabled } to Record<string, boolean>
    const flags: Record<string, boolean> = {};
    for (const flag of data) {
      flags[flag.key] = flag.enabled;
    }
    return flags;
  } finally {
    clearTimeout(timeout);
  }
}
