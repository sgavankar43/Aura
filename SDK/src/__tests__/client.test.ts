/**
 * AuraClient Test Suite
 *
 * TDD: Written FIRST, before implementation (Red → Green → Refactor).
 *
 * Tests cover:
 * 1. isEnabled() returns cached values (zero-latency)
 * 2. Cache updates when WebSocket flag_updated event is received
 * 3. Offline mode — falls back to stored/default values
 * 4. onUpdate() callback fires on flag changes
 * 5. getAllFlags() returns full snapshot
 * 6. destroy() cleans up transport
 * 7. Type-safety (compile-time only — verified by TS compiler)
 *
 * Architecture: Uses mock ITransport and IFlagStorage to avoid
 * real Socket.io connections. Tests the AuraClient in isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuraClient } from '../client.js';
import type { ITransport, IFlagStorage, FlagUpdateEvent } from '../types.js';

// =============================================================================
// Mock Transport
// =============================================================================

class MockTransport implements ITransport {
  private _connected = false;
  private _callbacks: Array<(event: FlagUpdateEvent) => void> = [];

  connect(): void {
    this._connected = true;
  }

  disconnect(): void {
    this._connected = false;
  }

  onFlagUpdate(callback: (event: FlagUpdateEvent) => void): void {
    this._callbacks.push(callback);
  }

  isConnected(): boolean {
    return this._connected;
  }

  /** Test helper: simulate a flag_updated event from the server */
  simulateFlagUpdate(event: FlagUpdateEvent): void {
    for (const cb of this._callbacks) {
      cb(event);
    }
  }
}

// =============================================================================
// Mock Storage
// =============================================================================

class MockStorage implements IFlagStorage {
  private _data: Record<string, boolean> | null = null;
  readonly saveSpy = vi.fn();

  save(flags: Record<string, boolean>): void {
    this._data = { ...flags };
    this.saveSpy(flags);
  }

  load(): Record<string, boolean> | null {
    return this._data ? { ...this._data } : null;
  }

  clear(): void {
    this._data = null;
  }

  /** Test helper: pre-seed storage */
  seed(flags: Record<string, boolean>): void {
    this._data = { ...flags };
  }
}

// =============================================================================
// Helpers
// =============================================================================

