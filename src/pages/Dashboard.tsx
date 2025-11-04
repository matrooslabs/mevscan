import './Dashboard.css'
import { useState, useMemo } from 'react'
import { Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, Box } from '@mui/material'
import TimeSeriesChart, { type TimeSeriesData } from '../components/TimeSeriesChart'
import PieChart, { type PieChartData } from '../components/PieChart'
import BarChart from '../components/BarChart'
import RadialBarChart from '../components/RadialBarChart'
import {
  useGrossMEV,
  useGrossAtomicArb,
  useGrossCexDexQuotes,
  useGrossLiquidation,
  useAtomicMEVTimeboosted,
  useExpressLaneMEVPercentage,
  useExpressLaneMEVPercentagePerMinute,
  useAtomicMEV,
  useCexDex,
  useCexDexTimeboosted,
  useLiquidation,
  useLiquidationTimeboosted,
  useExpressLaneNetProfit,
  useExpressLaneProfitByController,
  useTimeboostGrossRevenue,
  useTimeboostRevenue,
  usePeriodicApiRefreshByKeys,
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
  const expressLaneMEVPercentagePerMinute = useExpressLaneMEVPercentagePerMinute(timeRange)
  const atomicMEV = useAtomicMEV(timeRange)
  const cexDex = useCexDex(timeRange)
  const cexDexTimeboosted = useCexDexTimeboosted(timeRange)
  const liquidation = useLiquidation(timeRange)
  const liquidationTimeboosted = useLiquidationTimeboosted(timeRange)
  const expressLaneNetProfit = useExpressLaneNetProfit(timeRange)
  const expressLaneProfitByController = useExpressLaneProfitByController(timeRange)
  const timeboostGrossRevenue = useTimeboostGrossRevenue()
  const timeboostRevenue = useTimeboostRevenue(timeRange)

  // Periodic refresh - refresh all queries every 1 minute with staggered refreshes
  // Stagger refreshes by 200ms to avoid overwhelming the server
  usePeriodicApiRefreshByKeys(
    useMemo(
      () => [
        ['gross-mev', timeRange],
        ['gross-atomic-arb', timeRange],
        ['gross-cex-dex-quotes', timeRange],
        ['gross-liquidation', timeRange],
        ['atomic-mev-timeboosted', timeRange],
        ['express-lane-mev-percentage', timeRange],
        ['express-lane-mev-percentage-per-minute', timeRange],
        ['atomic-mev', timeRange],
        ['cexdex', timeRange],
        ['cexdex-timeboosted', timeRange],
        ['liquidation', timeRange],
        ['liquidation-timeboosted', timeRange],
        ['express-lane-net-profit', timeRange],
        ['express-lane-profit-by-controller', timeRange],
        ['timeboost-gross-revenue'],
        ['timeboost-revenue', timeRange],
      ],
      [timeRange]
    ),
    60000, // 1 minute
    true, // enabled by default
    200 // 200ms stagger between refreshes
  )

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

  // Transform Atomic MEV Timeboosted data - one line per protocol
  const { transformedAtomicMEVData, atomicMEVLineConfigs } = useMemo(() => {
    if (!atomicMEVTimeboosted.data || atomicMEVTimeboosted.data.length === 0) {
      return { transformedAtomicMEVData: [], atomicMEVLineConfigs: [] }
    }
    
    // Get unique protocols
    const protocols = Array.from(new Set(atomicMEVTimeboosted.data.map(item => item.proto))).sort()
    
    // Get unique times
    const times = Array.from(new Set(atomicMEVTimeboosted.data.map(item => item.time))).sort()
    
    // Create a map for quick lookup: time -> proto -> profit_usd
    const dataMap = new Map<string, Map<string, number>>()
    atomicMEVTimeboosted.data.forEach((item) => {
      if (!dataMap.has(item.time)) {
        dataMap.set(item.time, new Map())
      }
      dataMap.get(item.time)!.set(item.proto, item.profit_usd)
    })
    
    // Transform to chart format: one object per time point with a property for each protocol
    const transformedData = times.map(time => {
      const protoMap = dataMap.get(time) || new Map()
      const dataPoint: Record<string, string | number> = { time }
      
      protocols.forEach(proto => {
        // Use a safe property name (replace spaces/special chars with underscores)
        const safeProtoName = proto.replace(/[^a-zA-Z0-9]/g, '_')
        dataPoint[safeProtoName] = protoMap.get(proto) || 0
      })
      
      return dataPoint
    })
    
    // Generate distinct colors for each protocol
    const colorPalette = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
      '#00c49f', '#ffbb28', '#ff8042', '#8884d8', '#82ca9d',
      '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28'
    ]
    
    const lineConfigs = protocols.map((proto, index) => ({
      dataKey: proto.replace(/[^a-zA-Z0-9]/g, '_'),
      name: proto,
      strokeColor: colorPalette[index % colorPalette.length],
    }))
    
    return {
      transformedAtomicMEVData: transformedData,
      atomicMEVLineConfigs: lineConfigs,
    }
  }, [atomicMEVTimeboosted.data])

  // Helper function to transform protocol-based data
  const transformProtocolData = useMemo(() => {
    const colorPalette = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
      '#00c49f', '#ffbb28', '#ff8042', '#8884d8', '#82ca9d',
      '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28'
    ]
    
    return (data: typeof atomicMEV.data) => {
      if (!data || data.length === 0) {
        return { transformedData: [], lineConfigs: [] }
      }
      
      // Get unique protocols
      const protocols = Array.from(new Set(data.map(item => item.proto))).sort()
      
      // Get unique times
      const times = Array.from(new Set(data.map(item => item.time))).sort()
      
      // Create a map for quick lookup: time -> proto -> profit_usd
      const dataMap = new Map<string, Map<string, number>>()
      data.forEach((item) => {
        if (!dataMap.has(item.time)) {
          dataMap.set(item.time, new Map())
        }
        dataMap.get(item.time)!.set(item.proto, item.profit_usd)
      })
      
      // Transform to chart format: one object per time point with a property for each protocol
      const transformedData = times.map(time => {
        const protoMap = dataMap.get(time) || new Map()
        const dataPoint: Record<string, string | number> = { time }
        
        protocols.forEach(proto => {
          // Use a safe property name (replace spaces/special chars with underscores)
          const safeProtoName = proto.replace(/[^a-zA-Z0-9]/g, '_')
          dataPoint[safeProtoName] = protoMap.get(proto) || 0
        })
        
        return dataPoint
      })
      
      const lineConfigs = protocols.map((proto, index) => ({
        dataKey: proto.replace(/[^a-zA-Z0-9]/g, '_'),
        name: proto,
        strokeColor: colorPalette[index % colorPalette.length],
      }))
      
      return {
        transformedData,
        lineConfigs,
      }
    }
  }, [])

  // Transform protocol-based data for each visualization
  const atomicMEVTransformed = useMemo(() => transformProtocolData(atomicMEV.data), [atomicMEV.data, transformProtocolData])
  const cexDexTransformed = useMemo(() => transformProtocolData(cexDex.data), [cexDex.data, transformProtocolData])
  const cexDexTimeboostedTransformed = useMemo(() => transformProtocolData(cexDexTimeboosted.data), [cexDexTimeboosted.data, transformProtocolData])
  const liquidationTransformed = useMemo(() => transformProtocolData(liquidation.data), [liquidation.data, transformProtocolData])
  const liquidationTimeboostedTransformed = useMemo(() => transformProtocolData(liquidationTimeboosted.data), [liquidationTimeboosted.data, transformProtocolData])

  // Transform pie chart data
  const transformPieChartData = useMemo((): PieChartData[] => {
    if (!expressLaneMEVPercentage.data) return []
    
    const { total, timeboost } = expressLaneMEVPercentage.data
    const normal = Math.max(0, total - timeboost)
    const timeboostValue = Math.max(0, timeboost || 0)
    
    // If both values are 0 or total is 0, return empty to show "No data available"
    if (total === 0 || (normal === 0 && timeboostValue === 0)) {
      return []
    }
    
    return [
      {
        name: 'Normal',
        value: normal,
        color: '#ffc658',
      },
      {
        name: 'Timeboost',
        value: timeboostValue,
        color: '#82ca9d',
      },
    ]
  }, [expressLaneMEVPercentage.data])

  // Transform Express Lane MEV Percentage per minute data
  const transformPercentageTimeSeriesData = useMemo((): TimeSeriesData => {
    if (!expressLaneMEVPercentagePerMinute.data) return []
    return expressLaneMEVPercentagePerMinute.data.map((item) => ({
      time: item.time,
      total: item.percentage,
      normal: 0,
      timeboost: item.percentage,
    }))
  }, [expressLaneMEVPercentagePerMinute.data])

  // Transform Express Lane Net Profit data for X-Y chart (round vs net_profit)
  const transformExpressLaneNetProfitData = useMemo(() => {
    if (!expressLaneNetProfit.data || expressLaneNetProfit.data.length === 0) {
      return []
    }
    // Group by round and sum net_profit per round
    const roundMap = new Map<number, number>()
    expressLaneNetProfit.data.forEach((item) => {
      const current = roundMap.get(item.round) || 0
      roundMap.set(item.round, current + item.net_profit)
    })
    // Convert to array sorted by round
    return Array.from(roundMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, net_profit]) => ({
        round: round.toString(),
        net_profit,
      }))
  }, [expressLaneNetProfit.data])

  // Transform Express Lane Profit by Controller data for bar chart
  const transformExpressLaneProfitByControllerData = useMemo(() => {
    if (!expressLaneProfitByController.data || expressLaneProfitByController.data.length === 0) {
      return []
    }
    return expressLaneProfitByController.data
      .map((item) => ({
        name: item.controller || 'Unknown',
        value: item.net_profit_total || 0,
      }))
      .sort((a, b) => b.value - a.value) // Sort descending
  }, [expressLaneProfitByController.data])

  // Check if any query has error
  const hasError = 
    grossMEV.isError ||
    grossAtomicArb.isError ||
    grossCexDexQuotes.isError ||
    grossLiquidation.isError ||
    atomicMEVTimeboosted.isError ||
    expressLaneMEVPercentage.isError ||
    expressLaneMEVPercentagePerMinute.isError ||
    atomicMEV.isError ||
    cexDex.isError ||
    cexDexTimeboosted.isError ||
    liquidation.isError ||
    liquidationTimeboosted.isError ||
    expressLaneNetProfit.isError ||
    expressLaneProfitByController.isError ||
    timeboostGrossRevenue.isError ||
    timeboostRevenue.isError

  const errorMessage = 
    grossMEV.error?.message ||
    grossAtomicArb.error?.message ||
    grossCexDexQuotes.error?.message ||
    grossLiquidation.error?.message ||
    atomicMEVTimeboosted.error?.message ||
    expressLaneMEVPercentage.error?.message ||
    expressLaneMEVPercentagePerMinute.error?.message ||
    atomicMEV.error?.message ||
    cexDex.error?.message ||
    cexDexTimeboosted.error?.message ||
    liquidation.error?.message ||
    liquidationTimeboosted.error?.message ||
    expressLaneNetProfit.error?.message ||
    expressLaneProfitByController.error?.message ||
    timeboostGrossRevenue.error?.message ||
    timeboostRevenue.error?.message ||
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

      {/* Gross MEV Statistics Section */}
      <Box className="dashboard-section-group" sx={{ marginBottom: 'var(--spacing-xl)' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ 
            marginBottom: 'var(--spacing-2xl)',
            padding: 'var(--spacing-lg)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '2rem',
            letterSpacing: '-0.5px',
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '8px',
              left: 'var(--spacing-lg)',
              width: '80px',
              height: '4px',
              background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
              borderRadius: '2px',
            }
          }}
        >
          MEV
        </Typography>
        <Box className="dashboard-section">
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
                  hideZeroValues={true}
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
                  hideZeroValues={true}
                  lines={[
                    { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                    { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                    { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          {/* Gross CexDex */}
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
                Gross CexDex
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
                  hideZeroValues={true}
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
                  hideZeroValues={true}
                  lines={[
                    { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                    { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                    { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box className="dashboard-section">
        {/* Atomic Arb MEV */}
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
              Atomic Arb MEV
            </Typography>
            {atomicMEV.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : atomicMEV.isError ? (
              <Alert severity="error">{atomicMEV.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={atomicMEVTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={atomicMEVTransformed.lineConfigs}
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
                data={transformedAtomicMEVData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={atomicMEVLineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* CexDex Arb */}
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
              CexDex Arb
            </Typography>
            {cexDex.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : cexDex.isError ? (
              <Alert severity="error">{cexDex.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={cexDexTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={cexDexTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* CexDex MEV Timeboosted */}
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
              CexDex MEV Timeboosted
            </Typography>
            {cexDexTimeboosted.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : cexDexTimeboosted.isError ? (
              <Alert severity="error">{cexDexTimeboosted.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={cexDexTimeboostedTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={cexDexTimeboostedTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* Liquidation */}
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
              Liquidation
            </Typography>
            {liquidation.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : liquidation.isError ? (
              <Alert severity="error">{liquidation.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={liquidationTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={liquidationTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* Liquidation Timeboosted */}
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
              Liquidation Timeboosted
            </Typography>
            {liquidationTimeboosted.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : liquidationTimeboosted.isError ? (
              <Alert severity="error">{liquidationTimeboosted.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={liquidationTimeboostedTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={liquidationTimeboostedTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Express Lane Section */}
      <Box className="dashboard-section-group" sx={{ marginBottom: 'var(--spacing-xl)' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ 
            marginBottom: 'var(--spacing-2xl)',
            padding: 'var(--spacing-lg)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '2rem',
            letterSpacing: '-0.5px',
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '8px',
              left: 'var(--spacing-lg)',
              width: '80px',
              height: '4px',
              background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
              borderRadius: '2px',
            }
          }}
        >
          Express Lane
        </Typography>
        <Box className="dashboard-section">
        {/* Express Lane MEV Percentage */}
        <Card className="dashboard-box dashboard-box-half">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
              style={{ marginBottom: 'var(--spacing-lg)' }}
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
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', height: '100%', flex: 1 }}>
                <Box style={{ width: '100%', height: '250px', flex: 1 }}>
                  <PieChart 
                    data={transformPieChartData}
                    innerRadius={40}
                    outerRadius={80}
                    showLegend={true}
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Express Lane MEV Percentage Time Series */}
        <Card className="dashboard-box dashboard-box-half">
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
            {expressLaneMEVPercentagePerMinute.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : expressLaneMEVPercentagePerMinute.isError ? (
              <Alert severity="error">{expressLaneMEVPercentagePerMinute.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={transformPercentageTimeSeriesData}
                xAxisKey="time"
                yAxisLabel="Percentage (%)"
                showArea={true}
                hideZeroValues={true}
                lines={[
                  { dataKey: 'total', name: 'Percentage', strokeColor: '#82ca9d' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Express Lane Net Profit */}
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
              Express Lane Net Profit
            </Typography>
            {expressLaneNetProfit.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : expressLaneNetProfit.isError ? (
              <Alert severity="error">{expressLaneNetProfit.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={transformExpressLaneNetProfitData.map(item => ({
                  time: item.round,
                  total: item.net_profit,
                  normal: 0,
                  timeboost: item.net_profit,
                }))}
                xAxisKey="time"
                yAxisLabel="Net Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={[
                  { dataKey: 'total', name: 'Net Profit', strokeColor: '#82ca9d' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Express Lane Profit by Controller */}
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
              Express Lane Profit by Controller
            </Typography>
            {expressLaneProfitByController.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : expressLaneProfitByController.isError ? (
              <Alert severity="error">{expressLaneProfitByController.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <BarChart 
                data={transformExpressLaneProfitByControllerData}
                xAxisKey="name"
                yAxisLabel="Net Profit (USD)"
                showGrid={true}
                showLegend={false}
                showTooltip={true}
                barColor="#82ca9d"
              />
            )}
          </CardContent>
        </Card>
      </Box>
      </Box>

      {/* Timeboost Section */}
      <Box className="dashboard-section-group" sx={{ marginBottom: 'var(--spacing-xl)' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ 
            marginBottom: 'var(--spacing-2xl)',
            padding: 'var(--spacing-lg)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '2rem',
            letterSpacing: '-0.5px',
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '8px',
              left: 'var(--spacing-lg)',
              width: '80px',
              height: '4px',
              background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
              borderRadius: '2px',
            }
          }}
        >
          Timeboost
        </Typography>
        <Box className="dashboard-section">
        {/* Timeboost Gross Revenue */}
        <Card className="dashboard-box dashboard-box-half">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
              style={{ marginBottom: 'var(--spacing-lg)' }}
            >
              Timeboost Gross Revenue (All-Time)
            </Typography>
            {timeboostGrossRevenue.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : timeboostGrossRevenue.isError ? (
              <Alert severity="error">{timeboostGrossRevenue.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', height: '100%', flex: 1 }}>
                <Box style={{ width: '100%', height: '250px', flex: 1 }}>
                  <RadialBarChart 
                    data={timeboostGrossRevenue.data || { total_first_price: 0, total_second_price: 0 }}
                    showLegend={true}
                    showTooltip={true}
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Timeboost Revenue (Time-Ranged) */}
        <Card className="dashboard-box dashboard-box-half">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
              style={{ marginBottom: 'var(--spacing-lg)' }}
            >
              Timeboost Revenue
            </Typography>
            {timeboostRevenue.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : timeboostRevenue.isError ? (
              <Alert severity="error">{timeboostRevenue.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', height: '100%', flex: 1 }}>
                <Box style={{ width: '100%', height: '250px', flex: 1 }}>
                  <RadialBarChart 
                    data={timeboostRevenue.data || { total_first_price: 0, total_second_price: 0 }}
                    showLegend={true}
                    showTooltip={true}
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
      </Box>
    </div>
  )
}

export default Dashboard

