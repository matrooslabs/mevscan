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
  initializeCacheWarming,
} from './middlewares';
import { registerRoutes } from './routes';
import { config } from './config';

const app = express();
const PORT = config.server.port;

// Trust proxy for accurate client IP (useful when behind nginx, load balancer, etc.)
app.set('trust proxy', true);

// Initialize ClickHouse client once
let clickhouseClient: ClickHouseClient | null = null;

function initClickHouseClient(): ClickHouseClient {
  return createClient({
    host: config.clickhouse.url,
    username: config.clickhouse.username,
    password: config.clickhouse.password,
    database: config.clickhouse.database,
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
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}`);

  // Initialize cache warming after server is ready
  // This pre-warms expensive queries (30d, 90d) and sets up scheduled refresh
  try {
    await initializeCacheWarming();
    console.log('✓ Cache warming initialized');
  } catch (error) {
    console.error('WARNING: Cache warming failed to initialize:', error);
    // Don't exit - cache warming is optional, server can still function
  }
});
