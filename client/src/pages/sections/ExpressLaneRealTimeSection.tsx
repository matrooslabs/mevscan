import { useMemo } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
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
import "./SectionCommon.css";
import "./ExpressLaneRealTimeSection.css";

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
  mevType: "Atomic" | "CexDex" | "Liquidation" | "Sandwich" | "JIT";
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
];

// Mock profit over time data (cumulative) - scaled to show crossing BEP line
const MOCK_PROFIT_DATA = [
  { time: "12:00:00", profit: 0 },
  { time: "12:00:30", profit: 42.3 },
  { time: "12:01:00", profit: 57.05 },
  { time: "12:01:30", profit: 142.05 },
  { time: "12:02:00", profit: 157.8 },
  { time: "12:02:30", profit: 283.0 },
  { time: "12:03:00", profit: 321.5 },
];

// Helper to get chip color based on MEV type
const getMevTypeColor = (
  mevType: string
): "primary" | "secondary" | "success" | "warning" | "error" => {
  switch (mevType) {
    case "Atomic":
      return "primary";
    case "CexDex":
      return "secondary";
    case "Liquidation":
      return "error";
    case "Sandwich":
      return "warning";
    case "JIT":
      return "success";
    default:
      return "primary";
  }
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card className="express-lane-stat-card">
      <CardContent className="express-lane-stat-card-content">
        <Typography variant="caption" className="express-lane-stat-label">
          {title}
        </Typography>
        <Typography
          variant="h5"
          component="div"
          className="express-lane-stat-value"
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ExpressLaneRealTimeSection() {
  // Convert ETH price to USD for BEP line (assuming ~$3500/ETH for mock)
  const bepPriceUSD = MOCK_ROUND_INFO.expressLanePrice * 3500;

  // Chart options for Profit vs Time with BEP line
  const chartOptions = useMemo<EChartsOption>(() => {
    const times = MOCK_PROFIT_DATA.map((d) => d.time);
    const profits = MOCK_PROFIT_DATA.map((d) => d.profit);

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
        data: ["Cumulative Profit", "Break-Even Price"],
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
        boundaryGap: false,
        name: "Time",
        nameLocation: "end",
        nameGap: 8,
        axisLabel: { fontSize: 11 },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: "value",
        name: "Profit (USD)",
        nameGap: 40,
        axisLabel: {
          fontSize: 11,
          formatter: (value: number) => `$${value.toFixed(0)}`,
        },
        splitLine: { show: true, lineStyle: { type: "dashed", opacity: 0.3 } },
      },
      series: [
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
        },
        {
          name: "Break-Even Price",
          type: "line",
          data: times.map(() => bepPriceUSD),
          showSymbol: false,
          lineStyle: {
            width: 2,
            color: "#ef4444",
            type: "dashed",
          },
          itemStyle: { color: "#ef4444" },
        },
      ],
    };
  }, [bepPriceUSD]);

  // Get latest cumulative profit from chart data
  const latestProfit =
    MOCK_PROFIT_DATA[MOCK_PROFIT_DATA.length - 1]?.profit || 0;

  return (
    <Box className="dashboard-section-group section-spacing">
      {/* Stats Cards */}
      <Box className="express-lane-stats-container">
        <StatCard title="Current Round" value={MOCK_ROUND_INFO.currentRound} />
        <StatCard
          title="Express Lane Price"
          value={`${MOCK_ROUND_INFO.expressLanePrice} ETH`}
        />
        <StatCard
          title="Profit"
          value={`$${latestProfit.toFixed(2)}`}
        />
        <StatCard
          title="Number of Transactions"
          value={MOCK_TRANSACTIONS.length}
        />
        <StatCard
          title="Current Block Number"
          value={MOCK_ROUND_INFO.currentBlockNumber}
        />
        <StatCard
          title="Gas Used"
          value={MOCK_ROUND_INFO.gasUsed.toLocaleString()}
        />
        <StatCard
          title="Express Lane Win Rate"
          value={`${(MOCK_ROUND_INFO.expressLaneWinRate * 100).toFixed(1)}%`}
        />
        <StatCard
          title="Express Lane Total Wins"
          value={MOCK_ROUND_INFO.expressLaneTotalWins}
        />
      </Box>
      {/* Main Content: Chart + Transactions */}
      <Box className="express-lane-main-content">
        {/* Profit Chart */}
        <Card className="express-lane-chart-card">
          <CardContent className="express-lane-chart-card-content">
            <Box className="express-lane-card-title-container">
              <Typography
                variant="h6"
                component="h3"
                className="express-lane-card-title"
              >
                Profit vs Time
              </Typography>
              <Box className="express-lane-live-indicator">
                <Box className="express-lane-live-dot" />
                <Typography variant="caption" className="express-lane-live-text">
                  LIVE
                </Typography>
              </Box>
            </Box>

            <Box className="express-lane-chart-container">
              <ReactECharts
                option={chartOptions}
                notMerge
                lazyUpdate
                className="express-lane-chart"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="express-lane-transactions-card">
          <CardContent className="express-lane-transactions-card-content">
            <Typography
              variant="h6"
              component="h3"
              className="express-lane-card-title"
            >
              Transactions
            </Typography>
            <TableContainer
              component={Paper}
              className="express-lane-table-container"
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
                    <TableRow key={index} className="express-lane-tx-row">
                      <TableCell className="express-lane-tx-hash monospace">
                        {tx.txHash}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.mevType}
                          color={getMevTypeColor(tx.mevType)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        className="express-lane-tx-profit"
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
      </Box>
    </Box>
  );
}

export default ExpressLaneRealTimeSection;
