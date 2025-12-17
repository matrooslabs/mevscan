import { useMemo } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
} from "@mui/material";
import { ChannelProvider } from "ably/react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import NumberFlow from "@number-flow/react";
import { chartColorPalette } from "../../theme";
import { useExpressLaneTransactions } from "../../hooks/useExpressLaneTransactions";
import { ABLY_CHANNELS } from "../../constants/ably";
import "./SectionCommon.css";
import "./LiveSection.css";

// Helper to normalize MEV type for display
const normalizeMevType = (mevType: string): string => {
  const normalized = mevType.toLowerCase();
  if (normalized === "atomic" || normalized === "atomic_arb") return "Atomic";
  if (normalized === "cex_dex" || normalized === "cexdex") return "CexDex";
  if (normalized === "liquidation") return "Liquidation";
  return mevType;
};

// Helper to get chip color based on MEV type (using chartColorPalette)
const getMevTypeColor = (mevType: string): string => {
  const normalized = normalizeMevType(mevType);
  switch (normalized) {
    case "Atomic":
      return chartColorPalette[0]; // '#8884d8'
    case "CexDex":
      return chartColorPalette[1]; // '#82ca9d'
    case "Liquidation":
      return chartColorPalette[2]; // '#ffc658'
    default:
      return chartColorPalette[0];
  }
};

// Helper to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper to format tx hash for display
const formatTxHash = (hash: string): string => {
  if (hash.length <= 13) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

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

  // Express lane price for the BEP line
  const bepPriceUSD = roundInfo.expressLanePriceUsd || 30;

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
            value={transactions.length}
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
          <Card className="live-section-transactions-card">
            <CardContent className="live-section-transactions-card-content">
              <Box className="live-section-card-title-container">
                <Typography
                  variant="h6"
                  component="h3"
                  className="live-section-card-title"
                >
                  Transactions
                </Typography>
              </Box>
              <TableContainer
                component={Paper}
                className="live-section-table-container"
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tx Hash</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Profit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography variant="body2" color="text.secondary">
                            {isConnected
                              ? "Waiting for transactions..."
                              : "Connecting to live feed..."}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx, index) => (
                        <TableRow key={index} className="live-section-tx-row">
                          <TableCell className="live-section-tx-hash monospace">
                            {formatTxHash(tx.txHash)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={normalizeMevType(tx.mevType)}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: getMevTypeColor(tx.mevType),
                                color: getMevTypeColor(tx.mevType),
                                backgroundColor: hexToRgba(
                                  getMevTypeColor(tx.mevType),
                                  0.08
                                ),
                                "&:hover": {
                                  backgroundColor: hexToRgba(
                                    getMevTypeColor(tx.mevType),
                                    0.15
                                  ),
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell
                            align="right"
                            className="live-section-tx-profit"
                          >
                            ${tx.profitUsd.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
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
