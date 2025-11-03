# Project Structure

## Directory Layout

```
/Users/jinsuk/code/mevgpt/
├── public/              # Static public assets
│   └── vite.svg
├── src/
│   ├── pages/           # Page-level React components
│   │   ├── Home.jsx     # Home page component
│   │   ├── Home.css     # Home page styles
│   │   └── Transaction.jsx  # Transaction detail page
│   ├── services/        # Service classes and utilities
│   │   └── apiClient.js # API client for backend communication
│   ├── assets/          # Static assets (images, etc.)
│   │   └── react.svg
│   ├── App.jsx          # Main app component with routing
│   ├── App.css          # App-level styles
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── dist/                # Production build output (gitignored)
├── node_modules/        # Dependencies (gitignored)
├── eslint.config.js     # ESLint configuration
├── vite.config.js       # Vite configuration
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Dependency lock file
└── README.md            # Project documentation
```

## Key Files

### Entry Points
- `src/main.jsx` - Application entry point, sets up React Router
- `src/App.jsx` - Main app component with route definitions

### Routing
- `/` - Home page (`Home` component)
- `/tx/:tx_hash` - Transaction detail page (`Transaction` component)

### Services
- `ApiClient` class in `src/services/apiClient.js`:
  - `getLatestTransactions()` - Fetch latest transactions
  - `getLatestBlocks()` - Fetch latest blocks
  - `getBlock(blockId)` - Fetch specific block
  - `getTransaction(transactionId)` - Fetch specific transaction