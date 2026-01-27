import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import { createClient } from '@clickhouse/client';
import { config } from './config.js';

const clickhouse = createClient({
  host: config.clickhouse.url,
  username: config.clickhouse.username,
  password: config.clickhouse.password,
  database: config.clickhouse.database,
});

const server = new McpServer({
  name: 'mevscan',
  version: '1.0.0',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- MCP SDK deep type instantiation issue
(server as any).tool(
  'tx_tree',
  'Get the trace tree for a transaction by its hash',
  { tx_hash: z.string() },
  async ({ tx_hash }: { tx_hash: string }) => {
    const result = await clickhouse.query({
      query: `SELECT trace_nodes.trace_idx, trace_nodes.trace_address,
                   trace_nodes.action_kind, trace_nodes.action
            FROM brontes.tree
            WHERE tx_hash = {tx_hash:String}
            LIMIT 1`,
      query_params: { tx_hash },
    });
    const rows = await result.json();
    const data = (rows as { data: unknown[] }).data;
    if (data.length === 0) {
      return { content: [{ type: 'text' as const, text: 'no tx hash found' }] };
    }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data[0]) }],
    };
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- MCP SDK deep type instantiation issue
(server as any).tool(
  'get_pool',
  'Get pool information by its address',
  { pool_address: z.string() },
  async ({ pool_address }: { pool_address: string }) => {
    const result = await clickhouse.query({
      query: `SELECT * FROM ethereum.pools
            WHERE address = {pool_address:String}
            LIMIT 1`,
      query_params: { pool_address },
    });
    const rows = await result.json();
    const data = (rows as { data: unknown[] }).data;
    if (data.length === 0) {
      return { content: [{ type: 'text' as const, text: 'no pool found' }] };
    }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data[0]) }],
    };
  }
);

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', (_req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed in stateless mode' },
    id: null,
  });
});

app.delete('/mcp', (_req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed in stateless mode' },
    id: null,
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}/mcp`);
});
