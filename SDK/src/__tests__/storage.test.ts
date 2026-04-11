/**
 * Storage Implementation Tests
 *
 * Tests cover MemoryStorage and BrowserStorage behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryStorage, BrowserStorage } from '../storage.js';

// =============================================================================
// MemoryStorage Tests
// =============================================================================

describe('MemoryStorage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('should return null when nothing is stored', () => {
    expect(storage.load()).toBeNull();
  });

  it('should save and load flags', () => {
    storage.save({ 'dark-mode': true, beta: false });
    expect(storage.load()).toEqual({ 'dark-mode': true, beta: false });
  });

  it('should return a copy on load (not a reference)', () => {
    storage.save({ 'flag-a': true });
    const loaded = storage.load();
    expect(loaded).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test asserted non-null above
    loaded!['flag-a'] = false;

    const reloaded = storage.load();
    expect(reloaded).not.toBeNull();
    expect(reloaded?.['flag-a']).toBe(true);
  });

  it('should clear stored flags', () => {
    storage.save({ 'flag-a': true });
    storage.clear();
    expect(storage.load()).toBeNull();
  });

  it('should overwrite on subsequent saves', () => {
    storage.save({ 'flag-a': true });
    storage.save({ 'flag-b': false });
    expect(storage.load()).toEqual({ 'flag-b': false });
  });
});

// =============================================================================
// BrowserStorage Tests
// =============================================================================

describe('BrowserStorage', () => {
  let storage: BrowserStorage;
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};

    // Mock globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
      },
      writable: true,
      configurable: true,
    });

    storage = new BrowserStorage('test_flags');
  });

  it('should return null when localStorage is empty', () => {
    expect(storage.load()).toBeNull();
  });

  it('should save to localStorage as JSON', () => {
    storage.save({ 'dark-mode': true });
    expect(mockLocalStorage['test_flags']).toBe('{"dark-mode":true}');
  });

  it('should load from localStorage', () => {
    mockLocalStorage['test_flags'] = '{"dark-mode":true,"beta":false}';
    expect(storage.load()).toEqual({ 'dark-mode': true, beta: false });
  });

  it('should clear from localStorage', () => {
    storage.save({ flag: true });
    storage.clear();
    expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('test_flags');
  });

  it('should use default storage key when not specified', () => {
    const defaultStorage = new BrowserStorage();
    defaultStorage.save({ test: true });
    expect(mockLocalStorage['aura_flags']).toBe('{"test":true}');
  });

  it('should handle corrupted JSON gracefully', () => {
    mockLocalStorage['test_flags'] = 'not-valid-json{{{';
    expect(storage.load()).toBeNull();
  });
});
