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

export const databaseConfig = {
  url: requireEnv('DATABASE_URL'),
  poolMin: Number(optionalEnv('DB_POOL_MIN', '2')),
  poolMax: Number(optionalEnv('DB_POOL_MAX', '10')),
  ssl: optionalEnv('DB_SSL', 'true') === 'true',
} as const;

export type DatabaseConfig = typeof databaseConfig;
