import type { Request, Response, NextFunction } from 'express';
import { AppError } from './appError';

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      error: {
        code: err.code,
        message: err.message,
        requestId: (res as Record<string, unknown>)['requestId'] ?? undefined,
      },
    };

    if ('fields' in err && Array.isArray((err as Record<string, unknown>)['fields'])) {
      (response['error'] as Record<string, unknown>)['fields'] = (err as Record<string, unknown>)['fields'];
    }

    if (!err.isOperational) {
      // TODO(ATS-000): Replace with structured logger
      console.error('Unexpected application error', { error: err });
    }

    res.status(err.httpStatus).json(response);
    return;
  }

  // TODO(ATS-000): Replace with structured logger
  console.error('Unhandled error', { error: err });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      requestId: (res as Record<string, unknown>)['requestId'] ?? undefined,
    },
  });
}
