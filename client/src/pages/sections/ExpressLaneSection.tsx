import { useMemo } from 'react'
import { Typography, Box } from '@mui/material'
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
import ChartCard from '../../components/ChartCard'
import './ExpressLaneSection.css'
import type {
  ExpressLaneMEVPercentage,
  ExpressLaneMEVPercentagePerMinute,
  ExpressLaneNetProfitEntry,
  ExpressLaneProfitByControllerEntry,
} from '../../types/api'

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
    const mevData = expressLaneMEVPercentage.data as ExpressLaneMEVPercentage | undefined
    if (!mevData) return []
    
    const { total, timeboost } = mevData
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
  const transformPercentageTimeSeriesData = useMemo<TimeSeriesData>(() => {
    const percentageData = expressLaneMEVPercentagePerMinute.data as
      | ExpressLaneMEVPercentagePerMinute[]
      | undefined
    if (!percentageData) return []
    return percentageData.map((item) => ({
      time: item.time,
      total: item.percentage,
      normal: 0,
      timeboost: item.percentage,
    }))
  }, [expressLaneMEVPercentagePerMinute.data])

  // Transform Express Lane Net Profit data
  const transformExpressLaneNetProfitData = useMemo(() => {
    const netProfitData = expressLaneNetProfit.data as ExpressLaneNetProfitEntry[] | undefined
    if (!netProfitData || netProfitData.length === 0) {
      return []
    }
    const roundMap = new Map<number, number>()
    netProfitData.forEach((item) => {
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
    const profitByControllerData = expressLaneProfitByController.data as
      | ExpressLaneProfitByControllerEntry[]
      | undefined
    if (!profitByControllerData || profitByControllerData.length === 0) {
      return []
    }
    return profitByControllerData
      .map((item) => ({
        name: item.controller || 'Unknown',
        value: item.net_profit_total || 0,
      }))
      .sort((a: { name: string; value: number }, b: { name: string; value: number }) => b.value - a.value)
  }, [expressLaneProfitByController.data])

  return (
    <Box className="dashboard-section-group express-section-spacing">
      <Typography 
        variant="h4" 
        component="h2" 
        className="express-section-title"
      >
        Express Lane
      </Typography>
      <Box className="dashboard-section">
        {/* Express Lane MEV Percentage */}
        <ChartCard
          title="Express Lane MEV Percentage"
          isLoading={expressLaneMEVPercentage.isLoading}
          isError={expressLaneMEVPercentage.isError}
          errorMessage={expressLaneMEVPercentage.error?.message}
          className="chart-card-half"
          contentClassName="express-chart-card-flex"
        >
          <Box className="express-chart-card-inner">
            <Box className="express-chart-card-pie">
              <PieChart 
                data={transformPieChartData}
                innerRadius={40}
                outerRadius={80}
                showLegend={true}
              />
            </Box>
          </Box>
        </ChartCard>

        {/* Express Lane MEV Percentage Time Series */}
        <ChartCard
          title="Express Lane MEV Percentage"
          isLoading={expressLaneMEVPercentagePerMinute.isLoading}
          isError={expressLaneMEVPercentagePerMinute.isError}
          errorMessage={expressLaneMEVPercentagePerMinute.error?.message}
          className="chart-card-half"
          contentClassName="express-chart-card-flex"
        >
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
        </ChartCard>

        {/* Express Lane Net Profit */}
        <ChartCard
          title="Express Lane Net Profit"
          isLoading={expressLaneNetProfit.isLoading}
          isError={expressLaneNetProfit.isError}
          errorMessage={expressLaneNetProfit.error?.message}
          className="chart-card-full"
          contentClassName="express-chart-card-flex"
        >
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
        </ChartCard>

        {/* Express Lane Profit by Controller */}
        <ChartCard
          title="Express Lane Profit by Controller"
          isLoading={expressLaneProfitByController.isLoading}
          isError={expressLaneProfitByController.isError}
          errorMessage={expressLaneProfitByController.error?.message}
          className="chart-card-full"
          contentClassName="express-chart-card-flex"
        >
          <BarChart 
            data={transformExpressLaneProfitByControllerData}
            xAxisKey="name"
            yAxisLabel="Net Profit (USD)"
            showGrid={true}
            showLegend={false}
            showTooltip={true}
            barColor="#82ca9d"
          />
        </ChartCard>
      </Box>
    </Box>
  )
}

export default ExpressLaneSection

