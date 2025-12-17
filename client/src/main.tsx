import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import * as Ably from 'ably'
import { AblyProvider } from 'ably/react'
import theme from './theme'
import './styles/global.css'
import App from './App'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Create Ably client for real-time subscriptions
const ablyClient = new Ably.Realtime({
  key: import.meta.env.VITE_ABLY_SUBSCRIBE_KEY,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AblyProvider client={ablyClient}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </AblyProvider>
    </ThemeProvider>
  </StrictMode>,
)

