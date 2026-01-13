# Docker Compose Setup Guide

This guide explains how to use Docker Compose to run the MEVScan application in a containerized environment.

## Overview

The MEVScan project uses npm workspaces with four packages:
- **shared** (`@mevscan/shared`): Common TypeScript type definitions
- **server** (`@mevscan/server`): Express.js backend server
- **client** (`@mevscan/client`): React frontend application
- **websocket** (`@mevscan/websocket`): Real-time data streaming service via Ably

The Docker Compose setup includes three services:
- **API**: Express.js backend server (port 3001)
- **Web**: React frontend application served via nginx (port 8080)
- **WebSocket**: Real-time data streaming service for live updates

The web service automatically proxies API requests to the backend, so the frontend uses relative URLs.

## Prerequisites

- Docker and Docker Compose installed on your system
- ClickHouse database credentials
- Ably API key (for real-time messaging)
- `.env` file with required environment variables (see below)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# ClickHouse Database Configuration
CLICKHOUSE_URL=your_clickhouse_url
CLICKHOUSE_USERNAME=your_username
CLICKHOUSE_PASSWORD=your_password
CLICKHOUSE_DATABASE=your_database_name

# Ably Configuration (for WebSocket service and client)
ABLY_API_KEY=your_ably_api_key
VITE_ABLY_SUBSCRIBE_KEY=your_ably_subscribe_key
```

**Note about Ably keys:**
- `ABLY_API_KEY`: Full API key with publish permissions (used by websocket service)
- `VITE_ABLY_SUBSCRIBE_KEY`: Subscribe-only key (used by client - passed at build time)

**Note**: The `.env` file is automatically loaded by Docker Compose and should not be committed to version control.

## Quick Start

### 1. Build and Start Services

Build and start all services in detached mode:

```bash
docker-compose up --build -d
```

Or start without rebuilding (if images already exist):

```bash
docker-compose up -d
```

### 2. View Logs

View logs from all services:

```bash
docker-compose logs -f
```

View logs from a specific service:

```bash
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f websocket
```

### 3. Stop Services

Stop all services:

```bash
docker-compose down
```

Stop and remove volumes (if any):

```bash
docker-compose down -v
```

## Service Details

### API Service

- **Container Name**: `mevscan-api`
- **Port**: `3001` (mapped to host port 3001)
- **Health Check**: Available at `http://localhost:3001/health`
- **Restart Policy**: `unless-stopped` (automatically restarts on failure)

The API service:
- Built from the `server/` workspace (`@mevscan/server`)
- Uses shared types from `shared/` workspace (`@mevscan/shared`)
- Connects to ClickHouse database using environment variables
- Exposes a REST API for MEV data queries
- Includes health check endpoint for monitoring

### Web Service

- **Container Name**: `mevscan-web`
- **Port**: `8080` (mapped to host port 8080)
- **Dependencies**: Waits for API service to be ready
- **Restart Policy**: `unless-stopped`

The web service:
- Built from the `client/` workspace (`@mevscan/client`)
- Uses shared types from `shared/` workspace (`@mevscan/shared`)
- Serves the React application via nginx
- Proxies `/api/*` requests to the API service
- Proxies `/health` requests to the API service
- Supports SPA routing (all routes serve `index.html`)

### WebSocket Service

- **Container Name**: `mevscan-websocket`
- **Dependencies**: Waits for API service to be ready
- **Restart Policy**: `unless-stopped`

The websocket service:
- Built from the `websocket/` workspace (`@mevscan/websocket`)
- Uses shared types and utilities from `shared/` workspace (`@mevscan/shared`)
- Connects to ClickHouse database for real-time data queries
- Publishes live updates via Ably real-time messaging
- Streams express lane transactions and other live MEV data to connected clients

## Accessing the Application

Once the services are running:

- **Web Application**: http://localhost:8080
- **API Health Check**: http://localhost:3001/health
- **API Endpoints**: http://localhost:8080/api/* (proxied through nginx)

## Common Commands

### Rebuild After Code Changes

If you've made changes to the code, rebuild the images:

```bash
docker-compose up --build -d
```

**Note:** The Docker build process:
1. Copies root `package.json` and workspace package files
2. Installs all workspace dependencies using `npm ci`
3. Copies source files from `shared/`, `server/`, `client/`, and `websocket/` directories
4. Builds each workspace independently
5. Creates production images with only necessary files

