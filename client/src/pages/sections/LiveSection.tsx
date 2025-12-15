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
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import NumberFlow from "@number-flow/react";
import { chartColorPalette } from "../../theme";
import "./SectionCommon.css";
import "./LiveSection.css";

// Mock data for step 1 - will be replaced with real data via hooks
const MOCK_ROUND_INFO = {
  currentRound: 1203,
  currentOwner: "0x96a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f803",
  expressLanePrice: 0.05, // in ETH
  currentBlockNumber: 24567890,
  gasUsed: 125000000, // in gas units
  expressLaneWinRate: 0.752, // 75.2%
  expressLaneTotalWins: 904,
};

interface Transaction {
  txHash: string;
  mevType: "Atomic" | "CexDex" | "Liquidation";
  profit: number; // in USD
  timestamp: number;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    txHash: "0x1234...abcd",
    mevType: "Atomic",
    profit: 38.5,
    timestamp: Date.now() - 1000,
  },
  {
    txHash: "0x5678...efgh",
    mevType: "CexDex",
    profit: 125.2,
    timestamp: Date.now() - 5000,
  },
  {
    txHash: "0x9abc...ijkl",
    mevType: "Atomic",
    profit: 15.75,
    timestamp: Date.now() - 10000,
  },
  {
    txHash: "0xdef0...mnop",
    mevType: "Liquidation",
    profit: 85.0,
    timestamp: Date.now() - 15000,
  },
  {
    txHash: "0x1122...qrst",
    mevType: "Atomic",
    profit: 42.3,
    timestamp: Date.now() - 20000,
  },
  {
    txHash: "0xi9j0...k1l2",
    mevType: "CexDex",
    profit: 156.7,
    timestamp: Date.now() - 35000,
  },
  {
    txHash: "0xm3n4...o5p6",
    mevType: "Atomic",
    profit: 28.9,
    timestamp: Date.now() - 40000,
  },
  {
    txHash: "0xq7r8...s9t0",
    mevType: "Liquidation",
    profit: 203.5,
    timestamp: Date.now() - 45000,
  },
  {
    txHash: "0xc9d0...e1f2",
    mevType: "Atomic",
    profit: 134.6,
    timestamp: Date.now() - 60000,
  },
  {
    txHash: "0xg3h4...i5j6",
    mevType: "CexDex",
    profit: 89.1,
    timestamp: Date.now() - 65000,
  },
  {
    txHash: "0xk7l8...m9n0",
    mevType: "Liquidation",
    profit: 112.4,
    timestamp: Date.now() - 70000,
  },
];

// Mock profit breakdown by MEV type at each time point (incremental profit per 5-second interval)
// Time span: 12:00:00 to 12:01:00 with 5-second intervals
const MOCK_PROFIT_BY_TYPE = [
  { time: "12:00:00", Atomic: 0, CexDex: 0, Liquidation: 0 },
  { time: "12:00:05", Atomic: 1.92, CexDex: 1.28, Liquidation: 0 },
  { time: "12:00:10", Atomic: 3.06, CexDex: 2.04, Liquidation: 0 },
  { time: "12:00:15", Atomic: 4.14, CexDex: 2.76, Liquidation: 0 },
  { time: "12:00:20", Atomic: 4.5, CexDex: 3.0, Liquidation: 0 },
  { time: "12:00:25", Atomic: 5.58, CexDex: 3.72, Liquidation: 0 },
  { time: "12:00:30", Atomic: 6.18, CexDex: 4.12, Liquidation: 0 },
  { time: "12:00:35", Atomic: 2.7, CexDex: 1.8, Liquidation: 0 },
  { time: "12:00:40", Atomic: 1.62, CexDex: 1.08, Liquidation: 0 },
  { time: "12:00:45", Atomic: 1.56, CexDex: 1.04, Liquidation: 0 },
  { time: "12:00:50", Atomic: 1.26, CexDex: 0.84, Liquidation: 0 },
  { time: "12:00:55", Atomic: 0.96, CexDex: 0.64, Liquidation: 0 },
  { time: "12:01:00", Atomic: 0.75, CexDex: 0.5, Liquidation: 0 },
];

// Calculate cumulative profit from MOCK_PROFIT_BY_TYPE
const MOCK_PROFIT_DATA = MOCK_PROFIT_BY_TYPE.map((entry, index) => {
  // Sum all MEV type profits up to and including this time point
  const cumulativeProfit = MOCK_PROFIT_BY_TYPE.slice(0, index + 1).reduce(
    (sum, item) => sum + item.Atomic + item.CexDex + item.Liquidation,
    0
  );
  return {
    time: entry.time,
    profit: cumulativeProfit,
  };
});

// Helper to get chip color based on MEV type (using chartColorPalette)
const getMevTypeColor = (mevType: string): string => {
  switch (mevType) {
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

function LiveSection() {
  // Convert ETH price to USD for BEP line (assuming ~$3500/ETH for mock)
  const bepPriceUSD = 30;

  // Chart options for Profit vs Time with BEP line and stacked bars
  const chartOptions = useMemo<EChartsOption>(() => {
    const times = MOCK_PROFIT_DATA.map((d) => d.time);
    const profits = MOCK_PROFIT_DATA.map((d) => d.profit);

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
      const cumulativeData = MOCK_PROFIT_BY_TYPE.map((d) => {
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
        boundaryGap: true, // Changed to true to show bars properly
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
          barWidth: "20%", // Make bars wider (60% of category width)
          barCategoryGap: "20%", // Reduce gap between time points
          itemStyle: {
            color: typeData.color,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.3)", // Subtle white border for separation
          },
          emphasis: {
            focus: "series" as const,
            itemStyle: {
              borderWidth: 2,
              borderColor: "rgba(255, 255, 255, 0.6)",
            },
          },
          z: 5, // Ensure bars are above background elements
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
          z: 10, // Ensure line is on top
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
          z: 0, // Ensure line is on top
        },
      ],
    };
  }, [bepPriceUSD]);

  // Get latest cumulative profit from chart data
  const latestProfit =
    MOCK_PROFIT_DATA[MOCK_PROFIT_DATA.length - 1]?.profit || 0;

  return (
    <Box className="section-container">
      <Box className="live-section-main-content">
        <Stack direction="row" spacing={1} justifyContent="space-between">
          <StatCard title="Profit" value={latestProfit} suffix="$" />
          <StatCard
            title="Current Block Number"
            value={MOCK_ROUND_INFO.currentBlockNumber}
          />
          <StatCard
            title="Number of Transactions"
            value={MOCK_TRANSACTIONS.length}
          />
          <StatCard
            title="Gas Used"
            value={MOCK_ROUND_INFO.gasUsed}
            suffix="wei"
          />
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
                  <Box className="live-section-live-dot" />
                  <Typography
                    variant="caption"
                    className="live-section-live-text"
                  >
                    LIVE - Round {MOCK_ROUND_INFO.currentRound} -{" "}
                    {MOCK_ROUND_INFO.currentOwner.slice(0, 6)}...
                    {MOCK_ROUND_INFO.currentOwner.slice(-4)}
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
                    {MOCK_TRANSACTIONS.map((tx, index) => (
                      <TableRow key={index} className="live-section-tx-row">
                        <TableCell className="live-section-tx-hash monospace">
                          {tx.txHash}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.mevType}
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
                          ${tx.profit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
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

export default LiveSection;
