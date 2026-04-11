/**
 * Flag Engine Test Suite
 *
 * TDD: Written FIRST, before implementation (Red → Green → Refactor).
 *
 * Tests cover:
 * 1. Single flag retrieval with environment-specific override
 * 2. Fallback to Feature.defaultEnabled when no FlagState exists
 * 3. Flag evaluation returns 'not_found' for unknown features
 * 4. Bulk flag retrieval for all features in a project+environment
 * 5. Archived features are excluded
 * 6. Invalid environment slug returns empty/error
 * 7. Edge cases: null project, empty feature key, etc.
 *
 * Architecture: Tests use an InMemoryFlagRepository (fake) instead of
 * Prisma to keep tests fast, isolated, and database-independent.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Feature, Environment, FlagState } from '../models/flag.models.js';
import { FlagService } from '../services/flag.service.js';
import { InMemoryFlagRepository } from './helpers/InMemoryFlagRepository.js';

// =============================================================================
// Test Data Fixtures
// =============================================================================

const PROJECT_ID = 'project-001';
const ENV_DEV_ID = 'env-dev-001';
const ENV_PROD_ID = 'env-prod-001';

/** Dev environment */
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

/** Prod environment */
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

/** Feature: dark-mode — default OFF, overridden ON in dev */
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

/** Feature: new-dashboard — default ON */
const newDashboardFeature: Feature = {
  id: 'feature-new-dashboard',
  key: 'new-dashboard',
  name: 'New Dashboard',
  description: 'Redesigned dashboard experience',
  defaultEnabled: true,
  projectId: PROJECT_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  archivedAt: null,
};

/** Feature: deprecated-widget — ARCHIVED */
const archivedFeature: Feature = {
  id: 'feature-deprecated',
  key: 'deprecated-widget',
  name: 'Deprecated Widget',
  description: 'Will be removed',
  defaultEnabled: true,
  projectId: PROJECT_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  archivedAt: new Date('2026-03-01'),
};

/** FlagState: dark-mode is ON in dev */
const darkModeDevState: FlagState = {
  id: 'state-001',
  enabled: true,
  featureId: darkModeFeature.id,
  environmentId: ENV_DEV_ID,
  updatedAt: new Date('2026-02-01'),
  updatedBy: 'user-123',
};

/** FlagState: new-dashboard is OFF in prod (overrides default ON) */
const newDashboardProdState: FlagState = {
  id: 'state-002',
  enabled: false,
  featureId: newDashboardFeature.id,
  environmentId: ENV_PROD_ID,
  updatedAt: new Date('2026-02-15'),
  updatedBy: 'user-456',
};

// =============================================================================
// Tests
// =============================================================================

