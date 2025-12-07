# Environment Setup

This project uses a centralized `.env` file in the workspace root for both the Server and Client.

## Quick Start

1. Copy `env.sample` to `.env` in the root directory:
   ```bash
   cp env.sample .env
   ```
2. Edit `.env` with your configuration.

## Configuration Variables

### Server Configuration
These variables are used by the Express server:

- `PORT`: The port the server listens on (default: `3001`)
- `CLICKHOUSE_URL`: URL for the ClickHouse database (e.g., `http://localhost:8123`)
- `CLICKHOUSE_USERNAME`: Database username
- `CLICKHOUSE_PASSWORD`: Database password
- `CLICKHOUSE_DATABASE`: Database name

### Client Configuration
These variables are used by the Vite React client:

- `VITE_API_BASE_URL`: The full URL of the API server. This should match the server's address (e.g., `http://localhost:3001` for local dev).

## How It Works

### Centralized Configuration
Both the server and client are configured to look for the `.env` file in the workspace root directory (`/mevscan/.env`).

- **Server**: `server/index.ts` loads the `.env` file from the parent directory.
- **Client**: `client/vite.config.js` sets `envDir` to `../` to load variables from the workspace root.

### Production Build

For production, you can create a `.env.production` file in the workspace root.

**Note**: Client environment variables must be prefixed with `VITE_` to be exposed to the browser.
