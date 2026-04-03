function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set.`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const appConfig = {
  env: optionalEnv('NODE_ENV', 'development'),
  port: Number(optionalEnv('PORT', '3000')),

  auth: {
    issuer: requireEnv('AUTH_ISSUER'),
    audience: requireEnv('AUTH_AUDIENCE'),
  },

  cloud: {
    provider: optionalEnv('CLOUD_PROVIDER', 'azure') as 'azure' | 'aws' | 'gcp',
  },

  cors: {
    allowedOrigins: optionalEnv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
  },

  rateLimit: {
    windowMs: Number(optionalEnv('RATE_LIMIT_WINDOW_MS', '60000')),
    maxRequests: Number(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100')),
  },
} as const;

export type AppConfig = typeof appConfig;
