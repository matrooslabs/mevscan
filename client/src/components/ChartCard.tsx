import { Card, CardContent, Typography, CircularProgress, Alert, Box } from '@mui/material'
import type { ReactNode } from 'react'
import './ChartCard.css'

export interface ChartCardProps {
  title: string
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

function ChartCard({
  title,
  isLoading,
  isError,
  errorMessage,
  children,
  className = 'chart-card-full',
  contentClassName,
}: ChartCardProps) {
  const cardClassName = ['chart-card', className].filter(Boolean).join(' ')
  const mergedContentClassName = ['chart-card-content', contentClassName].filter(Boolean).join(' ')

  return (
    <Card className={cardClassName}>
      <CardContent className={mergedContentClassName}>
        <Typography variant="h5" component="h2" className="chart-card-title">
          {title}
        </Typography>
        {isLoading ? (
          <Box className="loading-container">
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error">{errorMessage || 'Failed to load data'}</Alert>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

export default ChartCard

