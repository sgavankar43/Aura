/**
 * FlagService Integration Tests — updateFlagState + PubSub broadcasting.
 *
 * TDD: Written FIRST for the Milestone 2 PubSub integration.
 *
 * Tests cover:
 * 1. updateFlagState persists the change via the repository
 * 2. updateFlagState broadcasts via PubSub with correct event payload
 * 3. PubSub failure does NOT fail the mutation (best-effort broadcast)
 * 4. updateFlagState returns null for invalid environment/feature
 * 5. FlagService works without PubSub (optional dependency)
 * 6. Updated flag state is reflected in subsequent evaluateFlag calls
 *
 * Architecture: Uses InMemoryFlagRepository (fake) and a mock IPubSubService.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  Feature,
  Environment,
  FlagState,
  IPubSubService,
  FlagUpdateEvent,
} from '../../models/flag.models.js';
import { FlagService } from '../../services/flag.service.js';
import { InMemoryFlagRepository } from '../helpers/InMemoryFlagRepository.js';

// =============================================================================
// Mock PubSub
// =============================================================================

function createMockPubSub(): IPubSubService & { publishFlagUpdate: ReturnType<typeof vi.fn> } {
  return {
    publishFlagUpdate: vi.fn<[FlagUpdateEvent], Promise<number>>().mockResolvedValue(1),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

// =============================================================================
// Test Fixtures
// =============================================================================

const PROJECT_ID = 'project-001';
const ENV_DEV_ID = 'env-dev-001';
const ENV_PROD_ID = 'env-prod-001';

const devEnvironment: Environment = {
  id: ENV_DEV_ID,
  name: 'Development',
  slug: 'dev',
  color: '#10B981',
  sortOrder: 0,
  projectId: PROJECT_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const prodEnvironment: Environment = {
  id: ENV_PROD_ID,
  name: 'Production',
  slug: 'prod',
  color: '#EF4444',
  sortOrder: 1,
  projectId: PROJECT_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const darkModeFeature: Feature = {
  id: 'feature-dark-mode',
  key: 'dark-mode',
  name: 'Dark Mode',
  description: 'Enable dark mode UI',
  defaultEnabled: false,
  projectId: PROJECT_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  archivedAt: null,
};

// =============================================================================
// Tests
// =============================================================================

describe('FlagService — updateFlagState + PubSub', () => {
  let repository: InMemoryFlagRepository;
  let mockPubSub: ReturnType<typeof createMockPubSub>;
  let flagService: FlagService;

  beforeEach(() => {
    repository = new InMemoryFlagRepository();
    repository.seedEnvironments([devEnvironment, prodEnvironment]);
    repository.seedFeatures([darkModeFeature]);
    repository.seedFlagStates([]); // Start with no states

    mockPubSub = createMockPubSub();
    flagService = new FlagService(repository, mockPubSub);
  });

  // =========================================================================
  // Persisting State Changes
  // =========================================================================

  describe('persisting flag state', () => {
    it('should create a new FlagState when none exists', async () => {
      const result = await flagService.updateFlagState(
        PROJECT_ID, 'dev', 'dark-mode', true, 'user-123',
      );

      expect(result).not.toBeNull();
      expect(result!.flagState.enabled).toBe(true);
      expect(result!.flagState.featureId).toBe('feature-dark-mode');
      expect(result!.flagState.environmentId).toBe(ENV_DEV_ID);
    });

    it('should update an existing FlagState', async () => {
      // First create
      await flagService.updateFlagState(PROJECT_ID, 'dev', 'dark-mode', true, 'user-123');
      // Then update
      const result = await flagService.updateFlagState(
        PROJECT_ID, 'dev', 'dark-mode', false, 'user-456',
      );

      expect(result).not.toBeNull();
      expect(result!.flagState.enabled).toBe(false);
    });

    it('should reflect the change in subsequent evaluateFlag calls', async () => {
      // Before update: no FlagState → fallback to default (false)
      const before = await flagService.evaluateFlag(PROJECT_ID, 'dev', 'dark-mode');
      expect(before.enabled).toBe(false);
      expect(before.source).toBe('default');

      // Perform update
      await flagService.updateFlagState(PROJECT_ID, 'dev', 'dark-mode', true, 'user-123');

      // After update: FlagState exists → true
      const after = await flagService.evaluateFlag(PROJECT_ID, 'dev', 'dark-mode');
      expect(after.enabled).toBe(true);
      expect(after.source).toBe('flag_state');
    });
  });

  // =========================================================================
  // PubSub Broadcasting
  // =========================================================================

  describe('PubSub broadcasting', () => {
    it('should call publishFlagUpdate after persisting the change', async () => {
      await flagService.updateFlagState(PROJECT_ID, 'dev', 'dark-mode', true, 'user-123');

      expect(mockPubSub.publishFlagUpdate).toHaveBeenCalledTimes(1);
    });

    it('should publish a FlagUpdateEvent with the correct fields', async () => {
      await flagService.updateFlagState(PROJECT_ID, 'dev', 'dark-mode', true, 'user-123');

      const publishedEvent = mockPubSub.publishFlagUpdate.mock.calls[0][0] as FlagUpdateEvent;

      expect(publishedEvent.projectId).toBe(PROJECT_ID);
      expect(publishedEvent.environmentId).toBe(ENV_DEV_ID);
      expect(publishedEvent.featureKey).toBe('dark-mode');
      expect(publishedEvent.enabled).toBe(true);
      expect(publishedEvent.source).toBe('user-123');
      expect(publishedEvent.timestamp).toBeDefined();
      // Verify timestamp is a valid ISO 8601 string
      expect(new Date(publishedEvent.timestamp).toISOString()).toBe(publishedEvent.timestamp);
    });

    it('should report published=true and subscriber count on success', async () => {
      mockPubSub.publishFlagUpdate.mockResolvedValue(5);

      const result = await flagService.updateFlagState(
        PROJECT_ID, 'dev', 'dark-mode', true, 'user-123',
      );

      expect(result!.published).toBe(true);
      expect(result!.subscriberCount).toBe(5);
    });

    it('should NOT fail the mutation when PubSub publish fails', async () => {
      mockPubSub.publishFlagUpdate.mockRejectedValue(new Error('Redis down'));

      const result = await flagService.updateFlagState(
        PROJECT_ID, 'dev', 'dark-mode', true, 'user-123',
      );

      // The mutation itself should succeed
      expect(result).not.toBeNull();
      expect(result!.flagState.enabled).toBe(true);
      // But broadcast failed
      expect(result!.published).toBe(false);
      expect(result!.subscriberCount).toBe(0);
    });

    it('should not call PubSub when feature is not found', async () => {
      const result = await flagService.updateFlagState(
        PROJECT_ID, 'dev', 'nonexistent', true, 'user-123',
      );

      expect(result).toBeNull();
      expect(mockPubSub.publishFlagUpdate).not.toHaveBeenCalled();
    });

    it('should not call PubSub when environment is not found', async () => {
      const result = await flagService.updateFlagState(
        PROJECT_ID, 'staging', 'dark-mode', true, 'user-123',
      );

      expect(result).toBeNull();
      expect(mockPubSub.publishFlagUpdate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Without PubSub (optional dependency)
  // =========================================================================

  describe('without PubSub configured', () => {
    it('should still persist state changes when PubSub is not provided', async () => {
      const serviceWithoutPubSub = new FlagService(repository);

      const result = await serviceWithoutPubSub.updateFlagState(
        PROJECT_ID, 'dev', 'dark-mode', true, 'user-123',
      );

      expect(result).not.toBeNull();
      expect(result!.flagState.enabled).toBe(true);
      expect(result!.published).toBe(false);
      expect(result!.subscriberCount).toBe(0);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('edge cases', () => {
    it('should return null for empty project ID', async () => {
      const result = await flagService.updateFlagState('', 'dev', 'dark-mode', true, 'user-123');
      expect(result).toBeNull();
    });

    it('should return null for empty environment slug', async () => {
      const result = await flagService.updateFlagState(PROJECT_ID, '', 'dark-mode', true, 'user-123');
      expect(result).toBeNull();
    });

    it('should return null for empty feature key', async () => {
      const result = await flagService.updateFlagState(PROJECT_ID, 'dev', '', true, 'user-123');
      expect(result).toBeNull();
    });
  });
});
