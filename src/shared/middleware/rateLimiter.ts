import type { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

// TODO(ATS-000): Replace in-memory store with distributed cache (Redis) for multi-instance deployment
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimiterMiddleware(config: RateLimitConfig = DEFAULT_CONFIG) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user?.sub ?? req.ip ?? 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(key);

    if (!entry || now > entry.resetAt) {
      requestCounts.set(key, { count: 1, resetAt: now + config.windowMs });
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (config.maxRequests - 1).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());
      next();
      return;
    }

    entry.count++;

    if (entry.count > config.maxRequests) {
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (config.maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());
    next();
  };
}
