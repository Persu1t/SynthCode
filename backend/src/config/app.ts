import { readFileSync } from 'node:fs';
import '../utils/env.js';

// Works from both src/config (dev) and build/config (prod): package.json is two levels up.
const pkg = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
) as { name: string; version: string };

const env = process.env.NODE_ENV ?? 'development';

export const appConfig = {
  serviceName: pkg.name,
  version: pkg.version,
  env,
  isProduction: env === 'production',
  isDevelopment: env === 'development',
  port: Number(process.env.PORT ?? 4000),
  routePrefix: process.env.ROUTE_PREFIX ?? '/api',
  origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
  module: (process.env.APP_MODULE ?? 'all').toLowerCase(),
};

export type AppConfig = typeof appConfig;
