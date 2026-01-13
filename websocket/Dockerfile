# Websocket uses tsx to run TypeScript directly
FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY websocket/package.json ./websocket/

# Install all dependencies (tsx needed at runtime)
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY websocket/ ./websocket/

WORKDIR /app/websocket

CMD ["npx", "tsx", "index.ts"]
