import './Dashboard.css'
import { useState, useMemo } from 'react'
import { Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, Box } from '@mui/material'
import TimeSeriesChart, { type TimeSeriesData } from '../components/TimeSeriesChart'
import PieChart, { type PieChartData } from '../components/PieChart'
import {
  useGrossMEV,
  useGrossAtomicArb,
  useGrossCexDexQuotes,
  useGrossLiquidation,
  useAtomicMEVTimeboosted,
  useExpressLaneMEVPercentage,
} from '../hooks/useApi'

function Dashboard() {
  const [timeRange, setTimeRange] = useState<string>('15min')

  // Fetch all data
  const grossMEV = useGrossMEV(timeRange)
  const grossAtomicArb = useGrossAtomicArb(timeRange)
  const grossCexDexQuotes = useGrossCexDexQuotes(timeRange)
  const grossLiquidation = useGrossLiquidation(timeRange)
  const atomicMEVTimeboosted = useAtomicMEVTimeboosted(timeRange)
  const expressLaneMEVPercentage = useExpressLaneMEVPercentage(timeRange)

  // Use time series data directly without transformation
  const transformTimeSeriesData = (data: typeof grossMEV.data): TimeSeriesData => {
    if (!data) return []
    return data.map((item) => ({
      time: item.time,
      total: item.total,
      normal: item.normal,
      timeboost: item.timeboost,
    }))
  }

  // Transform Atomic MEV Timeboosted data - aggregate by protocol
  const transformAtomicMEVData = useMemo(() => {
    if (!atomicMEVTimeboosted.data) return []
    
    // Group by time and sum all protocols
    const groupedByTime = new Map<string, { total: number }>()
    
    atomicMEVTimeboosted.data.forEach((item) => {
      const existing = groupedByTime.get(item.time) || { total: 0 }
      groupedByTime.set(item.time, {
        total: existing.total + item.profit_usd,
      })
    })
    
    // Convert to TimeSeriesData format
    return Array.from(groupedByTime.entries())
      .map(([time, values]) => ({
        time,
        total: values.total,
        normal: 0,
        timeboost: values.total, // All are timeboosted
      }))
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [atomicMEVTimeboosted.data])

  // Transform pie chart data
  const transformPieChartData = useMemo((): PieChartData[] => {
    if (!expressLaneMEVPercentage.data) return []
    
    const { total, timeboost, percentage } = expressLaneMEVPercentage.data
    const normal = total - timeboost
    
    return [
      {
        name: 'Normal',
        value: normal,
        color: '#ffc658',
      },
      {
        name: 'Timeboost',
        value: timeboost,
        color: '#82ca9d',
      },
    ]
  }, [expressLaneMEVPercentage.data])

  // Check if any query is loading
  const isLoading = 
    grossMEV.isLoading ||
    grossAtomicArb.isLoading ||
    grossCexDexQuotes.isLoading ||
    grossLiquidation.isLoading ||
    atomicMEVTimeboosted.isLoading ||
    expressLaneMEVPercentage.isLoading

  // Check if any query has error
  const hasError = 
    grossMEV.isError ||
    grossAtomicArb.isError ||
    grossCexDexQuotes.isError ||
    grossLiquidation.isError ||
    atomicMEVTimeboosted.isError ||
    expressLaneMEVPercentage.isError

  const errorMessage = 
    grossMEV.error?.message ||
    grossAtomicArb.error?.message ||
    grossCexDexQuotes.error?.message ||
    grossLiquidation.error?.message ||
    atomicMEVTimeboosted.error?.message ||
    expressLaneMEVPercentage.error?.message ||
    'An error occurred while fetching data'

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end', padding: '0 var(--spacing-lg)' }}>
        <FormControl size="small" style={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="5min">5 minutes</MenuItem>
            <MenuItem value="15min">15 minutes</MenuItem>
            <MenuItem value="30min">30 minutes</MenuItem>
            <MenuItem value="1hour">1 hour</MenuItem>
          </Select>
        </FormControl>
      </div>

      {hasError && (
        <Box style={{ padding: '0 var(--spacing-lg)' }}>
          <Alert severity="error" style={{ marginBottom: 'var(--spacing-md)' }}>
            {errorMessage}
          </Alert>
        </Box>
      )}

      <div className="dashboard-section">
        {/* Gross MEV */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Gross MEV
            </Typography>
            {grossMEV.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : grossMEV.isError ? (
              <Alert severity="error">{grossMEV.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={transformTimeSeriesData(grossMEV.data || [])}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                lines={[
                  { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                  { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                  { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Gross Atomic Arb */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Gross Atomic Arb
            </Typography>
            {grossAtomicArb.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : grossAtomicArb.isError ? (
              <Alert severity="error">{grossAtomicArb.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={transformTimeSeriesData(grossAtomicArb.data || [])}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                lines={[
                  { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                  { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                  { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Gross CexDexQuotes */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Gross CexDexQuotes
            </Typography>
            {grossCexDexQuotes.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : grossCexDexQuotes.isError ? (
              <Alert severity="error">{grossCexDexQuotes.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={transformTimeSeriesData(grossCexDexQuotes.data || [])}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                lines={[
                  { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                  { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                  { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Gross Liquidation */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Gross Liquidation
            </Typography>
            {grossLiquidation.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : grossLiquidation.isError ? (
              <Alert severity="error">{grossLiquidation.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={transformTimeSeriesData(grossLiquidation.data || [])}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                lines={[
                  { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                  { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                  { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Atomic MEV Timeboosted */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Atomic MEV Timeboosted
            </Typography>
            {atomicMEVTimeboosted.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : atomicMEVTimeboosted.isError ? (
              <Alert severity="error">{atomicMEVTimeboosted.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={transformAtomicMEVData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                lines={[
                  { dataKey: 'timeboost', name: 'Total Timeboosted', strokeColor: '#82ca9d' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Express Lane MEV Percentage */}
        <Card className="dashboard-box">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Express Lane MEV Percentage
            </Typography>
            {expressLaneMEVPercentage.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : expressLaneMEVPercentage.isError ? (
              <Alert severity="error">{expressLaneMEVPercentage.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <PieChart 
                  data={transformPieChartData}
                  innerRadius={40}
                  outerRadius={80}
                />
                {expressLaneMEVPercentage.data && (
                  <Typography variant="h6" style={{ marginTop: 'var(--spacing-md)' }}>
                    {expressLaneMEVPercentage.data.percentage.toFixed(2)}%
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
