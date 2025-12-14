import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
// Both development and production resolve to the project root
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

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
    isTest: boolean;
    refreshIntervalMs: number;
  };
}

const getEnvVar = (key: string, required: boolean = true): string => {
  const value = process.env[key];
  if (required && value === undefined) {
    throw new Error(`ERROR: ${key} environment variable is required`);
  }
  return value || '';
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
    isTest: getEnvVar('TEST_ABLY') === 'true' || false,
    refreshIntervalMs: parseInt(process.env.REFRESH_INTERVAL_MS || '20000', 10),
  },
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