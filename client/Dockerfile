# Build stage for React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY client/package.json ./client/

# Install dependencies (this will install all workspaces)
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY client/ ./client/

# Build argument for API base URL (empty string = relative URLs)
ARG VITE_API_BASE_URL=

# Set environment variable for build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the app
WORKDIR /app/client
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
