import dotenv from 'dotenv';
import express from 'express';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import {
  createClickHouseMiddleware,
  corsMiddleware,
  jsonMiddleware,
  loggingMiddleware,
  cacheMiddleware,
  setupCacheCleanup,
  errorHandlerMiddleware,
  notFoundMiddleware,
} from './middlewares';
import { registerRoutes } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate client IP (useful when behind nginx, load balancer, etc.)
app.set('trust proxy', true);

// Initialize ClickHouse client once
let clickhouseClient: ClickHouseClient | null = null;

function initClickHouseClient(): ClickHouseClient {
  const url = process.env.CLICKHOUSE_URL;
  const username = process.env.CLICKHOUSE_USERNAME;
  const password = process.env.CLICKHOUSE_PASSWORD;
  const database = process.env.CLICKHOUSE_DATABASE;

  // Validate all required environment variables are present
  if (!url) {
    console.error('ERROR: CLICKHOUSE_URL environment variable is required');
    process.exit(1);
  }
  if (!username) {
    console.error('ERROR: CLICKHOUSE_USERNAME environment variable is required');
    process.exit(1);
  }
  if (password === undefined) {
    console.error('ERROR: CLICKHOUSE_PASSWORD environment variable is required');
    process.exit(1);
  }
  if (!database) {
    console.error('ERROR: CLICKHOUSE_DATABASE environment variable is required');
    process.exit(1);
  }

  return createClient({
    host: url,
    username,
    password,
    database,
  });
}

// Initialize ClickHouse client at startup - exit if configuration is invalid
try {
  clickhouseClient = initClickHouseClient();
  console.log('✓ ClickHouse client initialized successfully');
} catch (error) {
  console.error('ERROR: Failed to initialize ClickHouse client:', error);
  process.exit(1);
}

// Register middlewares
app.use(createClickHouseMiddleware(clickhouseClient!));
app.use(corsMiddleware());
app.use(jsonMiddleware());
app.use(loggingMiddleware());
app.use(cacheMiddleware());

// Setup periodic cache cleanup (every 5 minutes)
setupCacheCleanup();

// Register routes
registerRoutes(app);

// Error handling middleware (must be after routes)
app.use(errorHandlerMiddleware());

// 404 handler (must be last)
app.use(notFoundMiddleware());

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}`);
});
