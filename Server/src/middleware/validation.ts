/**
 * Generic Zod-based request validation middleware.
 *
 * Architecture: Middleware layer — validates input at the boundary.
 * Security: "Input validation at boundaries" (architect.md § Security)
 *
 * Usage:
 *   router.post('/users', validate(createUserSchema), controller.create);
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Creates a validation middleware from Zod schemas.
 * Validates body, query, and/or params against the provided schemas.
 *
 * Returns 400 with structured error details on validation failure.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ location: string; field: string; message: string }> = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(
          ...formatZodErrors(result.error, 'body'),
        );
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(
          ...formatZodErrors(result.error, 'query'),
        );
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(
          ...formatZodErrors(result.error, 'params'),
        );
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errors,
      });
      return;
    }

    next();
  };
}

function formatZodErrors(
  error: ZodError,
  location: string,
): Array<{ location: string; field: string; message: string }> {
  return error.issues.map((issue) => ({
    location,
    field: issue.path.join('.'),
    message: issue.message,
  }));
}
