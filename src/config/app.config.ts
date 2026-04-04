function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const appConfig = {
  env: optionalEnv('NODE_ENV', 'development'),
  port: Number(optionalEnv('PORT', '3000')),

  auth: {
    provider: 'clerk' as const,
  },

  cloud: {
    provider: optionalEnv('CLOUD_PROVIDER', 'azure') as 'azure' | 'aws' | 'gcp',
  },

  cors: {
    allowedOrigins: optionalEnv('ALLOWED_ORIGINS', `https://${process.env.REPLIT_DEV_DOMAIN}`).split(','),
  },

  rateLimit: {
    windowMs: Number(optionalEnv('RATE_LIMIT_WINDOW_MS', '60000')),
    maxRequests: Number(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100')),
  },
} as const;

export type AppConfig = typeof appConfig;
