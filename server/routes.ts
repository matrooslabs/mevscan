import type { Express } from 'express';
import { registerLatestRoutes } from './routes/latest';
import { registerEntitiesRoutes } from './routes/entities';
import { registerMevRoutes } from './routes/mev';
import { registerProtocolsRoutes } from './routes/protocols';
import { registerExpressLaneRoutes } from './routes/expressLane';
import { registerTimeboostRoutes } from './routes/timeboost';
import { registerMevDetailsRoutes } from './routes/mevDetails';
import { registerHealthRoutes } from './routes/health';

/**
 * Register all routes with the Express app
 */
export function registerRoutes(app: Express) {
  registerLatestRoutes(app);
  registerEntitiesRoutes(app);
  registerMevRoutes(app);
  registerProtocolsRoutes(app);
  registerExpressLaneRoutes(app);
  registerTimeboostRoutes(app);
  registerMevDetailsRoutes(app);
  registerHealthRoutes(app);
}
