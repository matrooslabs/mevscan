# Server uses tsx to run TypeScript directly
FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install all dependencies (tsx needed at runtime)
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY server/ ./server/

WORKDIR /app/server

EXPOSE 3001

CMD ["npx", "tsx", "index.ts"]
