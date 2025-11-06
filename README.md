# MEVScan

A React-based web application for viewing and analyzing blockchain data, specifically focused on MEV (Maximal Extractable Value) extraction data. This project visualizes MEV analysis data stored in ClickHouse, including Timeboost protocol performance metrics, revenue, real-time bids, and Express Lane controller profits.

## Quick Start

### Development

This project uses npm workspaces with three packages:
- **shared** (`@mevscan/shared`): Common TypeScript type definitions
- **server** (`@mevscan/server`): Express.js backend server
- **client** (`@mevscan/client`): React frontend application

1. Install dependencies (from project root):
```bash
npm install
```
This installs dependencies for all workspaces.

2. Start the React development server:
```bash
npm run dev
```
This starts the client dev server with HMR at `http://localhost:5173`.

3. Start the API server (in a separate terminal):
```bash
npm run dev:server
```
Or use watch mode for auto-reload:
```bash
npm run dev:watch
```

The app will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

### Production Build

1. Set your production API URL (see [Environment Variables](#environment-variables) below)

2. Build all workspaces:
```bash
npm run build
```

Or build individually:
```bash
npm run build:client  # Build React app
npm run build:server  # Build Express server
```

3. The built files will be in:
   - `client/dist/` - React application (ready for static hosting)
   - `server/dist/` - Express server (ready to run with `npm start`)

### Docker Deployment

For containerized deployment, see [DEPLOY.md](./DEPLOY.md) for detailed instructions.

Quick start with Docker Compose:
```bash
docker-compose up --build
```

Services:
- **API**: `localhost:3001` (health: `/health`)
- **Web**: `localhost:8080` (nginx proxies API requests)

## Environment Variables

This project uses environment variables to configure the API URL for different environments.

**For local development**, create a `.env.local` file:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

**For production**, create a `.env.production` file:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions on configuring environment variables for different deployment scenarios.

## Tech Stack

### Frontend (Client)
- **React 19.1.1** - UI library
- **Vite 7.1.7** - Build tool and dev server
- **React Router DOM 7.9.5** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Material UI** - Component library
- **Recharts** - Charting library
- **Viem** - Ethereum utilities

### Backend (Server)
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **ClickHouse Client** - Database client
- **Node.js** - Runtime

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and static file server

## Project Structure

```
mevscan/
├── client/              # @mevscan/client - React frontend application
│   ├── src/
│   │   ├── components/  # React components (charts, details, navbar)
│   │   ├── pages/       # Page components (Dashboard, Home, Address, Block, Transaction)
│   │   ├── hooks/       # React hooks (useApi, useWallet)
│   │   ├── services/    # API client service
│   │   └── styles/      # Global styles
│   ├── public/          # Static assets
│   ├── dist/            # Production build output
│   ├── Dockerfile       # Client Docker image
│   └── package.json
├── server/              # @mevscan/server - Express.js API server
│   ├── index.ts         # Main server file
│   ├── middleware/      # Express middleware (cache)
│   ├── dist/            # Compiled TypeScript output
│   ├── Dockerfile       # Server Docker image
│   └── package.json
├── shared/              # @mevscan/shared - Shared TypeScript types
│   ├── types.ts         # Type definitions for API communication
│   └── package.json
├── schema/              # ClickHouse database schemas
│   ├── blocks.sql
│   ├── mev_blocks.sql
│   ├── atomic_arbs.sql
│   ├── liquidations.sql
│   └── ...              # Other schema files
├── docker-compose.yml   # Docker Compose configuration
├── nginx.conf           # Nginx configuration for web service
├── package.json         # Root workspace configuration
└── README.md
```

## Available Scripts

### Root Level (Workspace Commands)
- `npm run dev` - Start React development server (client)
- `npm run dev:server` - Start API development server
- `npm run dev:watch` - Start API server with watch mode (auto-reload)
- `npm run build` - Build all workspaces
- `npm run build:client` - Build React application only
- `npm run build:server` - Build Express server only
- `npm run lint` - Run ESLint across all workspaces

### Client Workspace (`client/`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Server Workspace (`server/`)
- `npm run dev` - Start development server (ts-node)
- `npm run dev:watch` - Start with nodemon (auto-reload)
- `npm run build` - Compile TypeScript
- `npm start` - Run production build

## Architecture

- **Server** (`server/`): Express.js API server that queries ClickHouse database and returns JSON responses
- **Client** (`client/`): React application that consumes the API and visualizes MEV data
- **Shared** (`shared/`): Type definitions/interfaces for frontend-backend communication
- **Schema** (`schema/`): ClickHouse database schema definitions

For each visualization:
1. Define an interface in `shared/types.ts`
2. Create an endpoint in `server/index.ts`
3. Add a method in `client/src/services/apiClient.ts`
4. Add the visualization to the Dashboard page

## Guidelines

- **Time Range**: SQL queries should default to the last 15 minutes. API endpoints support time range parameters: `5min`, `15min`, `30min`, `1hour`
- **Database Schema**: Located under `./schema` directory
- **Type Definitions**: All API interfaces should be defined in `shared/types.ts`
