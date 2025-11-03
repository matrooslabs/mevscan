# Code Style and Conventions

## Language and Framework
- **Language**: JavaScript (ES modules)
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.5

## Code Style Guidelines

### File Structure
- Components use `.jsx` extension
- CSS files are co-located with components (e.g., `Home.css` with `Home.jsx`)
- Services are in the `src/services/` directory

### Naming Conventions
- Components: PascalCase (e.g., `Home`, `Transaction`, `App`)
- Functions: camelCase (e.g., `getLatestTransactions`)
- Classes: PascalCase (e.g., `ApiClient`)
- Files: match component/class names (PascalCase for components, camelCase for utilities)

### Code Formatting
- Uses ESLint for linting
- ESLint configuration:
  - Uses recommended JavaScript rules
  - React Hooks recommended rules
  - React Refresh rules for Vite
  - Allows unused variables matching pattern `^[A-Z_]` (constants)

### Documentation
- JSDoc comments for API methods (see `apiClient.js`)
- Comments should be clear and concise

### React Patterns
- Uses functional components with hooks
- React Router for navigation
- Axios for HTTP requests (wrapped in ApiClient class)

### Error Handling
- Custom error handling in ApiClient class
- Errors are formatted with descriptive messages

### Project Structure
- Components organized in `src/pages/` for page-level components
- Services in `src/services/` for API/utility functions
- Assets in `src/assets/` for static resources