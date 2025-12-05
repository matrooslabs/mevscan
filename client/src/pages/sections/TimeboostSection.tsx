import { useMemo } from 'react'
import { Typography, Box } from '@mui/material'
import { chartColorPalette } from '../../theme'
import TimeSeriesChart, { type TimeSeriesData } from '../../components/TimeSeriesChart'
import PieChart, { type PieChartData } from '../../components/PieChart'
import BarChart from '../../components/BarChart'
import RadialBarChart from '../../components/RadialBarChart'
import {
  useAuctionWinCount,
  useBidsPerAddress,
  useBidsPerRound,
  useExpressLanePrice,
  usePeriodicApiRefreshByKeys,
  useTimeboostGrossRevenue,
  useTimeboostRevenue,
  useTimeboostedTxPerBlock,
  useTimeboostedTxPerSecond,
} from '../../hooks/useApi'
import ChartCard from '../../components/ChartCard'
import './TimeboostSection.css'
import type {
  AuctionWinCountEntry,
  BidsPerAddressEntry,
  BidsPerRoundEntry,
  ExpressLanePriceEntry,
  TimeboostedTxPerBlockEntry,
  TimeboostedTxPerSecondEntry,
} from '../../types/api'

function TimeboostSection() {
  const timeboostGrossRevenue = useTimeboostGrossRevenue()
  const timeboostRevenue = useTimeboostRevenue()
  const bidsPerAddress = useBidsPerAddress()
  const auctionWinCount = useAuctionWinCount()
  const timeboostedTxPerSecond = useTimeboostedTxPerSecond()
  const timeboostedTxPerBlock = useTimeboostedTxPerBlock()
  const bidsPerRound = useBidsPerRound()
  const expressLanePrice = useExpressLanePrice()

  usePeriodicApiRefreshByKeys(
    [
      ['timeboost-gross-revenue'],
      ['timeboost-revenue'],
      ['bids-per-address'],
      ['auction-win-count'],
      ['timeboosted-tx-per-second'],
      ['timeboosted-tx-per-block'],
      ['bids-per-round'],
      ['express-lane-price'],
    ],
    60000,
    true,
    200
  )
  // Transform Bids per Address data
  const transformBidsPerAddressData = useMemo((): PieChartData[] => {
    const bidsData = bidsPerAddress.data as BidsPerAddressEntry[] | undefined
    if (!bidsData || bidsData.length === 0) {
      return []
    }
    const topAddresses = bidsData
      .sort((a, b) => (b.bid_count || 0) - (a.bid_count || 0))
      .slice(0, 10)
    
    return topAddresses.map((item, index: number) => ({
      name: item.bidder || 'Unknown',
      value: item.bid_count || 0,
      color: chartColorPalette[index % chartColorPalette.length],
    }))
  }, [bidsPerAddress.data])

  // Transform Auction Win Count data
  const transformAuctionWinCountData = useMemo((): PieChartData[] => {
    const auctionData = auctionWinCount.data as AuctionWinCountEntry[] | undefined
    if (!auctionData || auctionData.length === 0) {
      return []
    }
    return auctionData.map((item, index: number) => ({
      name: item.address || 'Unknown',
      value: item.wins || 0,
      color: chartColorPalette[index % chartColorPalette.length],
    }))
  }, [auctionWinCount.data])

  // Transform Timeboosted Tx per Second data
  const transformTimeboostedTxPerSecondData = useMemo((): TimeSeriesData => {
    const txPerSecondData = timeboostedTxPerSecond.data as TimeboostedTxPerSecondEntry[] | undefined
    if (!txPerSecondData || txPerSecondData.length === 0) {
      return []
    }
    return txPerSecondData.map((item) => ({
      time: item.time,
      total: item.tx_count || 0,
      normal: 0,
      timeboost: item.tx_count || 0,
    }))
  }, [timeboostedTxPerSecond.data])

  // Transform Timeboosted Tx per Block data
  const transformTimeboostedTxPerBlockData = useMemo(() => {
    const txPerBlockData = timeboostedTxPerBlock.data as TimeboostedTxPerBlockEntry[] | undefined
    if (!txPerBlockData || txPerBlockData.length === 0) {
      return []
    }
    return txPerBlockData.map((item) => ({
      name: item.block_number.toString(),
      value: item.tx_count || 0,
    }))
  }, [timeboostedTxPerBlock.data])

  // Transform Bids per Round data
  const transformBidsPerRoundData = useMemo(() => {
    const bidsPerRoundData = bidsPerRound.data as BidsPerRoundEntry[] | undefined
    if (!bidsPerRoundData || bidsPerRoundData.length === 0) {
      return []
    }
    return bidsPerRoundData.map((item) => ({
      name: item.round.toString(),
      value: item.bid_count || 0,
    }))
  }, [bidsPerRound.data])

  // Transform Express Lane Price data
  const transformExpressLanePriceData = useMemo((): TimeSeriesData => {
    const priceData = expressLanePrice.data as ExpressLanePriceEntry[] | undefined
    if (!priceData || priceData.length === 0) {
      return []
    }
    const sortedData = [...priceData].sort((a, b) => a.round - b.round)
    return sortedData.map((item) => ({
      time: item.round.toString(),
      total: item.first_price || 0,
      normal: item.second_price || 0,
      timeboost: item.first_price || 0,
    }))
  }, [expressLanePrice.data])

  return (
    <>
      {/* Timeboost Section */}
      <Box className="dashboard-section-group timeboost-section-spacing">
        <Typography 
          variant="h4" 
          component="h2" 
          className="timeboost-section-title"
        >
          Timeboost
        </Typography>
        <Box className="dashboard-section">
          {/* Timeboost Gross Revenue */}
          <ChartCard
            title="Timeboost Gross Revenue (All-Time)"
            isLoading={timeboostGrossRevenue.isLoading}
            isError={timeboostGrossRevenue.isError}
            errorMessage={timeboostGrossRevenue.error?.message}
            className="chart-card-half"
            contentClassName="timeboost-chart-card-flex"
          >
            <Box className="timeboost-chart-card-center">
              <Typography 
                variant="h4" 
                component="div"
                className="timeboost-metric-large-value"
              >
                {timeboostGrossRevenue.data?.total_second_price?.toFixed(2) || '0.00'} ETH
              </Typography>
            </Box>
          </ChartCard>

          {/* Timeboost Revenue (Time-Ranged) */}
          <ChartCard
            title="Timeboost Revenue"
            isLoading={timeboostRevenue.isLoading}
            isError={timeboostRevenue.isError}
            errorMessage={timeboostRevenue.error?.message}
            className="chart-card-half"
            contentClassName="timeboost-chart-card-flex"
          >
            <Box className="timeboost-chart-card-inner">
              <Box className="timeboost-chart-card-pie">
                <RadialBarChart 
                  data={timeboostRevenue.data || { total_first_price: 0, total_second_price: 0 }}
                  showLegend={true}
                  showTooltip={true}
                />
              </Box>
            </Box>
          </ChartCard>
        </Box>
      </Box>

      {/* Timeboost Bids Section */}
      <Box className="dashboard-section-group timeboost-section-spacing">
        <Typography 
          variant="h4" 
          component="h2" 
          className="timeboost-section-title"
        >
          Timeboost Bids
        </Typography>
        <Box className="dashboard-section">
          {/* Bids per Address */}
          <ChartCard
            title="Number of Bids per Address"
            isLoading={bidsPerAddress.isLoading}
            isError={bidsPerAddress.isError}
            errorMessage={bidsPerAddress.error?.message}
            className="chart-card-half"
            contentClassName="timeboost-chart-card-flex"
          >
            <Box className="timeboost-chart-card-inner">
              <Box className="timeboost-chart-card-pie">
                <PieChart 
                  data={transformBidsPerAddressData}
                  innerRadius={40}
                  outerRadius={80}
                  showLegend={true}
                />
              </Box>
            </Box>
          </ChartCard>

          {/* Auction Win Count */}
          <ChartCard
            title="Auction Win Count"
            isLoading={auctionWinCount.isLoading}
            isError={auctionWinCount.isError}
            errorMessage={auctionWinCount.error?.message}
            className="chart-card-half"
            contentClassName="timeboost-chart-card-flex"
          >
            <Box className="timeboost-chart-card-inner">
              <Box className="timeboost-chart-card-pie">
                <PieChart 
                  data={transformAuctionWinCountData}
                  innerRadius={40}
                  outerRadius={80}
                  showLegend={true}
                />
              </Box>
            </Box>
          </ChartCard>

          {/* Timeboosted Tx per Second */}
          <ChartCard
            title="Timeboosted Tx per Second"
            isLoading={timeboostedTxPerSecond.isLoading}
            isError={timeboostedTxPerSecond.isError}
            errorMessage={timeboostedTxPerSecond.error?.message}
            className="chart-card-full"
            contentClassName="timeboost-chart-card-flex"
          >
            <TimeSeriesChart 
              data={transformTimeboostedTxPerSecondData}
              xAxisKey="time"
              yAxisLabel="Tx Count"
              showArea={true}
              hideZeroValues={true}
              lines={[
                { dataKey: 'total', name: 'Tx Count', strokeColor: '#82ca9d' },
              ]}
            />
          </ChartCard>

          {/* Timeboosted Tx per Block */}
          <ChartCard
            title="Timeboosted Tx per Block"
            isLoading={timeboostedTxPerBlock.isLoading}
            isError={timeboostedTxPerBlock.isError}
            errorMessage={timeboostedTxPerBlock.error?.message}
            className="chart-card-full"
            contentClassName="timeboost-chart-card-flex"
          >
            <BarChart 
              data={transformTimeboostedTxPerBlockData}
              xAxisKey="name"
              yAxisLabel="Tx Count"
              showGrid={true}
              showLegend={false}
              showTooltip={true}
              barColor="#82ca9d"
            />
          </ChartCard>

          {/* Bids per Round */}
          <ChartCard
            title="Number of Bids per Round"
            isLoading={bidsPerRound.isLoading}
            isError={bidsPerRound.isError}
            errorMessage={bidsPerRound.error?.message}
            className="chart-card-full"
            contentClassName="timeboost-chart-card-flex"
          >
            <BarChart 
              data={transformBidsPerRoundData}
              xAxisKey="name"
              yAxisLabel="Bid Count"
              showGrid={true}
              showLegend={false}
              showTooltip={true}
              barColor="#8884d8"
            />
          </ChartCard>

          {/* Express Lane Price */}
          <ChartCard
            title="Express Lane Price (ETH)"
            isLoading={expressLanePrice.isLoading}
            isError={expressLanePrice.isError}
            errorMessage={expressLanePrice.error?.message}
            className="chart-card-full"
            contentClassName="timeboost-chart-card-flex"
          >
            <TimeSeriesChart 
              data={transformExpressLanePriceData}
              xAxisKey="time"
              yAxisLabel="Price (ETH)"
              showArea={true}
              hideZeroValues={true}
              lines={[
                { dataKey: 'total', name: 'First Price', strokeColor: '#8884d8' },
                { dataKey: 'normal', name: 'Second Price', strokeColor: '#ffc658' },
              ]}
            />
          </ChartCard>
        </Box>
      </Box>
    </>
  )
}

export default TimeboostSection

