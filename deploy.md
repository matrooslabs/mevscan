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

# Ably Configuration (for WebSocket service)
ABLY_API_KEY=your_ably_api_key
```

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
├── shared/          # @mevscan/shared - Common TypeScript types
├── server/          # @mevscan/server - Express.js API
├── client/          # @mevscan/client - React application
├── websocket/       # @mevscan/websocket - Real-time data streaming
├── package.json     # Root workspace configuration
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

For local development, it's recommended to run services directly (not via Docker):

**Prerequisites:**
1. Install dependencies from the root directory:
   ```bash
   npm install
   ```
   This will install all workspace dependencies (shared, server, client).

2. Run services:
   - **Frontend**: `npm run dev` (from project root) - starts React dev server on localhost:5173
   - **Backend**: `npm run dev:server` (from project root) or `npm run dev` (from `server/` directory)
   - **Backend (watch mode)**: `npm run dev:watch` (from project root) or `npm run dev:watch` (from `server/` directory)
   - **WebSocket**: `npm run dev` (from `websocket/` directory) or `npm run dev:watch` for watch mode

**Workspace Structure:**
- Root: Contains workspace configuration and shared scripts
- `shared/`: Type definitions used by server, client, and websocket
- `server/`: Express.js API server
- `client/`: React application
- `websocket/`: Real-time data streaming service

### Production

Use Docker Compose for production deployments:

1. Set production environment variables in `.env`
2. Build and start services: `docker-compose up --build -d`
3. Monitor logs: `docker-compose logs -f`

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

