import type { Express } from 'express';
import { Request, Response, ErrorResponse } from './types';
import { handleRouteError } from '../utils/errorHandler';

/**
 * Register tree routes
 */
export function registerTreeRoutes(app: Express) {
  app.get(
    '/api/tree/:txHash',
    async (req: Request<{ txHash: string }>, res: Response<object | ErrorResponse>) => {
      try {
        const { txHash } = req.params;

        const hexPattern = /^(0x)?[0-9a-fA-F]{64}$/;
        if (!hexPattern.test(txHash)) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'txHash must be a valid 64-character hexadecimal string',
          });
          return;
        }

        const query = `
          SELECT
            block_number,
            tx_hash,
            tx_idx,
            \`from\`,
            \`to\`,
            gas_details,
            \`trace_nodes.trace_idx\`,
            \`trace_nodes.trace_address\`,
            \`trace_nodes.action_kind\`,
            \`trace_nodes.action\`,
            timeboosted
          FROM brontes.tree
          WHERE tx_hash = {txHash:String}
          LIMIT 1
        `;

        const result = await req.clickhouse.query({
          query,
          query_params: { txHash },
          format: 'JSONEachRow',
        });

        const data = await result.json<
          Array<{
            block_number: number;
            tx_hash: string;
            tx_idx: number;
            from: string;
            to: string | null;
            gas_details: [string | null, string, string, string];
            'trace_nodes.trace_idx': number[];
            'trace_nodes.trace_address': number[][];
            'trace_nodes.action_kind': (string | null)[];
            'trace_nodes.action': (string | null)[];
            timeboosted: boolean;
          }>
        >();

        if (data.length === 0) {
          res.status(404).json({
            error: 'Not Found',
            message: `Transaction ${txHash} not found in brontes.tree`,
          });
          return;
        }

        res.json(data[0]);
      } catch (error) {
        handleRouteError(error, res, 'transaction tree');
      }
    }
  );
}
