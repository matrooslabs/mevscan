// src/theme.ts

import { createTheme } from '@mui/material/styles';

// Optional: extend the palette a tiny bit for borders

declare module '@mui/material/styles' {
  interface Palette {
    border: {
      primary: string;
      secondary: string;
    };
  }
  interface PaletteOptions {
    border?: {
      primary: string;
      secondary: string;
    };
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ffb200',   // --color-primary
      dark: '#e59400',   // --color-primary-hover-ish
      light: '#ffe7aa',
      contrastText: '#000000',
    },
    secondary: {
      main: '#111827',   // strong text color
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5', // --color-bg-secondary (body)
      paper: '#ffffff',   // --color-bg-primary / surface
    },
    text: {
      primary: '#111827',   // --color-text-primary
      secondary: '#6b7280', // --color-text-secondary
    },
    divider: '#e5e7eb',     // --color-border-primary
    border: {
      primary: '#e5e7eb',   // --color-border-primary
      secondary: '#d1d5db', // --color-border-secondary
    },
  },
  typography: {
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif", // --font-family-base
    h1: { fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2 },
    h2: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.25 },
    h3: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.3 },
    h4: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.35 },
    h5: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.4 },
    h6: { fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.45 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.04em',
      fontSize: '0.9rem',
    },
  },
  shape: {
    borderRadius: 8, // --radius-md
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.1)',  // close to --shadow-sm
    '0 2px 4px rgba(0, 0, 0, 0.1)',  // --shadow-md
    '0 4px 8px rgba(0, 0, 0, 0.15)', // --shadow-lg
    // rest can just reuse MUI defaults, so we spread them:
    ...Array(21).fill('0 2px 4px rgba(0, 0, 0, 0.1)'),
  ] as any,
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 9999, // --radius-pill
          paddingInline: '1.25rem',
          paddingBlock: '0.55rem',
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: '#ffb200',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#e59400', // hover
          },
        },
        outlined: {
          borderColor: '#d1d5db', // --color-border-secondary
          backgroundColor: '#ffffff',
          '&:hover': {
            borderColor: '#ffb200',
            backgroundColor: '#f9fafb', // --color-bg-quaternary
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#111827',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)', // --shadow-card-ish
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',       // --color-bg-surface
          borderRadius: 12,                 // --radius-lg
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 10px rgba(15,23,42,0.06)', // --shadow-card
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12, // keep consistent with cards
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // pill
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
        },
        colorPrimary: {
          backgroundColor: 'rgba(255, 178, 0, 0.12)',
          color: '#ffb200',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: '#e5e7eb',
            },
            '&:hover fieldset': {
              borderColor: '#d1d5db',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffb200',
              boxShadow: '0 0 0 1px rgba(255, 178, 0, 0.35)',
            },
          },
        },
      },
    },
  },
});

export default theme;

// Chart color palette for data visualizations
export const chartColorPalette = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
  '#00c49f', '#ffbb28', '#ff8042', '#8884d8', '#82ca9d',
  '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28'
];

