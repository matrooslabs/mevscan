import { useMemo, useEffect, useState } from 'react'
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
} from '@mui/material'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import PubNub from 'pubnub'
import { PubNubProvider, usePubNub } from 'pubnub-react'
import { PUBNUB_CHANNELS } from '@mevscan/shared/pubnubConstants'
import './SectionCommon.css'
import './ExpressLaneRealTimeSection.css'
import { ExpressLaneProfitData } from '@mevscan/shared'

// Mock data for step 1 - will be replaced with real data via hooks
const MOCK_ROUND_INFO = {
  currentRound: 1203,
  currentOwner: '0x96a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f803',
  expressLanePrice: 0.05, // in ETH
}

interface Transaction {
  txHash: string
  mevType: 'Atomic' | 'CexDex' | 'Liquidation' | 'Sandwich' | 'JIT'
  profit: number // in USD
  timestamp: number
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { txHash: '0x1234...abcd', mevType: 'Atomic', profit: 38.50, timestamp: Date.now() - 1000 },
  { txHash: '0x5678...efgh', mevType: 'CexDex', profit: 125.20, timestamp: Date.now() - 5000 },
  { txHash: '0x9abc...ijkl', mevType: 'Atomic', profit: 15.75, timestamp: Date.now() - 10000 },
  { txHash: '0xdef0...mnop', mevType: 'Liquidation', profit: 85.00, timestamp: Date.now() - 15000 },
  { txHash: '0x1122...qrst', mevType: 'Atomic', profit: 42.30, timestamp: Date.now() - 20000 },
]

// Mock profit over time data (cumulative) - scaled to show crossing BEP line
const MOCK_PROFIT_DATA = [
  { time: '12:00:00', profit: 0 },
  { time: '12:00:30', profit: 42.30 },
  { time: '12:01:00', profit: 57.05 },
  { time: '12:01:30', profit: 142.05 },
  { time: '12:02:00', profit: 157.80 },
  { time: '12:02:30', profit: 283.00 },
  { time: '12:03:00', profit: 321.50 },
]

