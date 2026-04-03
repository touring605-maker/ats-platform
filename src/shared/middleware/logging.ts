import type { Request, Response, NextFunction } from 'express';

export interface ILogger {
  info(event: string, data?: Record<string, unknown>): void;
  warn(event: string, data?: Record<string, unknown>): void;
  error(event: string, data?: Record<string, unknown>): void;
  debug(event: string, data?: Record<string, unknown>): void;
}

// TODO(ATS-000): Replace with pino or structured logger instance
const structuredLog = (level: string, event: string, data?: Record<string, unknown>) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};

export const logger: ILogger = {
  info: (event, data) => structuredLog('info', event, data),
  warn: (event, data) => structuredLog('warn', event, data),
  error: (event, data) => structuredLog('error', event, data),
  debug: (event, data) => structuredLog('debug', event, data),
};

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = (req as Record<string, unknown>)['requestId'] as string | undefined;

  res.on('finish', () => {
    logger.info('http.request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      requestId,
      tenantId: req.user?.tenantId,
      actorId: req.user?.sub,
    });
  });

  next();
}
