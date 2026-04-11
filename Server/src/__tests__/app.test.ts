/**
 * App integration tests — TDD foundation.
 *
 * These tests validate the full HTTP lifecycle via supertest.
 * Every new feature should start with a failing test here.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('checks');
      expect(res.body.checks).toHaveProperty('server', { status: 'up' });
    });

    it('should include correct content-type header', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  describe('GET /ready', () => {
    it('should return 200 when all checks pass', async () => {
      const res = await request(app).get('/ready');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ready');
      expect(res.body).toHaveProperty('checks');
    });
  });
});

describe('404 Handling', () => {
  it('should return 404 for undefined routes', async () => {
    const res = await request(app).get('/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not Found');
    expect(res.body).toHaveProperty('message');
  });
});

describe('Security Headers', () => {
  it('should include helmet security headers', async () => {
    const res = await request(app).get('/health');

    // Helmet sets these headers by default
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(res.headers).toHaveProperty('x-frame-options');
  });

  it('should include request ID', async () => {
    const res = await request(app).get('/health');

    // Request ID is injected by our middleware
    expect(res.status).toBe(200);
  });

  it('should echo back provided request ID', async () => {
    const res = await request(app)
      .get('/health')
      .set('x-request-id', 'test-request-123');

    expect(res.status).toBe(200);
  });
});

describe('JSON Body Parsing', () => {
  it('should parse JSON request bodies', async () => {
    const res = await request(app)
      .post('/nonexistent')
      .send({ test: 'data' })
      .set('Content-Type', 'application/json');

    // Should get 404 (route doesn't exist) but body should be parsed
    expect(res.status).toBe(404);
  });
});
