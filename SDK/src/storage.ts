/**
 * Flag Storage implementations — offline persistence for feature flags.
 *
 * Architecture: Implements IFlagStorage with two strategies:
 * - MemoryStorage: In-memory only (Node.js, SSR, tests)
 * - LocalStorage: Browser localStorage (persists across page reloads)
 *
 * See: docs/adr/006-client-sdk.md § Offline Mode
 */

import type { IFlagStorage } from './types.js';

// =============================================================================
// Memory Storage
// =============================================================================

/**
 * In-memory flag storage. Flags are lost on page reload.
 * Use for: Node.js, SSR, or when persistence isn't needed.
 */
export class MemoryStorage implements IFlagStorage {
  private data: Record<string, boolean> | null = null;

  save(flags: Record<string, boolean>): void {
    this.data = { ...flags };
  }

  load(): Record<string, boolean> | null {
    return this.data ? { ...this.data } : null;
  }

  clear(): void {
    this.data = null;
  }
}

// =============================================================================
// LocalStorage
// =============================================================================

/**
 * Browser localStorage-backed flag storage.
 * Persists flags across page reloads for offline support.
 */
export class BrowserStorage implements IFlagStorage {
  constructor(private readonly storageKey: string = 'aura_flags') {}

  save(flags: Record<string, boolean>): void {
    try {
      const json = JSON.stringify(flags);
      globalThis.localStorage?.setItem(this.storageKey, json);
    } catch {
      // localStorage may be unavailable (SSR, private browsing, quota exceeded)
    }
  }

  load(): Record<string, boolean> | null {
    try {
      const json = globalThis.localStorage?.getItem(this.storageKey);
      if (!json) {
        return null;
      }
      return JSON.parse(json) as Record<string, boolean>;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      globalThis.localStorage?.removeItem(this.storageKey);
    } catch {
      // Ignore
    }
  }
}
