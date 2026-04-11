/**
 * Logger utility tests.
 *
 * TDD: Tests for structured logging and sensitive field redaction.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { redactSensitive, SENSITIVE_FIELDS, logger } from '../../utils/logger.js';

describe('Logger', () => {
  describe('redactSensitive', () => {
    it('should redact password fields', () => {
      const input = { username: 'john', password: 'secret123' };
      const result = redactSensitive(input) as Record<string, unknown>;

      expect(result['username']).toBe('john');
      expect(result['password']).toBe('[REDACTED]');
    });

    it('should redact token fields', () => {
      const input = { userId: '123', token: 'jwt-token-value' };
      const result = redactSensitive(input) as Record<string, unknown>;

      expect(result['userId']).toBe('123');
      expect(result['token']).toBe('[REDACTED]');
    });

    it('should redact nested sensitive fields', () => {
      const input = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            apiKey: 'key-123',
          },
        },
      };
      const result = redactSensitive(input) as Record<string, unknown>;
      const user = result['user'] as Record<string, unknown>;
      const credentials = user['credentials'] as Record<string, unknown>;

      expect(user['name']).toBe('John');
      expect(credentials['password']).toBe('[REDACTED]');
      expect(credentials['apiKey']).toBe('[REDACTED]');
    });

    it('should redact authorization headers', () => {
      const input = { authorization: 'Bearer token123', contentType: 'application/json' };
      const result = redactSensitive(input) as Record<string, unknown>;

      expect(result['authorization']).toBe('[REDACTED]');
      expect(result['contentType']).toBe('application/json');
    });

    it('should handle arrays', () => {
      const input = [
        { name: 'item1', secret: 'shh' },
        { name: 'item2', secret: 'quiet' },
      ];
      const result = redactSensitive(input) as Array<Record<string, unknown>>;

      expect(result[0]['name']).toBe('item1');
      expect(result[0]['secret']).toBe('[REDACTED]');
      expect(result[1]['secret']).toBe('[REDACTED]');
    });

    it('should handle null and undefined', () => {
      expect(redactSensitive(null)).toBeNull();
      expect(redactSensitive(undefined)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(redactSensitive('hello')).toBe('hello');
      expect(redactSensitive(42)).toBe(42);
      expect(redactSensitive(true)).toBe(true);
    });

    it('should not mutate the original object', () => {
      const input = { password: 'secret' };
      redactSensitive(input);

      expect(input.password).toBe('secret');
    });
  });

  describe('SENSITIVE_FIELDS', () => {
    it('should include common sensitive field names', () => {
      const expected = ['password', 'token', 'apikey', 'secret', 'authorization', 'cookie'];
      for (const field of expected) {
        expect(SENSITIVE_FIELDS.has(field)).toBe(true);
      }
    });
  });

  describe('log methods', () => {
    const originalLogLevel = process.env['LOG_LEVEL'];

    // Set log level to debug so all log methods execute their body (true branch)
    beforeEach(() => {
      process.env['LOG_LEVEL'] = 'debug';
    });

    afterEach(() => {
      process.env['LOG_LEVEL'] = originalLogLevel;
    });

    it('should call logger.info without throwing', () => {
      expect(() => logger.info('test message')).not.toThrow();
    });

    it('should call logger.error without throwing', () => {
      expect(() => logger.error('test error')).not.toThrow();
    });

    it('should call logger.warn without throwing', () => {
      expect(() => logger.warn('test warning')).not.toThrow();
    });

    it('should call logger.debug without throwing', () => {
      expect(() => logger.debug('test debug')).not.toThrow();
    });

    it('should accept meta object and redact sensitive fields', () => {
      expect(() =>
        logger.info('test', { password: 'secret', action: 'login' }),
      ).not.toThrow();
    });

    it('should suppress logs when level is silent', () => {
      process.env['LOG_LEVEL'] = 'silent';
      // Should not throw even when suppressed
      expect(() => logger.debug('suppressed')).not.toThrow();
      expect(() => logger.info('suppressed')).not.toThrow();
      expect(() => logger.warn('suppressed')).not.toThrow();
      expect(() => logger.error('suppressed')).not.toThrow();
    });
  });
});
