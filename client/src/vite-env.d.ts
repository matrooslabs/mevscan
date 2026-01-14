/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

// React 19 + TypeScript + Vite workaround for react/jsx-runtime
// This is needed due to moduleResolution: "bundler" and React 19 compatibility
declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

// Ensure JSX namespace is available globally
declare namespace JSX {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, no-undef
  interface IntrinsicElements extends React.JSX.IntrinsicElements {}
}
