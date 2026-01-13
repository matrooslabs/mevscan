# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY websocket/package.json ./websocket/

# Install dependencies
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY websocket/ ./websocket/

# Build shared first, then websocket (using project references)
RUN npm run build --workspace=shared
RUN npm run build --workspace=websocket

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY websocket/package.json ./websocket/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/websocket/dist ./websocket/dist

WORKDIR /app/websocket

CMD ["npm", "start"]
