import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { PieChart as EPieChart } from 'echarts/charts';
import { LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption, SeriesOption } from 'echarts';
import { chartTheme } from '../theme';

echarts.use([EPieChart, LegendComponent, TooltipComponent, CanvasRenderer]);

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  showLegend?: boolean;
  showTooltip?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

/**
 * PieChart - A reusable pie chart component using ECharts
 */
function PieChart({
  data,
  showLegend = true,
  showTooltip = true,
  innerRadius = 0,
  outerRadius = 80,
}: PieChartProps) {
  const series = useMemo<SeriesOption[]>(
    () => [
      {
        type: 'pie',
        radius: [innerRadius, outerRadius],
        data:
          data?.map((d) => ({
            value: d.value,
            name: d.name,
            itemStyle: { color: d.color },
          })) || [],
        label: {
          formatter: ({ name, percent }) => {
            const pct = typeof percent === 'number' ? percent : 0;
            return `${name}: ${pct.toFixed(1)}%`;
          },
          color: chartTheme.text.legend,
          fontSize: chartTheme.fontSize.legend,
        },
        animationDuration: 300,
        animationEasing: 'quadraticOut',
      },
    ],
    [data, innerRadius, outerRadius]
  );

  const option = useMemo<EChartsOption>(
    () => ({
      animation: true,
      tooltip: showTooltip ? { trigger: 'item', confine: true } : undefined,
      legend: showLegend
        ? {
            bottom: 0,
            textStyle: {
              color: chartTheme.text.legend,
              fontSize: chartTheme.fontSize.legend,
            },
          }
        : { show: false },
      series,
    }),
    [series, showLegend, showTooltip]
  );

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="chart-container" style={{ width: '100%', height: '100%' }}>
      <ReactECharts option={option} notMerge lazyUpdate />
    </div>
  );
}

export default React.memo(PieChart);
