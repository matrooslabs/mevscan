/// <reference types="vite/client" />
/// <reference types="react" />

// Fix for react/jsx-runtime module declaration
declare module 'react/jsx-runtime';

// Ensure JSX namespace is available globally
declare namespace JSX {
  interface IntrinsicElements extends React.JSX.IntrinsicElements {}
}

