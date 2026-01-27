import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
// Both development and production resolve to the project root
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

interface Config {
  clickhouse: {
    url: string;
    username: string;
    password: string;
    database: string;
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
  clickhouse: {
    url: getEnvVar('CLICKHOUSE_URL'),
    username: getEnvVar('CLICKHOUSE_USERNAME'),
    password: getEnvVar('CLICKHOUSE_PASSWORD'),
    database: getEnvVar('CLICKHOUSE_DATABASE'),
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
