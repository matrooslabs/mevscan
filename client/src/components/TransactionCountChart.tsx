import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { chartColors } from "../theme";

/**
 * Data point for lane comparison time series
 */
export interface LaneTimeSeriesDataPoint {
  time: string;
  normalLane: number;
  expressLane: number;
}

export interface TransactionCountChartProps {
  data?: LaneTimeSeriesDataPoint[];
}

// Generate mock data for demonstration
function generateMockData(): LaneTimeSeriesDataPoint[] {
  const now = new Date();
  const data: LaneTimeSeriesDataPoint[] = [];

  for (let i = 14; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 1000);
    const timeStr = time.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    data.push({
      time: timeStr,
      normalLane: Math.floor(Math.random() * 150) + 50,
      expressLane: Math.floor(Math.random() * 80) + 10,
    });
  }

  return data;
}

function TransactionCountChart({ data }: TransactionCountChartProps) {
  const chartData = useMemo(() => data ?? generateMockData(), [data]);

  const chartOptions = useMemo<EChartsOption>(() => {
    const times = chartData.map((d) => d.time);
    const normalLaneData = chartData.map((d) => d.normalLane);
    const expressLaneData = chartData.map((d) => d.expressLane);

    return {
      animation: true,
      tooltip: {
        trigger: "axis",
        confine: true,
        formatter: (params: unknown) => {
          const items = params as Array<{
            name: string;
            value: number;
            seriesName: string;
            color: string;
          }>;
          if (!items || items.length === 0) return "";
          const time = items[0].name;
          const lines = items.map((item) => {
            const colorDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px;"></span>`;
            return `${colorDot}${item.seriesName}: ${item.value.toLocaleString()} txs`;
          });
          return `<strong>${time}</strong><br/>${lines.join("<br/>")}`;
        },
      },
      legend: {
        show: true,
        bottom: 0,
        data: ["Normal Lane", "Express Lane"],
      },
      grid: {
        top: 24,
        left: 60,
        right: 24,
        bottom: 48,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: times,
        boundaryGap: false,
        axisLabel: { fontSize: 11 },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: "value",
        name: "Transactions",
        nameLocation: "middle",
        nameGap: 45,
        axisLabel: {
          fontSize: 11,
          formatter: (value: number) => value.toFixed(0),
        },
        splitLine: { show: true, lineStyle: { type: "dashed", opacity: 0.3 } },
      },
      series: [
        {
          name: "Normal Lane",
          type: "line",
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
          name: "Express Lane",
          type: "line",
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
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export default TransactionCountChart;

