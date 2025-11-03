# Project Overview

## Purpose
**MEVGPT** is a React-based web application for viewing and analyzing blockchain data, specifically focused on:
- Latest blockchain transactions
- Latest blocks
- Transaction details
- MEV (Maximal Extractable Value) extraction data

The application provides a user interface to interact with blockchain data through a backend API.

## Tech Stack

### Core Technologies
- **React 19.1.1** - UI library
- **Vite 7.1.7** - Build tool and dev server
- **React Router DOM 7.9.5** - Client-side routing

### HTTP Client
- **Axios 1.13.1** - HTTP client library (wrapped in custom ApiClient class)

### Development Tools
- **ESLint 9.36.0** - Linting and code quality
- **@eslint/js** - ESLint recommended rules
- **eslint-plugin-react-hooks** - React Hooks linting rules
- **eslint-plugin-react-refresh** - Fast Refresh support

### Type Definitions
- **@types/react** - React TypeScript definitions
- **@types/react-dom** - React DOM TypeScript definitions

## Architecture

### Frontend Architecture
- Single Page Application (SPA) using React Router
- Component-based architecture with functional components
- Service layer for API communication (`ApiClient` class)
- Separation of concerns: pages, services, and assets

### API Integration
- Centralized API client (`ApiClient`) using Axios
- Base URL configurable via constructor
- Standardized error handling
- RESTful API endpoints:
  - `/transactions` - Latest transactions
  - `/blocks` - Latest blocks
  - `/blocks/:blockId` - Specific block
  - `/transactions/:transactionId` - Specific transaction

## Development Environment
- **Node.js** - JavaScript runtime
- **npm** - Package manager
- **Darwin/macOS** - Development OS
- **Module System**: ES Modules (`"type": "module"` in package.json)

## Build Output
- Production builds output to `dist/` directory
- Development server provides Hot Module Replacement (HMR)