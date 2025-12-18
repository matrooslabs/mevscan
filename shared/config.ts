import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from the repo root `.env`.
//
// Important: when this file is compiled to `shared/dist/config.js`,
// `__dirname` becomes `.../shared/dist`, so `../.env` points to `shared/.env`.
// We therefore try multiple candidate locations.
const envCandidates = [
  path.resolve(__dirname, '../.env'), // works for TS source (`.../shared/config.ts`)
  path.resolve(__dirname, '../../.env'), // works for compiled JS (`.../shared/dist/config.js`)
  path.resolve(process.cwd(), '.env'), // fallback when running from repo root
];

const envPath = envCandidates.find((p) => fs.existsSync(p));
dotenv.config(envPath ? { path: envPath } : undefined);

export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

interface Config {
  server: {
    port: number;
  };
  clickhouse: {
    url: string;
    username: string;
    password: string;
    database: string;
  };
  ably: {
    apiKey: string;
    refreshIntervalMs: number;
  };
  nodeEnv: NodeEnv;
}

const getEnvVar = (key: string, required: boolean = true): string => {
  const value = process.env[key];
  if (required && value === undefined) {
    throw new Error(`ERROR: ${key} environment variable is required`);
  }
  return value || '';
};

const getNodeEnv = (): NodeEnv => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return NodeEnv.PRODUCTION;
    case 'test':
      return NodeEnv.TEST;
    case 'development':
    default:
      return NodeEnv.DEVELOPMENT;
  }
};

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
  clickhouse: {
    url: getEnvVar('CLICKHOUSE_URL'),
    username: getEnvVar('CLICKHOUSE_USERNAME'),
    password: getEnvVar('CLICKHOUSE_PASSWORD'),
    database: getEnvVar('CLICKHOUSE_DATABASE'),
  },
  ably: {
    apiKey: getEnvVar('ABLY_API_KEY'),
    refreshIntervalMs: parseInt(process.env.REFRESH_INTERVAL_MS || '1000', 10),
  },
  nodeEnv: getNodeEnv(),
};

// Validate critical configurations immediately
if (!config.clickhouse.url) {
  console.error('ERROR: CLICKHOUSE_URL environment variable is required');
  process.exit(1);
}
if (!config.clickhouse.username) {
  console.error('ERROR: CLICKHOUSE_USERNAME environment variable is required');
  process.exit(1);
}
if (!config.clickhouse.password) {
  console.error('ERROR: CLICKHOUSE_PASSWORD environment variable is required');
  process.exit(1);
}
if (!config.clickhouse.database) {
  console.error('ERROR: CLICKHOUSE_DATABASE environment variable is required');
  process.exit(1);
}
if (!config.ably.apiKey) {
  console.error('ERROR: ABLY_API_KEY environment variable is required');
  process.exit(1);
}