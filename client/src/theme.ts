// src/theme.ts

import { createTheme } from '@mui/material/styles';
import type { Shadows } from '@mui/material/styles';

// Extended palette for neo-brutalist aesthetic
declare module '@mui/material/styles' {
  interface Palette {
    border: {
      primary: string;
      secondary: string;
      accent: string;
    };
    accent: {
      cyan: string;
      magenta: string;
      lime: string;
      amber: string;
    };
  }
  interface PaletteOptions {
    border?: {
      primary: string;
      secondary: string;
      accent: string;
    };
    accent?: {
      cyan: string;
      magenta: string;
      lime: string;
      amber: string;
    };
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0099cc', // Electric cyan (slightly darker for light mode)
      dark: '#007799',
      light: '#00bbee',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#cc0066', // Hot magenta (slightly darker)
      dark: '#990050',
      light: '#ff0080',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa', // Light gray background
      paper: '#ffffff', // Pure white surface
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: 'rgba(15, 23, 42, 0.1)',
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      accent: '#0099cc',
    },
    accent: {
      cyan: '#0099cc',
      magenta: '#cc0066',
      lime: '#00aa66',
      amber: '#ff9500',
    },
  },
  typography: {
    fontFamily: '"Manrope", "DM Sans", system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: 1.25,
    },
    h4: {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      letterSpacing: '0.01em',
    },
    h6: {
      fontWeight: 700,
      fontSize: '1rem',
      lineHeight: 1.45,
      letterSpacing: '0.01em',
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      letterSpacing: '0.005em',
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      letterSpacing: '0.005em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      fontWeight: 600,
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 700,
      letterSpacing: '0.08em',
      fontSize: '0.8125rem',
    },
  },
  shape: {
    borderRadius: 4, // Sharp corners for brutalist feel
  },
  shadows: [
    'none',
    '0 0 0 1px rgba(0, 153, 204, 0.1)',
    '0 0 0 2px rgba(0, 153, 204, 0.15)',
    '0 0 0 3px rgba(0, 153, 204, 0.2)',
    '0 2px 8px rgba(15, 23, 42, 0.08)',
    ...Array(20).fill('0 2px 12px rgba(15, 23, 42, 0.1)'),
  ] as Shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@import': [
          'url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap")',
        ].join(''),
        body: {
          minWidth: 320,
          minHeight: '100vh',
          fontFamily: '"Manrope", "DM Sans", system-ui, sans-serif',
          color: '#0f172a',
          backgroundColor: '#f8f9fa',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 4,
          paddingInline: '1.5rem',
          paddingBlock: '0.625rem',
          fontWeight: 700,
          border: '2px solid transparent',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          backgroundColor: '#0099cc',
          color: '#ffffff',
          border: '2px solid #0099cc',
          '&:hover': {
            backgroundColor: '#007799',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0, 153, 204, 0.3)',
          },
        },
        outlined: {
          borderColor: '#cbd5e1',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          color: '#0099cc',
          borderWidth: '2px',
          '&:hover': {
            borderColor: '#0099cc',
            backgroundColor: 'rgba(0, 153, 204, 0.05)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          color: '#0f172a',
          borderBottom: '2px solid rgba(0, 153, 204, 0.15)',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: 4,
          border: '2px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'rgba(0, 153, 204, 0.3)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.6875rem',
          border: '2px solid',
        },
        colorPrimary: {
          backgroundColor: 'rgba(0, 153, 204, 0.1)',
          borderColor: '#0099cc',
          color: '#0099cc',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '& fieldset': {
              borderColor: '#cbd5e1',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0099cc',
              boxShadow: '0 0 0 3px rgba(0, 153, 204, 0.15)',
            },
          },
        },
      },
    },
  },
});

export default theme;

// Chart color palette for data visualizations - bold, high-contrast colors
export const chartColorPalette = [
  '#00d4ff', // Electric cyan
  '#ff0080', // Hot magenta
  '#00ff88', // Neon lime
  '#ffb800', // Amber
  '#9d4edd', // Purple
  '#06ffa5', // Mint
  '#ff6b35', // Orange
  '#00b4d8', // Ocean blue
  '#f72585', // Pink
  '#4cc9f0', // Sky blue
  '#7209b7', // Deep purple
  '#3a86ff', // Bright blue
  '#fb5607', // Burnt orange
  '#8338ec', // Violet
  '#06d6a0', // Teal
];

// Named chart colors for specific use cases
export const chartColors = {
  total: '#0f172a', // Dark for total values
  normal: '#ff9500', // Amber for normal values
  timeboost: '#00aa66', // Green for timeboost values
  atomic: '#0099cc', // Cyan for atomic
  cexdex: '#cc0066', // Magenta for cexdex
  liquidation: '#8b3fd8', // Purple for liquidation
} as const;

// Chart styling theme - centralized color configuration for all charts
export const chartTheme = {
  text: {
    legend: 'rgba(15, 23, 42, 0.85)', // Legend text color
    axisLabel: 'rgba(15, 23, 42, 0.6)', // Axis label color
    axisName: 'rgba(15, 23, 42, 0.6)', // Axis name color
  },
  line: {
    axis: 'rgba(15, 23, 42, 0.15)', // Axis line color
    grid: 'rgba(15, 23, 42, 0.1)', // Grid line color
    border: 'rgba(15, 23, 42, 0.2)', // Border color for bars/elements
    borderEmphasis: 'rgba(15, 23, 42, 0.4)', // Border color on hover/emphasis
  },
  fontSize: {
    legend: 12,
    axisLabel: 11,
    axisLabelMedium: 12,
  },
} as const;
