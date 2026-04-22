/**
 * MetricsService Test Suite
 *
 * TDD: Written FIRST, before implementation.
 *
 * Tests cover:
 * 1. Counter increment and retrieval
 * 2. Histogram duration recording
 * 3. Percentile calculation (p50, p95, p99)
 * 4. Snapshot returns all metrics
 * 5. Reset clears all state
 * 6. Tagged metrics are tracked separately
 *
 * Milestone 5: Advanced Telemetry & Request Correlation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsService } from '../../utils/metrics.js';

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = new MetricsService();
  });

  // =========================================================================
  // Counters
  // =========================================================================

  describe('counters', () => {
    it('should start at 0 for unknown counters', () => {
      expect(metrics.getCounter('nonexistent')).toBe(0);
    });

    it('should increment a counter by 1', () => {
      metrics.increment('flag_evaluation_total');
      expect(metrics.getCounter('flag_evaluation_total')).toBe(1);
    });

    it('should accumulate multiple increments', () => {
      metrics.increment('flag_evaluation_total');
      metrics.increment('flag_evaluation_total');
      metrics.increment('flag_evaluation_total');
      expect(metrics.getCounter('flag_evaluation_total')).toBe(3);
    });

    it('should track counters with tags as separate keys', () => {
      metrics.increment('flag_evaluation_total', { source: 'flag_state' });
      metrics.increment('flag_evaluation_total', { source: 'default' });
      metrics.increment('flag_evaluation_total', { source: 'flag_state' });

      expect(metrics.getCounter('flag_evaluation_total{source=flag_state}')).toBe(2);
      expect(metrics.getCounter('flag_evaluation_total{source=default}')).toBe(1);
    });

    it('should decrement a counter', () => {
      metrics.increment('ws_connections_active');
      metrics.increment('ws_connections_active');
      metrics.decrement('ws_connections_active');
      expect(metrics.getCounter('ws_connections_active')).toBe(1);
    });

    it('should not go below 0 when decrementing', () => {
      metrics.decrement('ws_connections_active');
      expect(metrics.getCounter('ws_connections_active')).toBe(0);
    });
  });

  // =========================================================================
  // Histograms
  // =========================================================================

  describe('histograms', () => {
    it('should record a duration', () => {
      metrics.recordDuration('flag_evaluation_duration_ms', 5);
      const snapshot = metrics.snapshot();
      expect(snapshot.histograms['flag_evaluation_duration_ms']).toBeDefined();
      expect(snapshot.histograms['flag_evaluation_duration_ms'].count).toBe(1);
    });

    it('should calculate p50 correctly', () => {
      // Insert 100 values: 1, 2, 3, ..., 100
      for (let i = 1; i <= 100; i++) {
        metrics.recordDuration('latency', i);
      }
      // p50 = the 50th percentile ≈ 50
      expect(metrics.getPercentile('latency', 50)).toBe(50);
    });

    it('should calculate p95 correctly', () => {
      for (let i = 1; i <= 100; i++) {
        metrics.recordDuration('latency', i);
      }
      // p95 = 95th percentile ≈ 95
      expect(metrics.getPercentile('latency', 95)).toBe(95);
    });

    it('should calculate p99 correctly', () => {
      for (let i = 1; i <= 100; i++) {
        metrics.recordDuration('latency', i);
      }
      // p99 = 99th percentile ≈ 99
      expect(metrics.getPercentile('latency', 99)).toBe(99);
    });

    it('should return 0 for unknown histograms', () => {
      expect(metrics.getPercentile('nonexistent', 50)).toBe(0);
    });

    it('should track histograms with tags as separate keys', () => {
      metrics.recordDuration('flag_evaluation_duration_ms', 5, { projectId: 'p1' });
      metrics.recordDuration('flag_evaluation_duration_ms', 10, { projectId: 'p2' });

      expect(metrics.getPercentile('flag_evaluation_duration_ms{projectId=p1}', 50)).toBe(5);
      expect(metrics.getPercentile('flag_evaluation_duration_ms{projectId=p2}', 50)).toBe(10);
    });
  });

  // =========================================================================
  // Snapshot
  // =========================================================================

  describe('snapshot', () => {
    it('should return all counters and histograms', () => {
      metrics.increment('a');
      metrics.increment('b');
      metrics.recordDuration('c', 10);

      const snap = metrics.snapshot();
      expect(snap.counters).toHaveProperty('a', 1);
      expect(snap.counters).toHaveProperty('b', 1);
      expect(snap.histograms).toHaveProperty('c');
      expect(snap.histograms['c'].count).toBe(1);
      expect(snap.histograms['c'].p50).toBe(10);
    });

    it('should include histogram percentiles in snapshot', () => {
      for (let i = 1; i <= 100; i++) {
        metrics.recordDuration('latency', i);
      }
      const snap = metrics.snapshot();
      expect(snap.histograms['latency'].p50).toBe(50);
      expect(snap.histograms['latency'].p95).toBe(95);
      expect(snap.histograms['latency'].p99).toBe(99);
      expect(snap.histograms['latency'].count).toBe(100);
    });
  });

  // =========================================================================
  // Reset
  // =========================================================================

  describe('reset', () => {
    it('should clear all counters and histograms', () => {
      metrics.increment('x');
      metrics.recordDuration('y', 10);

      metrics.reset();

      expect(metrics.getCounter('x')).toBe(0);
      expect(metrics.getPercentile('y', 50)).toBe(0);

      const snap = metrics.snapshot();
      expect(Object.keys(snap.counters)).toHaveLength(0);
      expect(Object.keys(snap.histograms)).toHaveLength(0);
    });
  });
});