// Helper to truncate address
const truncateAddress = (address: string) => {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Helper to get chip color based on MEV type
const getMevTypeColor = (mevType: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
  switch (mevType) {
    case 'Atomic':
      return 'primary'
    case 'CexDex':
      return 'secondary'
    case 'Liquidation':
      return 'error'
    case 'Sandwich':
      return 'warning'
    case 'JIT':
      return 'success'
    default:
      return 'primary'
  }
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
}

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card className="express-lane-stat-card">
      <CardContent className="express-lane-stat-card-content">
        <Typography variant="caption" className="express-lane-stat-label">
          {title}
        </Typography>
        <Typography variant="h5" component="div" className="express-lane-stat-value">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" className="express-lane-stat-subtitle">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

function ExpressLaneRealTimeSectionContent() {
  const pubnub = usePubNub()
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [expressLanePrice, setExpressLanePrice] = useState<number>(0);
  const [profitData, setProfitData] = useState<ExpressLaneProfitData[]>([]);
  const [expressLaneController, setExpressLaneController] = useState<string | null>(null);
  // Helper function to process express lane profit data
  const processExpressLaneData = (data: ExpressLaneProfitData[]) => {
    if (!data || data.length === 0) {
      return;
    }

    const newRound = data[0]!.currentRound;
    const roundData = data.filter((item) => item.currentRound === newRound);
    if (roundData.length === 0) {
      return;
    }

    setCurrentRound(newRound);
    setExpressLanePrice(roundData[0]!.expressLanePrice);
    setExpressLaneController(roundData[0]!.expressLaneController);

    // Deduplicate by timestamp
    const unique = roundData.filter((item, index, self) =>
      index === self.findIndex((t) => t.time === item.time)
    );

    console.log('unique', unique);
    setProfitData(unique.reverse());
  };

  // Subscribe to PubNub channel and listen for messages
  useEffect(() => {
    if (!pubnub) return

    // Subscribe to the channel
    pubnub.subscribe({
      channels: [PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT],
    })

    // Set up message listener
    const listener = {
      message: (event: any) => {
        if (event.channel === PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT) {
          console.log('Received message from PubNub:', event.message)

          const messageData = event.message as unknown as ExpressLaneProfitData[];
          if (!messageData || messageData.length === 0) {
            return;
          }
          if (messageData[0]!.currentRound === currentRound) {
            // remove duplicate timestamps from profitData when compared to messageData
            // then reverse messageData and append to end of profitData
            const uniqueProfitData = profitData.filter((item) => !messageData.some((msg) => msg.time === item.time));
            setProfitData([...uniqueProfitData, ...messageData.reverse()]);

          } else {
            processExpressLaneData(messageData);
          }
        }
      }
    }

    pubnub.addListener(listener)

      // Fetch historical messages
      ; (async () => {
        try {
          const messages = await pubnub.fetchMessages({
            channels: [PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT],
            count: 5,
          })

          if (!messages) {
            return;
          }

          let fetchedMessage = messages.channels[PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT];
          if (!fetchedMessage || fetchedMessage.length === 0) {
            return;
          }
          fetchedMessage.reverse();

          // Flatten all messages into a single array
          const expressLaneProfitData = fetchedMessage.flatMap((msg: any) =>
            (msg.message as unknown as ExpressLaneProfitData[]) || []
          );

          processExpressLaneData(expressLaneProfitData);
        } catch (error) {
          console.error('Error fetching messages from PubNub:', error)
        }
      })()

    // Cleanup on unmount
    return () => {
      pubnub.removeListener(listener)
      pubnub.unsubscribe({
        channels: [PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT],
      })
    }
  }, [pubnub])

  // Convert ETH price to USD for BEP line (assuming ~$3500/ETH for mock)
  const bepPriceUSD = MOCK_ROUND_INFO.expressLanePrice * 3500

  // Chart options for Profit vs Time with BEP line
  const chartOptions = useMemo<EChartsOption>(() => {
    const times = MOCK_PROFIT_DATA.map((d) => d.time)
    const profits = MOCK_PROFIT_DATA.map((d) => d.profit)

    return {
      animation: true,
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: unknown) => {
          const data = params as Array<{ name: string; value: number; seriesName: string; color: string }>
          if (!data || data.length === 0) return ''
          const time = data[0].name
          const lines = data.map((item) => {
            const colorDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px;"></span>`
            return `${colorDot}${item.seriesName}: $${item.value.toFixed(2)}`
          })
          return `<strong>${time}</strong><br/>${lines.join('<br/>')}`
        },
      },
      legend: {
        show: true,
        bottom: 0,
        data: ['Cumulative Profit', 'Break-Even Price'],
      },
      grid: {
        top: 24,
        left: 60,
        right: 24,
        bottom: 56,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
        name: 'Time',
        nameLocation: 'end',
        nameGap: 8,
        axisLabel: { fontSize: 11 },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        name: 'Profit (USD)',
        nameGap: 40,
        axisLabel: {
          fontSize: 11,
          formatter: (value: number) => `$${value.toFixed(0)}`,
        },
        splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.3 } },
      },
      series: [
        {
          name: 'Cumulative Profit',
          type: 'line',
          data: profits,
          smooth: 0.2,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: '#3b82f6',
          },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            opacity: 0.15,
            color: '#3b82f6',
          },
        },
        {
          name: 'Break-Even Price',
          type: 'line',
          data: times.map(() => bepPriceUSD),
          showSymbol: false,
          lineStyle: {
            width: 2,
            color: '#ef4444',
            type: 'dashed',
          },
          itemStyle: { color: '#ef4444' },
        },
      ],
    }
  }, [bepPriceUSD])

  return (
    <Box className="dashboard-section-group section-spacing">
      <Typography variant="h4" component="h2" className="section-title">
        Express Lane Real-Time Performance
      </Typography>

      {/* Stats Row */}
      <Box className="express-lane-stats-row">
        <StatCard
          title="Current Round"
          value={MOCK_ROUND_INFO.currentRound.toLocaleString()}
        />
        <StatCard
          title="Current Owner"
          value={truncateAddress(MOCK_ROUND_INFO.currentOwner)}
          subtitle="Express Lane Controller"
        />
        <StatCard
          title="Express Lane Price"
          value={`${MOCK_ROUND_INFO.expressLanePrice} ETH`}
          subtitle={`≈ $${bepPriceUSD.toFixed(2)}`}
        />
      </Box>

      {/* Main Content: Chart + Transactions */}
      <Box className="express-lane-main-content">
        {/* Profit Chart */}
        <Card className="express-lane-chart-card">
          <CardContent className="express-lane-chart-card-content">
            <Typography variant="h6" component="h3" className="express-lane-card-title">
              Profit vs Time
            </Typography>
            <Box className="express-lane-chart-container">
              <ReactECharts
                option={chartOptions}
                notMerge
                lazyUpdate
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="express-lane-transactions-card">
          <CardContent className="express-lane-transactions-card-content">
            <Typography variant="h6" component="h3" className="express-lane-card-title">
              Transactions
            </Typography>
            <TableContainer component={Paper} className="express-lane-table-container">
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
                      <TableCell align="right" className="express-lane-tx-profit">
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
  )
}

// Generate or retrieve a unique userId for this user
function getOrCreateUserId(): string {
  const STORAGE_KEY = 'pubnub_user_id'
  let userId = localStorage.getItem(STORAGE_KEY)

  if (!userId) {
    // Generate a unique ID using crypto.randomUUID if available, otherwise fallback
    userId = crypto.randomUUID ? crypto.randomUUID() : `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(STORAGE_KEY, userId)
  }

  return userId
}

function ExpressLaneRealTimeSection() {
  const pubnubClient = useMemo(() => {
    return new PubNub({
      subscribeKey: import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY || '',
      userId: getOrCreateUserId(),
    })
  }, [])

  return (
    <PubNubProvider client={pubnubClient}>
      <ExpressLaneRealTimeSectionContent />
    </PubNubProvider>
  )
}

export default ExpressLaneRealTimeSection

