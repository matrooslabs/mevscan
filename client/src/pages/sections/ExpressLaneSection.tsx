import { useMemo } from 'react'
import { Card, CardContent, Typography, CircularProgress, Alert, Box } from '@mui/material'
import TimeSeriesChart, { type TimeSeriesData } from '../../components/TimeSeriesChart'
import PieChart, { type PieChartData } from '../../components/PieChart'
import BarChart from '../../components/BarChart'
import {
  useExpressLaneMEVPercentage,
  useExpressLaneMEVPercentagePerMinute,
  useExpressLaneNetProfit,
  useExpressLaneProfitByController,
  usePeriodicApiRefreshByKeys,
} from '../../hooks/useApi'

interface ExpressLaneSectionProps {
  timeRange?: string
}

function ExpressLaneSection({ timeRange = '1hour' }: ExpressLaneSectionProps) {
  const expressLaneMEVPercentage = useExpressLaneMEVPercentage(timeRange)
  const expressLaneMEVPercentagePerMinute = useExpressLaneMEVPercentagePerMinute(timeRange)
  const expressLaneNetProfit = useExpressLaneNetProfit(timeRange)
  const expressLaneProfitByController = useExpressLaneProfitByController(timeRange)

  usePeriodicApiRefreshByKeys(
    [
      ['express-lane-mev-percentage', timeRange],
      ['express-lane-mev-percentage-per-minute', timeRange],
      ['express-lane-net-profit', timeRange],
      ['express-lane-profit-by-controller', timeRange],
    ],
    60000,
    true,
    200
  )
  // Transform pie chart data
  const transformPieChartData = useMemo((): PieChartData[] => {
    if (!expressLaneMEVPercentage.data) return []
    
    const { total, timeboost } = expressLaneMEVPercentage.data
    const normal = Math.max(0, total - timeboost)
    const timeboostValue = Math.max(0, timeboost || 0)
    
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
    return expressLaneMEVPercentagePerMinute.data.map((item: any) => ({
      time: item.time,
      total: item.percentage,
      normal: 0,
      timeboost: item.percentage,
    }))
  }, [expressLaneMEVPercentagePerMinute.data])

  // Transform Express Lane Net Profit data
  const transformExpressLaneNetProfitData = useMemo(() => {
    if (!expressLaneNetProfit.data || expressLaneNetProfit.data.length === 0) {
      return []
    }
    const roundMap = new Map<number, number>()
    expressLaneNetProfit.data.forEach((item: any) => {
      const current = roundMap.get(item.round) || 0
      roundMap.set(item.round, current + item.net_profit)
    })
    return Array.from(roundMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, net_profit]) => ({
        round: round.toString(),
        net_profit,
      }))
  }, [expressLaneNetProfit.data])

  // Transform Express Lane Profit by Controller data
  const transformExpressLaneProfitByControllerData = useMemo(() => {
    if (!expressLaneProfitByController.data || expressLaneProfitByController.data.length === 0) {
      return []
    }
    return expressLaneProfitByController.data
      .map((item: any) => ({
        name: item.controller || 'Unknown',
        value: item.net_profit_total || 0,
      }))
      .sort((a: { name: string; value: number }, b: { name: string; value: number }) => b.value - a.value)
  }, [expressLaneProfitByController.data])

  return (
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
            <Typography variant="h5" component="h2" className="chard-card-title">
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
            <Typography variant="h5" component="h2" className="chard-card-title">
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
            <Typography variant="h5" component="h2" className="chard-card-title">
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
  )
}

export default ExpressLaneSection

