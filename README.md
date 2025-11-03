# MEV GPT

A React-based web application for viewing and analyzing blockchain data, specifically focused on MEV (Maximal Extractable Value) extraction data.

## Quick Start

### Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Start the API server (in a separate terminal):
```bash
cd server
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

### Production Build

1. Set your production API URL (see [Environment Variables](#environment-variables) below)

2. Build the application:
```bash
npm run build
```

3. The built files will be in the `dist/` directory, ready to be deployed to any static hosting service.

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

- **React 19.1.1** - UI library
- **Vite 7.1.7** - Build tool and dev server
- **React Router DOM 7.9.5** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **TypeScript** - Type safety (server)

## Project Structure

```
mevgpt/
├── server/          # Express.js API server (TypeScript)
├── src/             # React application
│   ├── components/  # React components
│   ├── pages/       # Page components
│   ├── hooks/       # React hooks (including API hooks)
│   ├── services/    # API client service
│   └── styles/      # Global styles
├── shared/          # Shared TypeScript types
└── dist/            # Production build output
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
