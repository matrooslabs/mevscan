import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption, SeriesOption } from 'echarts'
import { chartTheme } from '../theme'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
])

/**
 * Time series data point for chart visualization
 */
export interface TimeSeriesDataPoint {
  time: string;
  total: number;
  normal: number;
  timeboost: number;
}

/**
 * Array of time series data points
 */
export type TimeSeriesData = TimeSeriesDataPoint[];

export interface LineConfig {
  dataKey: string;
  name: string;
  strokeColor: string;
  strokeWidth?: number;
  showDots?: boolean;
}

export interface TimeSeriesChartProps {
  data?: TimeSeriesData | Record<string, string | number | null | undefined>[];
  dataKey?: string;
  xAxisKey?: string;
  name?: string;
  strokeColor?: string;
  lines?: LineConfig[];
  showGrid?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  showDots?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showArea?: boolean;
  fillOpacity?: number;
  hideZeroValues?: boolean;
}

const DEFAULT_STROKE_COLOR = '#8884d8';
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_FILL_OPACITY = 0.3;
const DEFAULT_POINT_RADIUS = 3;

function createLineConfigs(
  lines?: LineConfig[],
  dataKey?: string,
  name?: string,
  strokeColor?: string,
  strokeWidth?: number,
  showDots?: boolean
): LineConfig[] {
  if (lines) {
    return lines;
  }

  if (dataKey) {
    return [
      {
        dataKey,
        name: name || 'Value',
        strokeColor: strokeColor || DEFAULT_STROKE_COLOR,
        strokeWidth,
        showDots,
      },
    ];
  }

  return [];
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function TimeSeriesChart({
  data = [],
  dataKey,
  xAxisKey = 'time',
  name,
  strokeColor,
  lines,
  showGrid = false,
  showLegend = true,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  showDots = true,
  xAxisLabel,
  yAxisLabel,
  showArea = true,
  fillOpacity = DEFAULT_FILL_OPACITY,
  hideZeroValues = false,
}: TimeSeriesChartProps) {
  const lineConfigs = useMemo(
    () =>
      createLineConfigs(
        lines,
        dataKey,
        name,
        strokeColor,
        strokeWidth,
        showDots
      ),
    [lines, dataKey, name, strokeColor, strokeWidth, showDots]
  );

  const labels = useMemo(
    () =>
      data.map((point) => {
        const value = (point as Record<string, unknown>)[xAxisKey];
        return value !== undefined && value !== null ? String(value) : '';
      }),
    [data, xAxisKey]
  );

  const series = useMemo<SeriesOption[]>(
    () =>
      lineConfigs.map((config) => {
        const color = config.strokeColor || DEFAULT_STROKE_COLOR;
        const shouldShowDots =
          config.showDots !== undefined ? config.showDots : showDots;
        const series = data.map((point) => {
          const raw = (point as Record<string, unknown>)[config.dataKey];
          const num = normalizeNumber(raw);
          if (num === null) return null;
          if (hideZeroValues && num === 0) return null;
          return num;
        });

        return {
          name: config.name,
          type: 'line' as const,
          data: series,
          smooth: 0.25,
          connectNulls: true,
          showSymbol: shouldShowDots,
          symbolSize: DEFAULT_POINT_RADIUS * 2,
          sampling: 'lttb',
          lineStyle: {
            width: config.strokeWidth ?? strokeWidth ?? DEFAULT_STROKE_WIDTH,
            color,
          },
          itemStyle: { color },
          areaStyle: showArea
            ? { opacity: fillOpacity ?? DEFAULT_FILL_OPACITY, color }
            : undefined,
          emphasis: { focus: 'series' },
          // Keep render lean for many charts
          animationDuration: 300,
          animationEasing: 'quadraticOut' as const,
          progressive: 2000,
          progressiveThreshold: 3000,
        };
      }),
    [
      lineConfigs,
      data,
      showDots,
      showArea,
      fillOpacity,
      hideZeroValues,
      strokeWidth,
    ]
  );

  const options = useMemo<EChartsOption>(() => {
    // Calculate bottom spacing based on number of legend items
    // More items = more likely to wrap = need more space
    const numLegendItems = lineConfigs.length;
    const legendBottomSpace = showLegend
      ? (numLegendItems > 5 ? 90 : numLegendItems > 3 ? 70 : 48)
      : 24;

    return {
      animation: true,
      tooltip: { trigger: 'axis', confine: true },
      legend: {
        show: showLegend,
        bottom: 0,
        type: 'plain',
        orient: 'horizontal',
        textStyle: {
          color: chartTheme.text.legend,
          fontSize: chartTheme.fontSize.legend,
        },
      },
      grid: {
        top: 16,
        left: 48,
        right: 16,
        bottom: legendBottomSpace,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        name: xAxisLabel,
        nameLocation: 'end',
        nameGap: 20,
        axisLabel: {
          fontSize: chartTheme.fontSize.axisLabelMedium,
          color: chartTheme.text.axisLabel,
        },
        axisTick: { alignWithLabel: true },
        axisLine: {
          lineStyle: {
            color: chartTheme.line.axis,
          },
        },
      },
      yAxis: {
        type: 'value',
        name: yAxisLabel,
        nameGap: 30,
        nameTextStyle: {
          color: chartTheme.text.axisName,
        },
        axisLabel: {
          fontSize: chartTheme.fontSize.axisLabelMedium,
          color: chartTheme.text.axisLabel,
        },
        splitLine: {
          show: showGrid,
          lineStyle: {
            color: chartTheme.line.grid,
          },
        },
        axisLine: {
          lineStyle: {
            color: chartTheme.line.axis,
          },
        },
      },
      series,
    };
  }, [series, labels, showLegend, xAxisLabel, yAxisLabel, showGrid, lineConfigs.length]);

  return (
    <div className="chart-container">
      <ReactECharts option={options} notMerge lazyUpdate/>
    </div>
  );
}

export default React.memo(TimeSeriesChart)

