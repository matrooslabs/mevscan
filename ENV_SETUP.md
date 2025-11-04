# Environment Variable Configuration

This project uses Vite's environment variable system to configure the API URL for different environments.

## How It Works

The API base URL is configured in `src/hooks/useApi.js`:
```javascript
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001')
```

Vite automatically loads environment variables from `.env` files. Variables must be prefixed with `VITE_` to be exposed to the client code.

## Setup for Different Environments

### Development (Local)

Create a `.env.local` file in the project root:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

This file is automatically ignored by git (already in `.gitignore`).

### Production

There are several ways to set the production API URL:

#### Option 1: Create `.env.production` file (Recommended)

Create a `.env.production` file in the project root:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

When you run `npm run build`, Vite will automatically use values from `.env.production`.

#### Option 2: Use environment variables during build

Set the environment variable when building:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

#### Option 3: Use CI/CD environment variables

In your CI/CD pipeline (GitHub Actions, GitLab CI, etc.), set the environment variable:

**GitHub Actions example:**
```yaml
- name: Build
  run: npm run build
  env:
    VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

**GitLab CI example:**
```yaml
build:
  script:
    - VITE_API_BASE_URL=$API_BASE_URL npm run build
```

## Environment File Priority

Vite loads environment variables in this order (higher priority overrides lower):

1. `.env.production.local` (only loaded in production, ignored by git)
2. `.env.local` (ignored by git)
3. `.env.production` (only loaded in production)
4. `.env` (loaded in all cases)

## Important Notes

⚠️ **Security Warning**: Environment variables prefixed with `VITE_` are embedded into the client bundle at build time. They are visible to anyone who inspects your JavaScript bundle. **Never put sensitive data like API keys or secrets in `VITE_*` variables.**

✅ **Safe for**: API URLs, feature flags, public configuration values

## Example Files

### `.env.local` (for local development)
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### `.env.production` (for production builds)
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

### `.env.production.local` (for local production testing)
```bash
VITE_API_BASE_URL=https://staging-api.yourdomain.com
```

## Verifying Configuration

After building, you can verify the API URL was set correctly by:

1. Inspecting the built JavaScript files in `dist/assets/`
2. Searching for your API URL in the bundled code
3. Or add a temporary console.log in your code during development:
   ```javascript
   console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
   ```

## Troubleshooting

**Issue**: API calls still going to localhost in production
- Make sure you're building with the production environment: `npm run build`
- Check that `.env.production` exists and has the correct value
- Verify the variable is prefixed with `VITE_`
- Rebuild after changing `.env` files (Vite only reads them at build time)

**Issue**: Environment variable not working
- Remember: variables must start with `VITE_` to be available in client code
- Check for typos in variable names
- Restart the dev server after creating/modifying `.env` files



