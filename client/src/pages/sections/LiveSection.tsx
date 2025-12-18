import { useMemo } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Grid,
} from "@mui/material";

import { ChannelProvider } from "ably/react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import NumberFlow from "@number-flow/react";
import { chartColorPalette } from "../../theme";
import { useExpressLaneTransactions } from "../../hooks/useExpressLaneTransactions";
import { ABLY_CHANNELS } from "../../constants/ably";
import MEVTransactionTable from "../../components/MEVTransactionTable";
import GasUsageChart from "../../components/GasUsageChart";
import TransactionCountChart from "../../components/TransactionCountChart";
import TradeVolumeChart from "../../components/TradeVolumeChart";
import "./SectionCommon.css";
import "./LiveSection.css";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
}

function StatCard({ title, value, prefix, suffix }: StatCardProps) {
  return (
    <Card className="live-section-stat-card">
      <CardContent className="live-section-stat-card-content">
        <Typography variant="caption" className="live-section-stat-label">
          {title}
        </Typography>
        <Typography
          variant="h5"
          component="div"
          className="live-section-stat-value"
        >
          <NumberFlow value={value} prefix={prefix} suffix={suffix} />
        </Typography>
      </CardContent>
    </Card>
  );
}

function LiveSectionContent({ id }: { id?: string }) {
  const {
    transactions,
    roundInfo,
    profitByType,
    cumulativeProfit,
    isConnected,
  } = useExpressLaneTransactions();

  const timeboostedTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.timeboosted);
  }, [transactions]);

  // Express lane price for the BEP line
  const bepPriceUSD = roundInfo.expressLanePriceUsd || 0;

  // Helper to format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Compute cumulative profit data for the chart
  const profitData = useMemo(() => {
    if (profitByType.length === 0) return [];

    return profitByType.map((entry, index) => {
      const cumulative = profitByType
        .slice(0, index + 1)
        .reduce(
          (sum, item) => sum + item.Atomic + item.CexDex + item.Liquidation,
          0
        );
      return {
        time: formatTimestamp(entry.timestamp),
        profit: cumulative,
      };
    });
  }, [profitByType]);

  // Chart options for Profit vs Time with BEP line and stacked bars
  const chartOptions = useMemo<EChartsOption>(() => {
    const times = profitData.map((d) => d.time);
    const profits = profitData.map((d) => d.profit);

    // Extract profit data by MEV type for stacked bars
    const mevTypes: Array<"Atomic" | "CexDex" | "Liquidation"> = [
      "Atomic",
      "CexDex",
      "Liquidation",
    ];
    const mevTypeColors: Record<string, string> = {
      Atomic: chartColorPalette[0],
      CexDex: chartColorPalette[1],
      Liquidation: chartColorPalette[2],
    };

    // Transform bar data to be cumulative for each type
    const barDataByType = mevTypes.map((type) => {
      let cumulative = 0;
      const cumulativeData = profitByType.map((d) => {
        cumulative += d[type];
        return cumulative;
      });
      return {
        name: type,
        data: cumulativeData,
        color: mevTypeColors[type],
      };
    });

    return {
      animation: true,
      tooltip: {
        trigger: "axis",
        confine: true,
        formatter: (params: unknown) => {
          const data = params as Array<{
            name: string;
            value: number;
            seriesName: string;
            color: string;
            seriesType?: string;
          }>;
          if (!data || data.length === 0) return "";
          const time = data[0].name;
          const lines = data.map((item) => {
            const colorDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px;"></span>`;
            return `${colorDot}${item.seriesName}: $${item.value.toFixed(2)}`;
          });
          return `<strong>${time}</strong><br/>${lines.join("<br/>")}`;
        },
      },
      legend: {
        show: true,
        bottom: 0,
        data: [...mevTypes, "Cumulative Profit", "Express Lane Price"],
      },
      grid: {
        top: 24,
        left: 60,
        right: 24,
        bottom: 56,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: times,
        boundaryGap: true,
        name: "Time",
        nameLocation: "middle",
        nameGap: 20,
        axisLabel: { fontSize: 11 },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: "value",
        name: "Profit (USD)",
        nameLocation: "middle",
        nameGap: 40,
        axisLabel: {
          fontSize: 11,
          formatter: (value: number) => `$${value.toFixed(0)}`,
        },
        splitLine: { show: true, lineStyle: { type: "dashed", opacity: 0.3 } },
      },
      series: [
        // Stacked bar series for MEV type breakdown
        ...barDataByType.map((typeData) => ({
          name: typeData.name,
          type: "bar" as const,
          stack: "profit",
          data: typeData.data,
          barWidth: "20%",
          barCategoryGap: "20%",
          itemStyle: {
            color: typeData.color,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.3)",
          },
          emphasis: {
            focus: "series" as const,
            itemStyle: {
              borderWidth: 2,
              borderColor: "rgba(255, 255, 255, 0.6)",
            },
          },
          z: 5,
        })),
        // Line series for cumulative profit
        {
          name: "Cumulative Profit",
          type: "line",
          data: profits,
          smooth: 0.2,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: "#3b82f6",
          },
          itemStyle: { color: "#3b82f6" },
          areaStyle: {
            opacity: 0.15,
            color: "#3b82f6",
          },
          z: 10,
        },
        // Line series for express lane price
        {
          name: "Express Lane Price",
          type: "line",
          data: times.map(() => bepPriceUSD),
          showSymbol: false,
          lineStyle: {
            width: 2,
            color: "#ef4444",
            type: "dashed",
          },
          itemStyle: { color: "#ef4444" },
          z: 0,
        },
      ],
    };
  }, [profitData, profitByType, bepPriceUSD]);

  return (
    <Box id={id} className="section-container">
      <Box className="live-section-main-content">
        <Stack direction="row" spacing={1} justifyContent="space-between">
          <StatCard title="Profit" value={cumulativeProfit} prefix="$" />
          <StatCard title="Current Round" value={roundInfo.currentRound} />
          <StatCard
            title="Current Block Number"
            value={roundInfo.currentBlockNumber}
          />
          <StatCard
            title="Number of Transactions"
            value={timeboostedTransactions.length}
          />
          <StatCard title="Gas Used" value={roundInfo.gasUsed} suffix=" wei" />
        </Stack>
        <Stack direction="column" spacing={1}>
          <Card className="live-section-chart-card">
            <CardContent className="live-section-chart-card-content">
              <Box className="live-section-card-title-container">
                <Typography
                  variant="h6"
                  component="h3"
                  className="live-section-card-title"
                >
                  Express Lane MEV Profit
                </Typography>
                <Box className="live-section-live-indicator">
                  <Box
                    className="live-section-live-dot"
                    sx={{
                      backgroundColor: isConnected ? "#22c55e" : "#ef4444",
                    }}
                  />
                  <Typography
                    variant="caption"
                    className="live-section-live-text"
                  >
                    {isConnected ? "LIVE" : "CONNECTING"} - Round{" "}
                    {roundInfo.currentRound} -{" "}
                    {roundInfo.currentOwner.slice(0, 6)}...
                    {roundInfo.currentOwner.slice(-4)}
                  </Typography>
                </Box>
              </Box>
              <Box className="live-section-chart-container">
                <ReactECharts
                  option={chartOptions}
                  notMerge
                  lazyUpdate
                  className="live-section-chart"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Lane Comparison Charts Grid */}
          <Grid container spacing={1}>
            <Grid size={4}>
              <Card className="live-section-chart-card" sx={{ height: 280 }}>
                <CardContent className="live-section-chart-card-content">
                  <Typography
                    variant="h6"
                    component="h3"
                    className="live-section-card-title"
                  >
                    MEV Gas Usage
                  </Typography>
                  <Box sx={{ height: 200, width: "100%" }}>
                    <GasUsageChart />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={4}>
              <Card className="live-section-chart-card" sx={{ height: 280 }}>
                <CardContent className="live-section-chart-card-content">
                  <Typography
                    variant="h6"
                    component="h3"
                    className="live-section-card-title"
                  >
                    MEV Transaction Count
                  </Typography>
                  <Box sx={{ height: 200, width: "100%" }}>
                    <TransactionCountChart />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={4}>
              <Card className="live-section-chart-card" sx={{ height: "100%" }}>
                <CardContent className="live-section-chart-card-content">
                  <Typography
                    variant="h6"
                    component="h3"
                    className="live-section-card-title"
                  >
                    MEV Trade Volume
                  </Typography>
                  <Box sx={{ height: 200, width: "100%" }}>
                    <TradeVolumeChart />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <MEVTransactionTable
            transactions={transactions}
            isConnected={isConnected}
          />
        </Stack>
      </Box>
    </Box>
  );
}

function LiveSection({ id }: { id?: string }) {
  return (
    <ChannelProvider channelName={ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS}>
      <LiveSectionContent id={id} />
    </ChannelProvider>
  );
}

export default LiveSection;
