# MEVScan API Server

Express.js server that provides dummy API responses for the MEVScan application.

## Installation

```bash
cd server
npm install
```

## Running the Server

### Production mode

```bash
npm start
```

### Development mode (with auto-reload)

```bash
npm run dev
```

The server will start on `http://localhost:3001` by default (or the port specified in the `PORT` environment variable).

## API Endpoints

- `GET /` - API information and available endpoints
- `GET /health` - Health check endpoint
- `GET /api/latest-transactions` - Get latest transactions
- `GET /api/latest-blocks` - Get latest blocks
- `GET /api/blocks/:blockId` - Get a specific block by hash or number
- `GET /api/transactions/:transactionId` - Get a specific transaction by hash
- `GET /api/addresses/:address` - Get address information

All endpoints return dummy/mock data for development and testing purposes.

## Example Requests

```bash
# Get latest transactions
curl http://localhost:3001/api/latest-transactions

# Get latest blocks
curl http://localhost:3001/api/latest-blocks

# Get a specific block
curl http://localhost:3001/api/blocks/23717104

# Get a specific transaction
curl http://localhost:3001/api/transactions/0xb791a07c9aefa03db87f8ad128121ed5b8a7096d8c968df682686ac7ea61e594

# Get address information
curl http://localhost:3001/api/addresses/0xdadB0d80...24f783711
```
