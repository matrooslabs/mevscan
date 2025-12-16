import { useMemo } from 'react'
import { Typography, Box, Stack } from '@mui/material'
import { chartColorPalette } from '../../theme'
import TimeSeriesChart, { type TimeSeriesData } from '../../components/TimeSeriesChart'
import PieChart, { type PieChartData } from '../../components/PieChart'
import BarChart from '../../components/BarChart'
import {
  useAuctionWinCount,
  useBidsPerAddress,
  useBidsPerRound,
  useExpressLanePrice,
  usePeriodicApiRefreshByKeys,
} from '../../hooks/useApi'
import ChartCard from '../../components/ChartCard'
import './SectionCommon.css'
import type {
  AuctionWinCountEntry,
  BidsPerAddressEntry,
  BidsPerRoundEntry,
  ExpressLanePriceEntry,
} from '../../types/api'

function TimeboostSection({ id }: { id?: string }) {
  const bidsPerAddress = useBidsPerAddress()
  const auctionWinCount = useAuctionWinCount()
  const bidsPerRound = useBidsPerRound()
  const expressLanePrice = useExpressLanePrice()

  usePeriodicApiRefreshByKeys(
    [
      ['timeboost-gross-revenue'],
      ['timeboost-revenue'],
      ['bids-per-address'],
      ['auction-win-count'],
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
      <Box id={id} className="section-container">
        <Box className="section-header">
          <Typography variant="h4" component="h2" className="section-title">
            Timeboost Bids
          </Typography>
        </Box>
        <Box className="section-content">
          <Stack direction="column" spacing={2}>
          <ChartCard
            title="Number of Bids per Address"
            isLoading={bidsPerAddress.isLoading}
            isError={bidsPerAddress.isError}
            errorMessage={bidsPerAddress.error?.message}
            className="chart-card-full"
            contentClassName="chart-card-flex"
          >
            <Box className="chart-card-inner">
              <Box className="chart-card-pie">
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
            className="chart-card-full"
            contentClassName="chart-card-flex"
          >
            <Box className="chart-card-inner">
              <Box className="chart-card-pie">
                <PieChart 
                  data={transformAuctionWinCountData}
                  innerRadius={40}
                  outerRadius={80}
                  showLegend={true}
                />
              </Box>
            </Box>
          </ChartCard>

          {/* Bids per Round */}
          <ChartCard
            title="Number of Bids per Round"
            isLoading={bidsPerRound.isLoading}
            isError={bidsPerRound.isError}
            errorMessage={bidsPerRound.error?.message}
            className="chart-card-full"
            contentClassName="chart-card-flex"
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
            contentClassName="chart-card-flex"
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
          </Stack>
        </Box>
      </Box>
  );
}

export default TimeboostSection