### Restart a Specific Service

Restart only the API service:

```bash
docker-compose restart api
```

Restart only the web service:

```bash
docker-compose restart web
```

Restart only the websocket service:

```bash
docker-compose restart websocket
```

### View Service Status

Check which services are running:

```bash
docker-compose ps
```

### Execute Commands in Containers

Run a command in the API container:

```bash
docker-compose exec api sh
```

Run a command in the web container:

```bash
docker-compose exec web sh
```

Run a command in the websocket container:

```bash
docker-compose exec websocket sh
```

### Remove Everything

Stop services and remove containers, networks, and images:

```bash
docker-compose down --rmi all
```

## Architecture

### Project Structure
```
mevscan/
├── shared/              # @mevscan/shared - Common TypeScript types & utilities
│   └── src/
│       ├── index.ts     # Re-exports all modules
│       ├── types.ts     # Type definitions
│       ├── clickhouse.ts
│       └── ably.ts
├── server/              # @mevscan/server - Express.js API
├── client/              # @mevscan/client - React application
├── websocket/           # @mevscan/websocket - Real-time data streaming
├── tsconfig.base.json   # Shared TypeScript config
├── package.json         # Root workspace configuration
└── docker-compose.yml
```

### Service Architecture
```
┌─────────────────┐
│   Browser       │
│  localhost:8080 │
└────────┬───────┘
         │
         │ HTTP Requests        ┌─────────────────┐
         ▼                      │  Ably           │
┌─────────────────┐             │  Real-time      │
│   Web Service   │◄────────────│  Messaging      │
│  (nginx)        │  WebSocket  └────────▲────────┘
│  Port: 8080     │                      │
│  Built from:    │                      │ Publish
│  client/        │                      │
└────────┬───────┘             ┌─────────┴────────┐
         │                      │ WebSocket Service│
         ├── Static Files       │  (Node.js)      │
         │   (React App)        │  Built from:    │
         │                      │  websocket/     │
         └── /api/* → Proxy     │  Uses:          │
             /health → Proxy    │  @mevscan/shared│
         │                      └────────┬────────┘
         ▼                               │
┌─────────────────┐                      │
│   API Service   │                      │
│  (Express)      │                      │
│  Port: 3001     │                      │
│  Built from:    │                      │
│  server/        │                      │
│  Uses:          │                      │
│  @mevscan/shared│                      │
└────────┬───────┘                      │
         │                               │
         │ SQL Queries                   │ SQL Queries
         ▼                               ▼
┌─────────────────────────────────────────┐
│            ClickHouse Database          │
└─────────────────────────────────────────┘
```

## TypeScript Architecture

### Overview

This project uses **tsx** to run TypeScript directly without a build step. This simplifies both development and production workflows.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    @mevscan/shared                          │
│  shared/src/                                                │
│  ├── index.ts      # Re-exports all modules                 │
│  ├── types.ts      # Shared type definitions                │
│  ├── clickhouse.ts # ClickHouse client utilities            │
│  └── ably.ts       # Ably channel constants                 │
└─────────────────────────────────────────────────────────────┘
          ▲                    ▲                    ▲
          │                    │                    │
    ┌─────┴─────┐        ┌─────┴─────┐        ┌─────┴─────┐
    │  server   │        │  client   │        │ websocket │
    │  (tsx)    │        │  (Vite)   │        │  (tsx)    │
    └───────────┘        └───────────┘        └───────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `tsconfig.base.json` | Shared TypeScript compiler options |
| `shared/src/index.ts` | Central export point for all shared code |
| `shared/package.json` | Exports point directly to `.ts` files |

### Shared Package Exports

The `@mevscan/shared` package exports TypeScript source files directly:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts",
    "./clickhouse": "./src/clickhouse.ts",
    "./ably": "./src/ably.ts"
  }
}
```

### Importing Shared Code

```typescript
// Import everything from index
import { AuctionInfo, initClickHouseClient } from '@mevscan/shared';

