# Build stage for WebSocket service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY websocket/package.json ./websocket/

# Install dependencies (this will install all workspaces and create symlinks)
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY server/ ./server/
COPY websocket/ ./websocket/

# Build TypeScript for all required workspaces
WORKDIR /app/shared
RUN npm run build

WORKDIR /app/server
RUN npm run build

WORKDIR /app/websocket
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY websocket/package.json ./websocket/

# Install production dependencies for all workspaces to ensure proper linking
# This creates the workspace symlinks
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/websocket/dist ./websocket/dist
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/server/dist ./server/dist

WORKDIR /app/websocket

CMD ["npm", "start"]

