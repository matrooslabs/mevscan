# Build stage for API server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install dependencies (this will install all workspaces and create symlinks)
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY server/ ./server/

# Build TypeScript for all required workspaces
WORKDIR /app/shared
RUN npm run build

WORKDIR /app/server
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install production dependencies for all workspaces to ensure proper linking
# This creates the workspace symlink for @mevscan/shared
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/server/dist ./server/dist
# Copy shared built files (needed for runtime resolution)
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

WORKDIR /app/server

EXPOSE 3001

CMD ["npm", "start"]
