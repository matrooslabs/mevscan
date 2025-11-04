/// <reference types="vite/client" />
/// <reference types="react" />

// React 19 + TypeScript + Vite workaround for react/jsx-runtime
// This is needed due to moduleResolution: "bundler" and React 19 compatibility
declare module 'react/jsx-runtime';

// Ensure JSX namespace is available globally
declare namespace JSX {
  interface IntrinsicElements extends React.JSX.IntrinsicElements {}
}

