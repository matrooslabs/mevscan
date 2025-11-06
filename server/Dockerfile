# Build stage for API server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install dependencies (this will install all workspaces)
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY server/ ./server/

# Build TypeScript
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

# Install production dependencies only (workspace-aware)
RUN npm ci --only=production --workspace=server

# Copy built files from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/shared ./shared

WORKDIR /app/server

EXPOSE 3001

CMD ["npm", "start"]
