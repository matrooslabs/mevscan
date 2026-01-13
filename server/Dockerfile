# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install dependencies
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY server/ ./server/

# Build shared first, then server (using project references)
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

WORKDIR /app/server

EXPOSE 3001

CMD ["npm", "start"]
