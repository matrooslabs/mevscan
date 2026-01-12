import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box } from '@mui/material'
import TimeSeriesChart, { type LineConfig } from './TimeSeriesChart'
import TimeRangeSelector from './TimeRangeSelector'
import ChartCard from './ChartCard'
import { type TimeRange } from '../hooks/useTimeRange'

interface TimeSeriesChartWithControlsProps {
  /** Chart title */
  title: string
  /** Unique query key for caching */
  queryKey: string
  /** Function to fetch data given a time range */
  fetchData: (timeRange: string) => Promise<unknown[]>
  /** Transform raw data to chart format */
  transformData?: (data: unknown[]) => Record<string, unknown>[]
  /** Static line configurations for the chart */
  lines: LineConfig[]
  /** Dynamic line config generator (called with raw data) */
  dynamicLines?: (data: unknown[]) => LineConfig[]
  /** Y-axis label */
  yAxisLabel?: string
  /** X-axis key in the data */
  xAxisKey?: string
  /** Show area under lines */
  showArea?: boolean
  /** Hide zero values */
  hideZeroValues?: boolean
  /** Show grid lines */
  showGrid?: boolean
  /** Show legend */
  showLegend?: boolean
  /** Default time range */
  defaultTimeRange?: TimeRange
  /** ChartCard className */
  className?: string
  /** ChartCard variant */
  variant?: 'default' | 'medium' | 'compact' | 'mini'
  /** Accent color for the card */
  accentColor?: string
}

const QUERY_CONFIG = {
  staleTime: 30 * 1000,
  refetchInterval: 60 * 1000,
  refetchOnWindowFocus: false,
}

function TimeSeriesChartWithControls({
  title,
  queryKey,
  fetchData,
  transformData,
  lines,
  dynamicLines,
  yAxisLabel,
  xAxisKey = 'time',
  showArea = true,
  hideZeroValues = true,
  showGrid = false,
  showLegend = true,
  defaultTimeRange = '1d',
  className,
  variant = 'default',
  accentColor,
}: TimeSeriesChartWithControlsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [queryKey, timeRange],
    queryFn: () => fetchData(timeRange),
    ...QUERY_CONFIG,
  })

  const chartData = useMemo(() => {
    if (!data) return []
    if (transformData) {
      return transformData(data)
    }
    return data as Record<string, unknown>[]
  }, [data, transformData])

  // Use dynamic lines if provided, otherwise use static lines
  const chartLines = useMemo(() => {
    if (dynamicLines && data) {
      return dynamicLines(data)
    }
    return lines
  }, [dynamicLines, data, lines])

  const selector = (
    <TimeRangeSelector value={timeRange} onChange={setTimeRange} size="small" />
  )

  return (
    <ChartCard
      title={title}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      className={className}
      variant={variant}
      accentColor={accentColor}
      headerAction={selector}
    >
      <TimeSeriesChart
        data={chartData}
        xAxisKey={xAxisKey}
        yAxisLabel={yAxisLabel}
        showArea={showArea}
        hideZeroValues={hideZeroValues}
        showGrid={showGrid}
        showLegend={showLegend}
        timeRange={timeRange}
        lines={chartLines}
      />
    </ChartCard>
  )
}

export default TimeSeriesChartWithControls
