# Shared Type Definitions

This directory contains shared TypeScript type definitions used by both the server and client.

## File: `types.ts`

The `types.ts` file contains all the API response types:

- **Transaction** - Transaction data structure
- **BlockListItem** - Block data for list views
- **Block** - Detailed block data (extends BlockListItem)
- **Address** - Address/account data
- **ErrorResponse** - Error response structure
- **HealthResponse** - Health check response
- **RootResponse** - Root endpoint response
- **ApiResponse<T>** - Generic API response wrapper

## Usage

### In Server (JavaScript with JSDoc)

The server uses JSDoc type annotations to reference these types:

```javascript
/**
 * @typedef {import('../shared/types').Transaction} Transaction
 */

app.get('/transactions/:id', (req, res) => {
  // res.json() will be type-checked as Transaction
});
```

### In Client (JavaScript with JSDoc)

The client also uses JSDoc type annotations:

```javascript
/**
 * @typedef {import('../../shared/types').Transaction} Transaction
 */

async getTransaction(id) {
  // Return type is Promise<Transaction>
}
```

### In TypeScript Files

If you convert files to TypeScript, you can import directly:

```typescript
import type { Transaction, Block, Address } from '../shared/types';
```

## Benefits

1. **Type Safety**: Both server and client use the same type definitions
2. **Single Source of Truth**: All API contract changes happen in one place
3. **Better IDE Support**: Autocomplete and type checking across the codebase
4. **Documentation**: Types serve as inline API documentation
5. **Clean Structure**: Shared directory makes it clear these types are used by both projects

## Adding New Types

When adding new API endpoints:

1. Define the response type in `shared/types.ts`
2. Update server route handlers with JSDoc type annotations
3. Update client API client methods with JSDoc type annotations
4. Update React Query hooks if needed


