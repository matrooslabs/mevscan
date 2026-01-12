import { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import TimeSeriesChart, {
  type TimeSeriesData,
} from "../../components/TimeSeriesChart";
import BarChart from "../../components/BarChart";
import {
  useExpressLaneMEVPercentagePerMinute,
  useExpressLaneNetProfit,
  useExpressLaneProfitByController,
  usePeriodicApiRefreshByKeys,
} from "../../hooks/useApi";
import ChartCard from "../../components/ChartCard";
import { chartColors } from "../../theme";
import "./SectionCommon.css";
import type {
  ExpressLaneMEVPercentagePerMinute,
  ExpressLaneNetProfitEntry,
  ExpressLaneProfitByControllerEntry,
} from "../../types/api";

function ExpressLaneSection({ id }: { id?: string }) {
  const expressLaneMEVPercentagePerMinute =
    useExpressLaneMEVPercentagePerMinute();
  const expressLaneNetProfit = useExpressLaneNetProfit();
  const expressLaneProfitByController = useExpressLaneProfitByController();

  usePeriodicApiRefreshByKeys(
    [
      ["express-lane-mev-percentage"],
      ["express-lane-mev-percentage-per-minute"],
      ["express-lane-net-profit"],
      ["express-lane-profit-by-controller"],
    ],
    60000,
    true,
    200
  );

  // Transform Express Lane MEV Percentage per minute data
  const transformPercentageTimeSeriesData = useMemo<TimeSeriesData>(() => {
    const percentageData = expressLaneMEVPercentagePerMinute.data as
      | ExpressLaneMEVPercentagePerMinute[]
      | undefined;
    if (!percentageData) return [];
    return percentageData.map((item) => ({
      time: item.time,
      total: item.percentage,
      normal: 0,
      timeboost: item.percentage,
    }));
  }, [expressLaneMEVPercentagePerMinute.data]);

  // Transform Express Lane Net Profit data
  const transformExpressLaneNetProfitData = useMemo(() => {
    const netProfitData = expressLaneNetProfit.data as
      | ExpressLaneNetProfitEntry[]
      | undefined;
    if (!netProfitData || netProfitData.length === 0) {
      return [];
    }
    const roundMap = new Map<number, number>();
    netProfitData.forEach((item) => {
      const current = roundMap.get(item.round) || 0;
      roundMap.set(item.round, current + item.net_profit);
    });
    return Array.from(roundMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, net_profit]) => ({
        round: round.toString(),
        net_profit,
      }));
  }, [expressLaneNetProfit.data]);

  // Transform Express Lane Profit by Controller data
  const transformExpressLaneProfitByControllerData = useMemo(() => {
    const profitByControllerData = expressLaneProfitByController.data as
      | ExpressLaneProfitByControllerEntry[]
      | undefined;
    if (!profitByControllerData || profitByControllerData.length === 0) {
      return [];
    }
    return profitByControllerData
      .map((item) => ({
        name: item.controller || "Unknown",
        value: item.net_profit_total || 0,
      }))
      .sort(
        (
          a: { name: string; value: number },
          b: { name: string; value: number }
        ) => b.value - a.value
      );
  }, [expressLaneProfitByController.data]);

  return (
    <Box id={id} className="section-container">
      <Box className="section-header">
        <Typography variant="h4" component="h2" className="section-title">
          Express Lane
        </Typography>
      </Box>
      <Box className="section-content">
        {/* Top Row - 2 charts */}
        <Box className="chart-grid chart-grid-dense" sx={{ marginBottom: '16px' }}>
          <ChartCard
            title="MEV Percentage"
            isLoading={expressLaneMEVPercentagePerMinute.isLoading}
            isError={expressLaneMEVPercentagePerMinute.isError}
            errorMessage={expressLaneMEVPercentagePerMinute.error?.message}
            className="chart-card-half"
            variant="compact"
            accentColor={chartColors.timeboost}
          >
            <TimeSeriesChart
              data={transformPercentageTimeSeriesData}
              xAxisKey="time"
              yAxisLabel="Percentage (%)"
              showArea={true}
              hideZeroValues={true}
              lines={[
                {
                  dataKey: "total",
                  name: "Percentage",
                  strokeColor: chartColors.timeboost,
                },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Net Profit by Round"
            isLoading={expressLaneNetProfit.isLoading}
            isError={expressLaneNetProfit.isError}
            errorMessage={expressLaneNetProfit.error?.message}
            className="chart-card-half"
            variant="compact"
            accentColor={chartColors.atomic}
          >
            <TimeSeriesChart
              data={transformExpressLaneNetProfitData.map((item) => ({
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
                {
                  dataKey: "total",
                  name: "Net Profit",
                  strokeColor: chartColors.atomic,
                },
              ]}
            />
          </ChartCard>
        </Box>

        {/* Bottom Row - Full width */}
        <Box className="chart-grid">
          <ChartCard
            title="Profit by Controller"
            isLoading={expressLaneProfitByController.isLoading}
            isError={expressLaneProfitByController.isError}
            errorMessage={expressLaneProfitByController.error?.message}
            className="chart-card-full"
            variant="compact"
            accentColor={chartColors.cexdex}
          >
            <BarChart
              data={transformExpressLaneProfitByControllerData}
              xAxisKey="name"
              yAxisLabel="Net Profit (USD)"
              showGrid={true}
              showLegend={false}
              showTooltip={true}
              barColor={chartColors.cexdex}
            />
          </ChartCard>
        </Box>
      </Box>
    </Box>
  );
}

export default ExpressLaneSection;
