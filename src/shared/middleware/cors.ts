import type { Request, Response, NextFunction } from 'express';

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
  credentials: true,
};

export function corsMiddleware(config: CorsConfig = DEFAULT_CORS_CONFIG) {
  const merged = { ...DEFAULT_CORS_CONFIG, ...config };

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (origin && merged.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (merged.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (merged.exposedHeaders?.length) {
      res.setHeader('Access-Control-Expose-Headers', merged.exposedHeaders.join(', '));
    }

    if (req.method === 'OPTIONS') {
      if (merged.allowedMethods?.length) {
        res.setHeader('Access-Control-Allow-Methods', merged.allowedMethods.join(', '));
      }
      if (merged.allowedHeaders?.length) {
        res.setHeader('Access-Control-Allow-Headers', merged.allowedHeaders.join(', '));
      }
      if (merged.maxAge) {
        res.setHeader('Access-Control-Max-Age', merged.maxAge.toString());
      }
      res.status(204).end();
      return;
    }

    next();
  };
}
