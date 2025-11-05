# Build stage for React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build argument for API base URL (empty string = relative URLs)
ARG VITE_API_BASE_URL=

# Set environment variable for build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

