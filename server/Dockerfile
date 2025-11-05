# Build stage for API server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY server/ ./

# Copy shared types to parent directory to maintain ../shared/types import path
WORKDIR /
COPY shared/ /shared/

WORKDIR /app

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
# Note: shared types are only needed at build time, but copy anyway for consistency
COPY --from=builder /shared /shared

EXPOSE 3001

CMD ["npm", "start"]

