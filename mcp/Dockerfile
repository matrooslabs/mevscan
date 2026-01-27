# MCP server uses tsx to run TypeScript directly
FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy workspace package files
COPY shared/package.json ./shared/
COPY mcp/package.json ./mcp/

# Install all dependencies (tsx needed at runtime)
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY mcp/ ./mcp/

WORKDIR /app/mcp

CMD ["npx", "tsx", "index.ts"]
