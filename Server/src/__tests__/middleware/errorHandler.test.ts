/**
 * Error handler middleware tests.
 *
 * TDD: Tests for centralized error handling and 404 responses.
 */

import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../../app.js';

const app = createApp();

describe('Error Handler', () => {
  describe('404 Not Found', () => {
    it('should return 404 for unknown GET routes', async () => {
      const res = await request(app).get('/this-route-does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('status', 404);
      expect(res.body).toHaveProperty('error', 'Not Found');
      expect(res.body.message).toContain('/this-route-does-not-exist');
    });

    it('should return 404 for unknown POST routes', async () => {
      const res = await request(app).post('/nonexistent').send({ data: 'test' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Not Found');
    });

    it('should include request ID in 404 response', async () => {
      const res = await request(app).get('/missing').set('x-request-id', 'test-404-id');

      expect(res.status).toBe(404);
    });
  });
});
