import type { Request, Response, NextFunction } from 'express';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  roles: string[];
  email: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// TODO(ATS-000): Implement actual JWT verification with identity provider
async function verifyToken(
  _token: string,
  _options: { issuer: string; audience: string }
): Promise<JwtPayload> {
  throw new Error('JWT verification not yet implemented. Configure identity provider.');
}

export function jwtMiddleware(config: { issuer: string; audience: string }) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required.',
        },
      });
      return;
    }

    try {
      const payload = await verifyToken(token, {
        issuer: config.issuer,
        audience: config.audience,
      });

      req.user = payload;
      next();
    } catch {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token.',
        },
      });
    }
  };
}
