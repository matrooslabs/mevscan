import type { Express } from 'express';
import { Request, Response, ErrorResponse } from './types';
import { handleRouteError } from '../utils/errorHandler';

interface TraceNode {
  trace_idx: number;
  trace_address: number[];
  action_kind: string | null;
  action: object | null;
  children: TraceNode[];
}

function buildTraceTree(
  traceIdxs: number[],
  traceAddresses: number[][],
  actionKinds: (string | null)[],
  actions: (string | null)[],
): TraceNode[] {
  const nodes: TraceNode[] = traceIdxs.map((_, i) => {
    let parsedAction: object | null = null;
    if (actions[i]) {
      try {
        parsedAction = JSON.parse(actions[i]!);
      } catch {
        parsedAction = { raw: actions[i] };
      }
    }
    return {
      trace_idx: traceIdxs[i],
      trace_address: traceAddresses[i],
      action_kind: actionKinds[i],
      action: parsedAction,
      children: [],
    };
  });

  nodes.sort((a, b) => {
    const len = Math.min(a.trace_address.length, b.trace_address.length);
    for (let i = 0; i < len; i++) {
      if (a.trace_address[i] !== b.trace_address[i]) return a.trace_address[i] - b.trace_address[i];
    }
    return a.trace_address.length - b.trace_address.length;
  });

  const addrToNode = new Map<string, TraceNode>();
  const roots: TraceNode[] = [];

  for (const node of nodes) {
    const key = node.trace_address.join(',');
    addrToNode.set(key, node);

    if (node.trace_address.length === 0) {
      roots.push(node);
    } else {
      const parentKey = node.trace_address.slice(0, -1).join(',');
      const parent = addrToNode.get(parentKey);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}

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
            gas_details: {
              coinbase_transfer: string | null;
              priority_fee: string;
              gas_used: string;
              effective_gas_price: string;
            };
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

        const row = data[0];

        const traceTree = buildTraceTree(
          row['trace_nodes.trace_idx'],
          row['trace_nodes.trace_address'],
          row['trace_nodes.action_kind'],
          row['trace_nodes.action'],
        );

        res.json({
          block_number: row.block_number,
          tx_hash: row.tx_hash,
          tx_idx: row.tx_idx,
          from: row.from,
          to: row.to,
          gas_details: row.gas_details,
          timeboosted: row.timeboosted,
          trace_tree: traceTree,
        });
      } catch (error) {
        handleRouteError(error, res, 'transaction tree');
      }
    }
  );
}
