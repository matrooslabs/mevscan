import type { Express } from 'express';
import { Request, Response, HealthResponse, RootResponse } from './types';

/**
 * Register health routes
 */
export function registerHealthRoutes(app: Express) {
  app.get('/health', (req: Request, res: Response<HealthResponse>) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // Root endpoint
  app.get('/', (req: Request, res: Response<RootResponse>) => {
    res.json({
      message: 'MEVScan API Server',
      version: '1.0.0',
      endpoints: [
        'GET /api/latest-transactions',
        'GET /api/latest-blocks',
        'GET /api/blocks/:blockNumber',
        'GET /api/transactions/:transactionId',
        'GET /api/addresses/:address',
        'GET /api/gross-mev?timeRange=24hours',
        'GET /api/gross-atomic-arb?timeRange=24hours',
        'GET /api/gross-cex-dex-quotes?timeRange=24hours',
        'GET /api/gross-liquidation?timeRange=24hours',
        'GET /api/protocols/atomic-mev/timeboosted?timeRange=24hours',
        'GET /api/express-lane/mev-percentage?timeRange=24hours',
        'GET /api/express-lane/mev-percentage-per-minute?timeRange=24hours',
        'GET /api/express-lane/net-profit?timeRange=24hours',
        'GET /api/express-lane/profit-by-controller?timeRange=24hours',
        'GET /api/timeboost/gross-revenue',
        'GET /api/timeboost/revenue?timeRange=24hours',
        'GET /api/timeboost/bids-per-address?timeRange=24hours',
        'GET /api/timeboost/auction-win-count?timeRange=24hours',
        'GET /api/timeboost/bids-per-round',
        'GET /api/timeboost/express-lane-price?timeRange=24hours',
        'GET /api/mev/atomic?tx_hash=<tx_hash>',
        'GET /api/mev/cexdex?tx_hash=<tx_hash>',
        'GET /api/mev/liquidations?tx_hash=<tx_hash>',
        'GET /health',
      ],
    });
  });
}