function createEvent(overrides: Partial<FlagUpdateEvent> = {}): FlagUpdateEvent {
  return {
    projectId: 'project-001',
    environmentId: 'env-001',
    featureKey: 'dark-mode',
    enabled: true,
    source: 'user-123',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('AuraClient', () => {
  let transport: MockTransport;
  let storage: MockStorage;
  let client: AuraClient;

  beforeEach(() => {
    transport = new MockTransport();
    storage = new MockStorage();
  });

  // =========================================================================
  // Construction & Initialization
  // =========================================================================

  describe('construction', () => {
    it('should create a client with initial flags from fetch result', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': true, 'new-dashboard': false },
      });

      expect(client.isEnabled('dark-mode')).toBe(true);
      expect(client.isEnabled('new-dashboard')).toBe(false);
    });

    it('should connect the transport on creation', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: {},
      });

      expect(transport.isConnected()).toBe(true);
    });

    it('should persist initial flags to storage', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': true },
      });

      expect(storage.saveSpy).toHaveBeenCalledWith({ 'dark-mode': true });
    });
  });

  // =========================================================================
  // isEnabled — Zero-Latency Flag Evaluation
  // =========================================================================

  describe('isEnabled', () => {
    beforeEach(() => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': true, 'new-dashboard': false },
      });
    });

    it('should return true for an enabled flag', () => {
      expect(client.isEnabled('dark-mode')).toBe(true);
    });

    it('should return false for a disabled flag', () => {
      expect(client.isEnabled('new-dashboard')).toBe(false);
    });

    it('should return false for an unknown flag (safe default)', () => {
      expect(client.isEnabled('nonexistent-flag')).toBe(false);
    });
  });

  // =========================================================================
  // Cache Updates from WebSocket
  // =========================================================================

  describe('WebSocket cache updates', () => {
    beforeEach(() => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': false, 'new-dashboard': true },
      });
    });

    it('should update the cache when a flag_updated event is received', () => {
      expect(client.isEnabled('dark-mode')).toBe(false);

      transport.simulateFlagUpdate(
        createEvent({
          featureKey: 'dark-mode',
          enabled: true,
        }),
      );

      expect(client.isEnabled('dark-mode')).toBe(true);
    });

    it('should add a new flag to the cache from a WebSocket event', () => {
      expect(client.isEnabled('beta-feature')).toBe(false); // Unknown

      transport.simulateFlagUpdate(
        createEvent({
          featureKey: 'beta-feature',
          enabled: true,
        }),
      );

      expect(client.isEnabled('beta-feature')).toBe(true);
    });

    it('should persist updated flags to storage after WebSocket update', () => {
      storage.saveSpy.mockClear();

      transport.simulateFlagUpdate(
        createEvent({
          featureKey: 'dark-mode',
          enabled: true,
        }),
      );

      expect(storage.saveSpy).toHaveBeenCalled();
      const savedFlags = storage.saveSpy.mock.calls[0][0];
      expect(savedFlags['dark-mode']).toBe(true);
    });

    it('should handle a flag being disabled via WebSocket', () => {
      expect(client.isEnabled('new-dashboard')).toBe(true);

      transport.simulateFlagUpdate(
        createEvent({
          featureKey: 'new-dashboard',
          enabled: false,
        }),
      );

      expect(client.isEnabled('new-dashboard')).toBe(false);
    });
  });

  // =========================================================================
  // onUpdate — Event Callbacks
  // =========================================================================

  describe('onUpdate', () => {
    beforeEach(() => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': false },
      });
    });

    it('should fire the callback when a flag changes', () => {
      const callback = vi.fn();
      client.onUpdate(callback);

      const event = createEvent({ featureKey: 'dark-mode', enabled: true });
      transport.simulateFlagUpdate(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('dark-mode', true, event);
    });

    it('should support multiple listeners', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      client.onUpdate(cb1);
      client.onUpdate(cb2);

      transport.simulateFlagUpdate(createEvent({ featureKey: 'dark-mode', enabled: true }));

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('should return an unsubscribe function', () => {
      const callback = vi.fn();
      const unsub = client.onUpdate(callback);

      // Fire once — should be called
      transport.simulateFlagUpdate(createEvent({ featureKey: 'dark-mode', enabled: true }));
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsub();

      // Fire again — should NOT be called
      transport.simulateFlagUpdate(createEvent({ featureKey: 'dark-mode', enabled: false }));
      expect(callback).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  // =========================================================================
  // getAllFlags
  // =========================================================================

  describe('getAllFlags', () => {
    it('should return a snapshot of all flags', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': true, 'new-dashboard': false },
      });

      const flags = client.getAllFlags();
      expect(flags).toEqual({ 'dark-mode': true, 'new-dashboard': false });
    });

    it('should return a copy (not a reference to internal cache)', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': true },
      });

      const flags = client.getAllFlags();
      flags['dark-mode'] = false; // Mutate the copy

      // Internal state should be unaffected
      expect(client.isEnabled('dark-mode')).toBe(true);
    });

    it('should reflect WebSocket updates', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': false },
      });

      transport.simulateFlagUpdate(
        createEvent({
          featureKey: 'dark-mode',
          enabled: true,
        }),
      );

      expect(client.getAllFlags()['dark-mode']).toBe(true);
    });
  });

  // =========================================================================
  // Offline Mode / Storage Fallback
  // =========================================================================

  describe('offline mode', () => {
    it('should use stored flags when initialFlags is empty', () => {
      storage.seed({ 'cached-flag': true });

      client = new AuraClient({
        transport,
        storage,
        initialFlags: {},
      });

      expect(client.isEnabled('cached-flag')).toBe(true);
    });

    it('should prefer initialFlags over stored flags', () => {
      storage.seed({ 'dark-mode': false }); // Old stored value

      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': true }, // Fresh from server
      });

      expect(client.isEnabled('dark-mode')).toBe(true);
    });

    it('should use default values when provided', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: {},
        defaults: { 'dark-mode': true },
      });

      expect(client.isEnabled('dark-mode')).toBe(true);
    });

    it('should prioritize: initialFlags > stored > defaults', () => {
      storage.seed({ 'flag-a': false, 'flag-b': true });

      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'flag-a': true }, // Overrides storage
        defaults: { 'flag-c': true }, // Fills gaps
      });

      expect(client.isEnabled('flag-a')).toBe(true); // From initialFlags
      expect(client.isEnabled('flag-b')).toBe(true); // From storage
      expect(client.isEnabled('flag-c')).toBe(true); // From defaults
    });
  });

  // =========================================================================
  // destroy
  // =========================================================================

  describe('destroy', () => {
    it('should disconnect the transport', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: {},
      });

      expect(transport.isConnected()).toBe(true);
      client.destroy();
      expect(transport.isConnected()).toBe(false);
    });

    it('should not fire callbacks after destroy', () => {
      client = new AuraClient({
        transport,
        storage,
        initialFlags: { 'dark-mode': false },
      });

      const callback = vi.fn();
      client.onUpdate(callback);
      client.destroy();

      // Simulate an update after destroy — callback should NOT fire
      // (transport is disconnected, but testing the safety check)
      transport.simulateFlagUpdate(createEvent({ featureKey: 'dark-mode', enabled: true }));
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
