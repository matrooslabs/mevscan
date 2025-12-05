import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
// In development (ts-node), __dirname is usually the server directory
// In production (built), __dirname is server/dist/server
const isDist = __filename.includes('dist');
const envPath = isDist 
  ? path.resolve(__dirname, '../../../.env') 
  : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

interface Config {
  server: {
    port: number;
  };
  clickhouse: {
    url: string;
    username: string;
    password?: string;
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
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
  clickhouse: {
    url: getEnvVar('CLICKHOUSE_URL'),
    username: getEnvVar('CLICKHOUSE_USERNAME'),
    password: process.env.CLICKHOUSE_PASSWORD, // Optional check handled by caller or specific logic
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
if (config.clickhouse.password === undefined) {
  console.error('ERROR: CLICKHOUSE_PASSWORD environment variable is required');
  process.exit(1);
}
if (!config.clickhouse.database) {
  console.error('ERROR: CLICKHOUSE_DATABASE environment variable is required');
  process.exit(1);
}

