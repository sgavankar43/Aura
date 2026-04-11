/**
 * Validation middleware tests.
 *
 * TDD: Tests for Zod-based request validation at the boundary.
 */

import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validate } from '../../middleware/validation.js';

// Create a minimal test app with validation
function createTestApp() {
  const app = express();
  app.use(express.json());

  const bodySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    age: z.number().int().positive('Age must be positive').optional(),
  });

  const querySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  });

  const paramsSchema = z.object({
    id: z.string().uuid('Invalid ID format'),
  });

  // Body validation endpoint
  app.post('/test/body', validate({ body: bodySchema }), (_req, res) => {
    res.json({ success: true, data: _req.body });
  });

  // Query validation endpoint
  app.get('/test/query', validate({ query: querySchema }), (_req, res) => {
    res.json({ success: true });
  });

  // Params validation endpoint
  app.get('/test/params/:id', validate({ params: paramsSchema }), (_req, res) => {
    res.json({ success: true });
  });

  // Combined validation
  app.post(
    '/test/combined/:id',
    validate({ body: bodySchema, params: paramsSchema }),
    (_req, res) => {
      res.json({ success: true });
    },
  );

  return app;
}

describe('Validation Middleware', () => {
  const app = createTestApp();

  describe('Body Validation', () => {
    it('should accept valid body', async () => {
      const res = await request(app)
        .post('/test/body')
        .send({ name: 'John', email: 'john@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app).post('/test/body').send({ name: 'John' }); // missing email

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toHaveLength(1);
      expect(res.body.details[0].location).toBe('body');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/test/body')
        .send({ name: 'John', email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.details[0].message).toContain('email');
    });

    it('should accept optional fields when omitted', async () => {
      const res = await request(app)
        .post('/test/body')
        .send({ name: 'John', email: 'john@example.com' }); // age omitted

      expect(res.status).toBe(200);
    });

    it('should reject invalid optional fields when provided', async () => {
      const res = await request(app)
        .post('/test/body')
        .send({ name: 'John', email: 'john@example.com', age: -5 });

      expect(res.status).toBe(400);
    });
  });

  describe('Query Validation', () => {
    it('should accept valid query params', async () => {
      const res = await request(app).get('/test/query?page=1&limit=20');

      expect(res.status).toBe(200);
    });

    it('should reject invalid query params', async () => {
      const res = await request(app).get('/test/query?limit=999');

      expect(res.status).toBe(400);
      expect(res.body.details[0].location).toBe('query');
    });
  });

  describe('Params Validation', () => {
    it('should accept valid UUID params', async () => {
      const res = await request(app).get('/test/params/550e8400-e29b-41d4-a716-446655440000');

      expect(res.status).toBe(200);
    });

    it('should reject invalid UUID params', async () => {
      const res = await request(app).get('/test/params/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.details[0].location).toBe('params');
    });
  });

  describe('Combined Validation', () => {
    it('should validate both body and params', async () => {
      const res = await request(app)
        .post('/test/combined/550e8400-e29b-41d4-a716-446655440000')
        .send({ name: 'John', email: 'john@example.com' });

      expect(res.status).toBe(200);
    });

    it('should collect errors from multiple locations', async () => {
      const res = await request(app)
        .post('/test/combined/not-a-uuid')
        .send({ name: '', email: 'not-email' }); // both body and params invalid

      expect(res.status).toBe(400);
      expect(res.body.details.length).toBeGreaterThanOrEqual(2);
    });
  });
});
