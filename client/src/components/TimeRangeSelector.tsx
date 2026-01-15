import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, styled } from '@mui/material';
import { TIME_RANGES, TIME_RANGE_LABELS, type TimeRange } from '../hooks/useTimeRange';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  size?: 'small' | 'default';
}

const StyledToggleButtonGroup = styled(ToggleButtonGroup)<{ $small?: boolean }>(({ $small }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: $small ? '1px solid #e2e8f0' : '2px solid #e2e8f0',
  borderRadius: $small ? 2 : 4,
  '& .MuiToggleButtonGroup-grouped': {
    margin: 0,
    border: 0,
    borderRadius: 0,
    '&:not(:last-of-type)': {
      borderRight: '1px solid #e2e8f0',
    },
    '&.Mui-selected': {
      backgroundColor: '#0099cc',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#007799',
      },
    },
  },
}));

const StyledToggleButton = styled(ToggleButton)<{ $small?: boolean }>(({ $small }) => ({
  fontFamily: '"IBM Plex Mono", "Courier New", monospace',
  fontWeight: 600,
  fontSize: $small ? '0.5rem' : '0.75rem',
  letterSpacing: '0.03em',
  padding: $small ? '2px 6px' : '6px 16px',
  minWidth: $small ? 'auto' : undefined,
  color: '#64748b',
  textTransform: 'uppercase',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'rgba(0, 153, 204, 0.08)',
    color: '#0099cc',
  },
}));

function TimeRangeSelector({ value, onChange, size = 'default' }: TimeRangeSelectorProps) {
  const isSmall = size === 'small';
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newRange: TimeRange | null) => {
    if (newRange !== null) {
      onChange(newRange);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <StyledToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="time range"
        size="small"
        $small={isSmall}
      >
        {TIME_RANGES.map((range) => (
          <StyledToggleButton key={range} value={range} aria-label={range} $small={isSmall}>
            {TIME_RANGE_LABELS[range]}
          </StyledToggleButton>
        ))}
      </StyledToggleButtonGroup>
    </Box>
  );
}

export default TimeRangeSelector;
