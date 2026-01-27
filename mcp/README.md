# MEVScan MCP Server

Remote MCP server exposing MEVScan data via Streamable HTTP transport.

## Prerequisites

- `.env` file in the project root with ClickHouse credentials
- Dependencies installed: `npm install` from the project root

## Start the server

```sh
npm run dev:mcp
```

The server runs on `http://localhost:3002/mcp`.

## Connect Claude Code

```sh
claude mcp add --transport http mevscan http://localhost:3002/mcp
```

## Available tools

### `tx_tree`

Get the trace tree for a transaction.

- **Input**: `tx_hash` (string) — transaction hash
- **Output**: trace nodes (trace_idx, trace_address, action_kind, action)

### `get_pool`

Get pool information by address.

- **Input**: `pool_address` (string) — pool contract address
- **Output**: all pool columns from `ethereum.pools`
