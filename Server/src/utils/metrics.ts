/**
 * MetricsService — In-process metrics collection.
 *
 * Architecture: Utility layer — can be imported by any layer.
 * Tracks counters (for counts) and histograms (for latency distributions).
 *
 * Design:
 * - Tags create separate metric keys: `name{tag1=val1,tag2=val2}`
 * - Histograms store raw values for accurate percentile calculations.
 * - Singleton export `metrics` for convenience; class export for testing.
 * - Swappable for Prometheus/StatsD/OpenTelemetry in production.
 *
 * Milestone 5: Advanced Telemetry & Request Correlation.
 */

export interface HistogramSummary {
  count: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface MetricsSnapshot {
  counters: Record<string, number>;
  histograms: Record<string, HistogramSummary>;
}

/**
 * Build a metric key with optional tags.
 * Example: `flag_evaluation_total{source=flag_state,projectId=p1}`
 */
function buildKey(name: string, tags?: Record<string, string>): string {
  if (!tags || Object.keys(tags).length === 0) {
    return name;
  }
  const tagStr = Object.entries(tags)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return `${name}{${tagStr}}`;
}

export class MetricsService {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /** Increment a named counter by 1. */
  increment(name: string, tags?: Record<string, string>): void {
    const key = buildKey(name, tags);
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  /** Decrement a named counter by 1 (floor at 0). */
  decrement(name: string, tags?: Record<string, string>): void {
    const key = buildKey(name, tags);
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, Math.max(0, current - 1));
  }

  /** Get the current value of a counter. Returns 0 if not found. */
  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  /** Record a duration (ms) for a named histogram. */
  recordDuration(name: string, durationMs: number, tags?: Record<string, string>): void {
    const key = buildKey(name, tags);
    const values = this.histograms.get(key) ?? [];
    values.push(durationMs);
    this.histograms.set(key, values);
  }

  /**
   * Get a percentile value from a histogram.
   * Returns 0 if the histogram doesn't exist or has no data.
   */
  getPercentile(name: string, percentile: number): number {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /** Snapshot all metrics for a /metrics endpoint. */
  snapshot(): MetricsSnapshot {
    const counters: Record<string, number> = {};
    for (const [key, value] of this.counters) {
      counters[key] = value;
    }

    const histograms: Record<string, HistogramSummary> = {};
    for (const [key, values] of this.histograms) {
      if (values.length === 0) {
        continue;
      }
      const sorted = [...values].sort((a, b) => a - b);
      histograms[key] = {
        count: values.length,
        p50: this.getPercentile(key, 50),
        p95: this.getPercentile(key, 95),
        p99: this.getPercentile(key, 99),
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    }

    return { counters, histograms };
  }

  /** Reset all metrics (for testing). */
  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }
}

/** Global singleton for convenience. */
export const metrics = new MetricsService();
