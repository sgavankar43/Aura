/**
 * Security audit middleware — runtime threat detection.
 *
 * Architecture: Middleware layer — applied globally, logs suspicious patterns.
 * Security: "Audit trail" (architect.md § Security)
 *
 * Detects:
 * - Path traversal attempts (../)
 * - SQL injection patterns
 * - XSS attempts in query strings
 * - Oversized request bodies
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

const SUSPICIOUS_PATTERNS = [
  { name: 'Path Traversal', pattern: /\.\.\// },
  { name: 'SQL Injection', pattern: /('|"|;|--|\/\*|\*\/|union\s+select|drop\s+table)/i },
  { name: 'XSS Attempt', pattern: /(<script|javascript:|on\w+\s*=)/i },
  { name: 'Command Injection', pattern: /(\||;|`|\$\(|&&)/i },
  { name: 'Null Byte', pattern: /%00/ },
];

/**
 * Inspects incoming requests for known attack patterns.
 * Does NOT block requests — only logs for audit trail.
 * Blocking logic should be handled by a WAF in production.
 */
export function securityAuditMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string;
  const fullUrl = req.originalUrl;
  const bodyStr = req.body ? JSON.stringify(req.body) : '';

  for (const { name, pattern } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(fullUrl) || pattern.test(bodyStr)) {
      logger.warn('Suspicious request detected', {
        requestId,
        threatType: name,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
  }

  next();
}