// Or import from specific modules
import { ABLY_CHANNELS } from '@mevscan/shared/ably';
import { initClickHouseClient } from '@mevscan/shared/clickhouse';
import type { ExpressLaneTransaction } from '@mevscan/shared/types';
```

### Why tsx?

| Approach | Dev Workflow | Production | Trade-off |
|----------|--------------|------------|-----------|
| **Traditional (tsc)** | Build shared first, then run | Compiled JS | Complex workflow |
| **tsx (current)** | Just run, no build | tsx runtime | ~50ms startup overhead |

We chose tsx because:
- **Simpler workflow**: No build step needed for development
- **Faster iteration**: Changes to shared code take effect immediately
- **Consistent**: Same behavior in dev and production
- **Minimal overhead**: ~50ms startup time is negligible for long-running services

### Development Commands

```bash
# Run any service directly - no build step needed
npm run dev:server      # Start API server
npm run dev:websocket   # Start WebSocket service
npm run dev             # Start client (Vite)

# Type checking (without compilation)
npm run build:check --workspace=shared
```

### Docker Runtime

Both server and websocket Dockerfiles use tsx at runtime:

```dockerfile
CMD ["npx", "tsx", "index.ts"]
```

This means:
- No TypeScript compilation during Docker build
- Source `.ts` files are copied directly
- tsx executes TypeScript at container startup

## Troubleshooting

### Services Won't Start

1. **Check environment variables**: Ensure `.env` file exists with all required variables
   ```bash
   cat .env
   ```

2. **Check port availability**: Ensure ports 3001 and 8080 are not in use
   ```bash
   lsof -i :3001
   lsof -i :8080
   ```

3. **View error logs**:
   ```bash
   docker-compose logs api
   docker-compose logs web
   docker-compose logs websocket
   ```

### API Health Check Failing

1. **Check API logs**:
   ```bash
   docker-compose logs -f api
   ```

2. **Verify ClickHouse connection**: Ensure ClickHouse credentials in `.env` are correct

3. **Test API directly**:
   ```bash
   curl http://localhost:3001/health
   ```

### Web Service Not Loading

1. **Check web logs**:
   ```bash
   docker-compose logs -f web
   ```

2. **Verify API dependency**: Ensure API service is running
   ```bash
   docker-compose ps
   ```

3. **Check nginx configuration**: Verify `nginx.conf` is correct

### Rebuild Issues

If you encounter build errors:

1. **Clean Docker cache**:
   ```bash
   docker-compose build --no-cache
   ```

2. **Remove old images**:
   ```bash
   docker-compose down --rmi all
   docker-compose up --build -d
   ```

### Database Connection Issues

1. **Verify ClickHouse is accessible** from the Docker network
2. **Check firewall rules** if ClickHouse is on a remote server
3. **Test connection manually**:
   ```bash
   docker-compose exec api sh
   # Inside container, test connection
   ```

### WebSocket Service Issues

1. **Check websocket logs**:
   ```bash
   docker-compose logs -f websocket
   ```

2. **Verify Ably API key**: Ensure `ABLY_API_KEY` is set correctly in `.env`

3. **Check ClickHouse connection**: The websocket service needs ClickHouse access for querying live data

## Development vs Production

### Development

For local development, run services directly using tsx (no build step needed):

**Setup:**
```bash
npm install   # Install all workspace dependencies
```

**Run services:**
```bash
npm run dev             # Frontend (Vite) - localhost:5173
npm run dev:server      # API server - localhost:3001
npm run dev:websocket   # WebSocket service
```

**Watch mode (auto-restart on changes):**
```bash
npm run dev:watch --workspace=server
npm run dev:watch --workspace=websocket
```

**Key benefit:** No need to build the shared package first. tsx runs TypeScript directly.

### Production

Use Docker Compose for production deployments:

```bash
# Build and start all services
docker-compose up --build -d

# Monitor logs
docker-compose logs -f
```

Both server and websocket containers use tsx at runtime, so there's no TypeScript compilation step during Docker build.

## Health Checks

The API service includes a health check that runs every 30 seconds. You can monitor service health:

```bash
# Check service health status
docker-compose ps

# View health check logs
docker-compose logs api | grep health
```

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for ClickHouse database
- Consider using Docker secrets for sensitive data in production
- The nginx configuration includes security headers (X-Frame-Options, X-Content-Type-Options, etc.)

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](./README.md)
- [Environment Setup Guide](./ENV_SETUP.md)

