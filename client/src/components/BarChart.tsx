import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { BarChart as EBarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption, SeriesOption } from 'echarts'

echarts.use([EBarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export interface BarChartData {
  name: string
  value: number
}

interface BarChartProps {
  data: BarChartData[]
  xAxisKey?: string
  yAxisLabel?: string
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  barColor?: string
}

const FONT_SIZE_MEDIUM = 12

/**
 * BarChart - A reusable vertical bar chart component using ECharts
 */
function BarChart({
  data,
  xAxisKey = 'name',
  yAxisLabel,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  barColor = '#8884d8',
}: BarChartProps) {
  const labels = useMemo(() => (data ?? []).map((d) => d[xAxisKey as keyof BarChartData] as string), [data, xAxisKey])
  const seriesData = useMemo(() => (data ?? []).map((d) => d.value ?? null), [data])

  const series = useMemo<SeriesOption[]>(
    () => [
      {
        type: 'bar',
        data: seriesData,
        itemStyle: { color: barColor },
        barMaxWidth: 48,
        animationDuration: 300,
        animationEasing: 'quadraticOut',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
    [seriesData, barColor]
  )

  const option = useMemo<EChartsOption>(
    () => ({
      animation: true,
      tooltip: showTooltip ? { trigger: 'axis', axisPointer: { type: 'shadow' }, confine: true } : undefined,
      legend: showLegend ? { bottom: 0 } : { show: false },
      grid: { top: 16, left: 48, right: 16, bottom: showLegend ? 48 : 24, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: FONT_SIZE_MEDIUM },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        name: yAxisLabel,
        nameGap: 30,
        axisLabel: { fontSize: FONT_SIZE_MEDIUM },
        splitLine: { show: showGrid },
      },
      series,
    }),
    [labels, series, showLegend, showTooltip, yAxisLabel, showGrid]
  )

  if (!data || data.length === 0) {
    return <div>No data available</div>
  }

  return (
    <div className="chart-container" style={{ width: '100%', height: '100%' }}>
      <ReactECharts option={option} notMerge lazyUpdate />
    </div>
  )
}

export default React.memo(BarChart)

