import { useMemo } from 'react'
import { Typography, Box } from '@mui/material'
import TimeSeriesChart, { type TimeSeriesData } from '../../components/TimeSeriesChart'
import PieChart, { type PieChartData } from '../../components/PieChart'
import BarChart from '../../components/BarChart'
import { getStableColorForLabel } from '../../utils/stableColor'
import {
  useAuctionWinCount,
  useBidsPerAddress,
  useBidsPerRound,
  useExpressLanePrice,
  usePeriodicApiRefreshByKeys,
} from '../../hooks/useApi'
import ChartCard from '../../components/ChartCard'
import { chartColors } from '../../theme'
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

    return topAddresses.map((item) => ({
      name: item.bidder || 'Unknown',
      value: item.bid_count || 0,
      color: getStableColorForLabel(item.bidder),
    }))
  }, [bidsPerAddress.data])

  // Transform Auction Win Count data
  const transformAuctionWinCountData = useMemo((): PieChartData[] => {
    const auctionData = auctionWinCount.data as AuctionWinCountEntry[] | undefined
    if (!auctionData || auctionData.length === 0) {
      return []
    }
    return auctionData.map((item) => ({
      name: item.address || 'Unknown',
      value: item.wins || 0,
      color: getStableColorForLabel(item.address),
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
            Timeboost Auctions
          </Typography>
        </Box>
        <Box className="section-content">
          {/* Top Row - 2 pie charts */}
          <Box className="chart-grid chart-grid-dense" sx={{ marginBottom: '16px' }}>
            <ChartCard
              title="Bids per Address"
              isLoading={bidsPerAddress.isLoading}
              isError={bidsPerAddress.isError}
              errorMessage={bidsPerAddress.error?.message}
              className="chart-card-half"
              variant="compact"
              accentColor={chartColors.atomic}
            >
              <Box className="chart-card-inner">
                <Box className="chart-card-pie">
                  <PieChart
                    data={transformBidsPerAddressData}
                    innerRadius={40}
                    outerRadius={70}
                    showLegend={true}
                  />
                </Box>
              </Box>
            </ChartCard>

            <ChartCard
              title="Auction Win Count"
              isLoading={auctionWinCount.isLoading}
              isError={auctionWinCount.isError}
              errorMessage={auctionWinCount.error?.message}
              className="chart-card-half"
              variant="compact"
              accentColor={chartColors.cexdex}
            >
              <Box className="chart-card-inner">
                <Box className="chart-card-pie">
                  <PieChart
                    data={transformAuctionWinCountData}
                    innerRadius={40}
                    outerRadius={70}
                    showLegend={true}
                  />
                </Box>
              </Box>
            </ChartCard>
          </Box>

          {/* Bottom Row - 2 charts */}
          <Box className="chart-grid chart-grid-dense">
            <ChartCard
              title="Bids per Round"
              isLoading={bidsPerRound.isLoading}
              isError={bidsPerRound.isError}
              errorMessage={bidsPerRound.error?.message}
              className="chart-card-half"
              variant="compact"
              accentColor={chartColors.liquidation}
            >
              <BarChart
                data={transformBidsPerRoundData}
                xAxisKey="name"
                yAxisLabel="Bid Count"
                showGrid={true}
                showLegend={false}
                showTooltip={true}
                barColor={chartColors.liquidation}
              />
            </ChartCard>

            <ChartCard
              title="Express Lane Price (ETH)"
              isLoading={expressLanePrice.isLoading}
              isError={expressLanePrice.isError}
              errorMessage={expressLanePrice.error?.message}
              className="chart-card-half"
              variant="compact"
              accentColor={chartColors.timeboost}
            >
              <TimeSeriesChart
                data={transformExpressLanePriceData}
                xAxisKey="time"
                yAxisLabel="Price (ETH)"
                showArea={true}
                hideZeroValues={true}
                lines={[
                  { dataKey: 'total', name: 'First Price', strokeColor: chartColors.timeboost },
                  { dataKey: 'normal', name: 'Second Price', strokeColor: chartColors.normal },
                ]}
              />
            </ChartCard>
          </Box>
        </Box>
      </Box>
  );
}

export default TimeboostSection