describe('Flag Engine', () => {
  let repository: InMemoryFlagRepository;
  let flagService: FlagService;

  beforeEach(() => {
    // Arrange: fresh repository with test data for each test
    repository = new InMemoryFlagRepository();
    repository.seedEnvironments([devEnvironment, prodEnvironment]);
    repository.seedFeatures([darkModeFeature, newDashboardFeature, archivedFeature]);
    repository.seedFlagStates([darkModeDevState, newDashboardProdState]);

    flagService = new FlagService(repository);
  });

  // =========================================================================
  // Single Flag Evaluation
  // =========================================================================

  describe('evaluateFlag — single flag retrieval', () => {
    it('should return the environment-specific state when a FlagState exists', async () => {
      // dark-mode has a FlagState in dev → enabled: true
      const result = await flagService.evaluateFlag(PROJECT_ID, 'dev', 'dark-mode');

      expect(result.key).toBe('dark-mode');
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('flag_state');
    });

    it('should override defaultEnabled when FlagState contradicts it', async () => {
      // new-dashboard: defaultEnabled=true, but prod FlagState says enabled=false
      const result = await flagService.evaluateFlag(PROJECT_ID, 'prod', 'new-dashboard');

      expect(result.key).toBe('new-dashboard');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('flag_state');
    });

    it('should fall back to Feature.defaultEnabled when no FlagState exists', async () => {
      // dark-mode has no FlagState in prod → fallback to defaultEnabled (false)
      const result = await flagService.evaluateFlag(PROJECT_ID, 'prod', 'dark-mode');

      expect(result.key).toBe('dark-mode');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('default');
    });

    it('should fall back to defaultEnabled=true when no FlagState exists', async () => {
      // new-dashboard has no FlagState in dev → fallback to defaultEnabled (true)
      const result = await flagService.evaluateFlag(PROJECT_ID, 'dev', 'new-dashboard');

      expect(result.key).toBe('new-dashboard');
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('default');
    });

    it('should return not_found for a feature that does not exist', async () => {
      const result = await flagService.evaluateFlag(PROJECT_ID, 'dev', 'nonexistent-flag');

      expect(result.key).toBe('nonexistent-flag');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('not_found');
    });

    it('should return not_found for an archived feature', async () => {
      const result = await flagService.evaluateFlag(PROJECT_ID, 'dev', 'deprecated-widget');

      expect(result.key).toBe('deprecated-widget');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('not_found');
    });

    it('should return not_found when environment slug is invalid', async () => {
      const result = await flagService.evaluateFlag(PROJECT_ID, 'nonexistent-env', 'dark-mode');

      expect(result.key).toBe('dark-mode');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('not_found');
    });
  });

  // =========================================================================
  // Bulk Flag Evaluation
  // =========================================================================

  describe('evaluateAllFlags — bulk retrieval for a project+environment', () => {
    it('should return all non-archived flags with correct states for dev', async () => {
      const results = await flagService.evaluateAllFlags(PROJECT_ID, 'dev');

      expect(results).toHaveLength(2); // Excludes archived feature

      const darkMode = results.find((r) => r.key === 'dark-mode');
      const newDashboard = results.find((r) => r.key === 'new-dashboard');

      // dark-mode: has FlagState in dev → true
      expect(darkMode).toBeDefined();
      expect(darkMode!.enabled).toBe(true);
      expect(darkMode!.source).toBe('flag_state');

      // new-dashboard: no FlagState in dev → fallback to default (true)
      expect(newDashboard).toBeDefined();
      expect(newDashboard!.enabled).toBe(true);
      expect(newDashboard!.source).toBe('default');
    });

    it('should return all non-archived flags with correct states for prod', async () => {
      const results = await flagService.evaluateAllFlags(PROJECT_ID, 'prod');

      expect(results).toHaveLength(2);

      const darkMode = results.find((r) => r.key === 'dark-mode');
      const newDashboard = results.find((r) => r.key === 'new-dashboard');

      // dark-mode: no FlagState in prod → fallback to default (false)
      expect(darkMode).toBeDefined();
      expect(darkMode!.enabled).toBe(false);
      expect(darkMode!.source).toBe('default');

      // new-dashboard: FlagState in prod → false (overrides default true)
      expect(newDashboard).toBeDefined();
      expect(newDashboard!.enabled).toBe(false);
      expect(newDashboard!.source).toBe('flag_state');
    });

    it('should return empty array for invalid environment', async () => {
      const results = await flagService.evaluateAllFlags(PROJECT_ID, 'staging');

      expect(results).toEqual([]);
    });

    it('should return empty array for project with no features', async () => {
      const results = await flagService.evaluateAllFlags('empty-project', 'dev');

      expect(results).toEqual([]);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle empty feature key gracefully', async () => {
      const result = await flagService.evaluateFlag(PROJECT_ID, 'dev', '');

      expect(result.key).toBe('');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('not_found');
    });

    it('should handle empty project ID gracefully', async () => {
      const result = await flagService.evaluateFlag('', 'dev', 'dark-mode');

      expect(result.key).toBe('dark-mode');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('not_found');
    });

    it('should not return archived features in bulk evaluation', async () => {
      const results = await flagService.evaluateAllFlags(PROJECT_ID, 'dev');
      const archived = results.find((r) => r.key === 'deprecated-widget');

      expect(archived).toBeUndefined();
    });
  });
});
