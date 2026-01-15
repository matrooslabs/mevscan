import { Card, CardContent, Typography, CircularProgress, Alert, Box } from '@mui/material';
import type { ReactNode } from 'react';
import './ChartCard.css';

export interface ChartCardProps {
  title: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'default' | 'medium' | 'compact' | 'mini';
  accentColor?: string;
  headerAction?: ReactNode;
}

function ChartCard({
  title,
  isLoading = false,
  isError = false,
  errorMessage,
  children,
  className = 'chart-card-full',
  contentClassName,
  variant = 'default',
  accentColor,
  headerAction,
}: ChartCardProps) {
  const variantClass = `chart-card-${variant}`;
  const cardClassName = ['chart-card', variantClass, className].filter(Boolean).join(' ');
  const mergedContentClassName = ['chart-card-content', contentClassName].filter(Boolean).join(' ');

  const titleVariant =
    variant === 'mini' ? 'subtitle2' : variant === 'compact' || variant === 'medium' ? 'h6' : 'h5';

  return (
    <Card
      className={cardClassName}
      sx={
        accentColor
          ? {
              borderLeft: `4px solid ${accentColor}`,
              '&:hover': {
                borderLeftColor: accentColor,
              },
            }
          : undefined
      }
    >
      <CardContent className={mergedContentClassName}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: headerAction ? 1 : 0,
          }}
        >
          <Typography
            variant={titleVariant}
            component="h2"
            className="chart-card-title"
            sx={
              accentColor
                ? {
                    color: accentColor,
                    textShadow: `0 0 20px ${accentColor}40`,
                    marginBottom: 0,
                  }
                : { marginBottom: 0 }
            }
          >
            {title}
          </Typography>
          {headerAction}
        </Box>
        {isLoading ? (
          <Box className="loading-container">
            <CircularProgress
              size={
                variant === 'mini' ? 24 : variant === 'compact' || variant === 'medium' ? 32 : 40
              }
            />
          </Box>
        ) : isError ? (
          <Alert severity="error" sx={{ fontSize: variant === 'mini' ? '0.75rem' : '0.875rem' }}>
            {errorMessage || 'Failed to load data'}
          </Alert>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default ChartCard;
