import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { chartColors, chartTheme } from '../theme';

/**
 * Data point for lane comparison time series
 */
export interface LaneTimeSeriesDataPoint {
  time: string;
  normalLane: number;
  expressLane: number;
}

export interface GasUsageChartProps {
  data?: LaneTimeSeriesDataPoint[];
}

// Generate mock data for demonstration
function generateMockData(): LaneTimeSeriesDataPoint[] {
  const now = new Date();
  const data: LaneTimeSeriesDataPoint[] = [];

  for (let i = 14; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 1000);
    const timeStr = time.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    data.push({
      time: timeStr,
      normalLane: Math.floor(Math.random() * 500000) + 100000,
      expressLane: Math.floor(Math.random() * 300000) + 50000,
    });
  }

  return data;
}

function GasUsageChart({ data }: GasUsageChartProps) {
  const chartData = useMemo(() => data ?? generateMockData(), [data]);

  const chartOptions = useMemo<EChartsOption>(() => {
    const times = chartData.map((d) => d.time);
    const normalLaneData = chartData.map((d) => d.normalLane);
    const expressLaneData = chartData.map((d) => d.expressLane);

    return {
      animation: true,
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: unknown) => {
          const items = params as Array<{
            name: string;
            value: number;
            seriesName: string;
            color: string;
          }>;
          if (!items || items.length === 0) return '';
          const time = items[0].name;
          const lines = items.map((item) => {
            const colorDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px;"></span>`;
            return `${colorDot}${item.seriesName}: ${item.value.toLocaleString()} gas`;
          });
          return `<strong>${time}</strong><br/>${lines.join('<br/>')}`;
        },
      },
      legend: {
        show: true,
        bottom: 0,
        data: ['Normal Lane', 'Express Lane'],
        textStyle: {
          color: chartTheme.text.legend,
          fontSize: chartTheme.fontSize.legend,
        },
      },
      grid: {
        top: 24,
        left: 60,
        right: 24,
        bottom: 48,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLabel: {
          fontSize: chartTheme.fontSize.axisLabel,
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
        name: 'Gas Used',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: {
          color: chartTheme.text.axisName,
        },
        axisLabel: {
          fontSize: chartTheme.fontSize.axisLabel,
          color: chartTheme.text.axisLabel,
          formatter: (value: number) => `${(value / 1000).toFixed(0)}k`,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: chartTheme.line.grid,
          },
        },
        axisLine: {
          lineStyle: {
            color: chartTheme.line.axis,
          },
        },
      },
      series: [
        {
          name: 'Normal Lane',
          type: 'line',
          data: normalLaneData,
          smooth: 0.2,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: chartColors.normal,
          },
          itemStyle: { color: chartColors.normal },
          areaStyle: {
            opacity: 0.15,
            color: chartColors.normal,
          },
        },
        {
          name: 'Express Lane',
          type: 'line',
          data: expressLaneData,
          smooth: 0.2,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: chartColors.timeboost,
          },
          itemStyle: { color: chartColors.timeboost },
          areaStyle: {
            opacity: 0.15,
            color: chartColors.timeboost,
          },
        },
      ],
    };
  }, [chartData]);

  return (
    <ReactECharts
      option={chartOptions}
      notMerge
      lazyUpdate
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default GasUsageChart;
