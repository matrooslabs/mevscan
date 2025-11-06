import { useMemo } from 'react'
import { Card, CardContent, Typography, CircularProgress, Alert, Box } from '@mui/material'
import type { UseQueryResult } from '@tanstack/react-query'
import { chartColorPalette } from '../../theme'
import TimeSeriesChart, { type TimeSeriesData } from '../../components/TimeSeriesChart'
import PieChart, { type PieChartData } from '../../components/PieChart'
import BarChart from '../../components/BarChart'
import RadialBarChart from '../../components/RadialBarChart'

interface TimeboostSectionProps {
  timeRange: string
  timeboostGrossRevenue: UseQueryResult<any>
  timeboostRevenue: UseQueryResult<any>
  bidsPerAddress: UseQueryResult<any>
  auctionWinCount: UseQueryResult<any>
  timeboostedTxPerSecond: UseQueryResult<any>
  timeboostedTxPerBlock: UseQueryResult<any>
  bidsPerRound: UseQueryResult<any>
  expressLanePrice: UseQueryResult<any>
}

function TimeboostSection({
  timeRange,
  timeboostGrossRevenue,
  timeboostRevenue,
  bidsPerAddress,
  auctionWinCount,
  timeboostedTxPerSecond,
  timeboostedTxPerBlock,
  bidsPerRound,
  expressLanePrice,
}: TimeboostSectionProps) {
  // Transform Bids per Address data
  const transformBidsPerAddressData = useMemo((): PieChartData[] => {
    if (!bidsPerAddress.data || bidsPerAddress.data.length === 0) {
      return []
    }
    const topAddresses = bidsPerAddress.data
      .sort((a: any, b: any) => b.bid_count - a.bid_count)
      .slice(0, 10)
    
    return topAddresses.map((item: any, index: number) => ({
      name: item.bidder || 'Unknown',
      value: item.bid_count || 0,
      color: chartColorPalette[index % chartColorPalette.length],
    }))
  }, [bidsPerAddress.data])

  // Transform Auction Win Count data
  const transformAuctionWinCountData = useMemo((): PieChartData[] => {
    if (!auctionWinCount.data || auctionWinCount.data.length === 0) {
      return []
    }
    return auctionWinCount.data.map((item: any, index: number) => ({
      name: item.address || 'Unknown',
      value: item.wins || 0,
      color: chartColorPalette[index % chartColorPalette.length],
    }))
  }, [auctionWinCount.data])

  // Transform Timeboosted Tx per Second data
  const transformTimeboostedTxPerSecondData = useMemo((): TimeSeriesData => {
    if (!timeboostedTxPerSecond.data || timeboostedTxPerSecond.data.length === 0) {
      return []
    }
    return timeboostedTxPerSecond.data.map((item: any) => ({
      time: item.time,
      total: item.tx_count || 0,
      normal: 0,
      timeboost: item.tx_count || 0,
    }))
  }, [timeboostedTxPerSecond.data])

  // Transform Timeboosted Tx per Block data
  const transformTimeboostedTxPerBlockData = useMemo(() => {
    if (!timeboostedTxPerBlock.data || timeboostedTxPerBlock.data.length === 0) {
      return []
    }
    return timeboostedTxPerBlock.data.map((item: any) => ({
      name: item.block_number.toString(),
      value: item.tx_count || 0,
    }))
  }, [timeboostedTxPerBlock.data])

  // Transform Bids per Round data
  const transformBidsPerRoundData = useMemo(() => {
    if (!bidsPerRound.data || bidsPerRound.data.length === 0) {
      return []
    }
    return bidsPerRound.data.map((item: any) => ({
      name: item.round.toString(),
      value: item.bid_count || 0,
    }))
  }, [bidsPerRound.data])

  // Transform Express Lane Price data
  const transformExpressLanePriceData = useMemo((): TimeSeriesData => {
    if (!expressLanePrice.data || expressLanePrice.data.length === 0) {
      return []
    }
    const sortedData = [...expressLanePrice.data].sort((a: any, b: any) => a.round - b.round)
    return sortedData.map((item: any) => ({
      time: item.round.toString(),
      total: item.first_price || 0,
      normal: item.second_price || 0,
      timeboost: item.first_price || 0,
    }))
  }, [expressLanePrice.data])

  return (
    <>
      {/* Timeboost Section */}
      <Box className="dashboard-section-group" sx={{ marginBottom: 'var(--spacing-xl)' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ 
            marginBottom: 'var(--spacing-2xl)',
            padding: 'var(--spacing-lg)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '2rem',
            letterSpacing: '-0.5px',
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '8px',
              left: 'var(--spacing-lg)',
              width: '80px',
              height: '4px',
              background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
              borderRadius: '2px',
            }
          }}
        >
          Timeboost
        </Typography>
        <Box className="dashboard-section">
          {/* Timeboost Gross Revenue */}
          <Card className="dashboard-box dashboard-box-half">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                className="chard-card-title"
                style={{ marginBottom: 'var(--spacing-lg)' }}
              >
                Timeboost Gross Revenue (All-Time)
              </Typography>
              {timeboostGrossRevenue.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : timeboostGrossRevenue.isError ? (
                <Alert severity="error">{timeboostGrossRevenue.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1 }}>
                  <Typography 
                    variant="h4" 
                    component="div"
                    sx={{ 
                      fontSize: '3rem',
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                  >
                    {timeboostGrossRevenue.data?.total_second_price?.toFixed(2) || '0.00'} ETH
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Timeboost Revenue (Time-Ranged) */}
          <Card className="dashboard-box dashboard-box-half">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                className="chard-card-title"
                style={{ marginBottom: 'var(--spacing-lg)' }}
              >
                Timeboost Revenue
              </Typography>
              {timeboostRevenue.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : timeboostRevenue.isError ? (
                <Alert severity="error">{timeboostRevenue.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', height: '100%', flex: 1 }}>
                  <Box style={{ width: '100%', height: '250px', flex: 1 }}>
                    <RadialBarChart 
                      data={timeboostRevenue.data || { total_first_price: 0, total_second_price: 0 }}
                      showLegend={true}
                      showTooltip={true}
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Timeboost Bids Section */}
      <Box className="dashboard-section-group" sx={{ marginBottom: 'var(--spacing-xl)' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ 
            marginBottom: 'var(--spacing-2xl)',
            padding: 'var(--spacing-lg)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '2rem',
            letterSpacing: '-0.5px',
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '8px',
              left: 'var(--spacing-lg)',
              width: '80px',
              height: '4px',
              background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
              borderRadius: '2px',
            }
          }}
        >
          Timeboost Bids
        </Typography>
        <Box className="dashboard-section">
          {/* Bids per Address */}
          <Card className="dashboard-box dashboard-box-half">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                className="chard-card-title"
                style={{ marginBottom: 'var(--spacing-lg)' }}
              >
                Number of Bids per Address
              </Typography>
              {bidsPerAddress.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : bidsPerAddress.isError ? (
                <Alert severity="error">{bidsPerAddress.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', height: '100%', flex: 1 }}>
                  <Box style={{ width: '100%', height: '250px', flex: 1 }}>
                    <PieChart 
                      data={transformBidsPerAddressData}
                      innerRadius={40}
                      outerRadius={80}
                      showLegend={true}
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Auction Win Count */}
          <Card className="dashboard-box dashboard-box-half">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                className="chard-card-title"
                style={{ marginBottom: 'var(--spacing-lg)' }}
              >
                Auction Win Count
              </Typography>
              {auctionWinCount.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : auctionWinCount.isError ? (
                <Alert severity="error">{auctionWinCount.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', height: '100%', flex: 1 }}>
                  <Box style={{ width: '100%', height: '250px', flex: 1 }}>
                    <PieChart 
                      data={transformAuctionWinCountData}
                      innerRadius={40}
                      outerRadius={80}
                      showLegend={true}
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Timeboosted Tx per Second */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography variant="h5" component="h2" className="chard-card-title">
                Timeboosted Tx per Second
              </Typography>
              {timeboostedTxPerSecond.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : timeboostedTxPerSecond.isError ? (
                <Alert severity="error">{timeboostedTxPerSecond.error?.message || 'Failed to load data'}</Alert>
              ) : (
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
              )}
            </CardContent>
          </Card>

          {/* Timeboosted Tx per Block */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography variant="h5" component="h2" className="chard-card-title">
                Timeboosted Tx per Block
              </Typography>
              {timeboostedTxPerBlock.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : timeboostedTxPerBlock.isError ? (
                <Alert severity="error">{timeboostedTxPerBlock.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <BarChart 
                  data={transformTimeboostedTxPerBlockData}
                  xAxisKey="name"
                  yAxisLabel="Tx Count"
                  showGrid={true}
                  showLegend={false}
                  showTooltip={true}
                  barColor="#82ca9d"
                />
              )}
            </CardContent>
          </Card>

          {/* Bids per Round */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography variant="h5" component="h2" className="chard-card-title">
                Number of Bids per Round
              </Typography>
              {bidsPerRound.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : bidsPerRound.isError ? (
                <Alert severity="error">{bidsPerRound.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <BarChart 
                  data={transformBidsPerRoundData}
                  xAxisKey="name"
                  yAxisLabel="Bid Count"
                  showGrid={true}
                  showLegend={false}
                  showTooltip={true}
                  barColor="#8884d8"
                />
              )}
            </CardContent>
          </Card>

          {/* Express Lane Price */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography variant="h5" component="h2" className="chard-card-title">
                Express Lane Price (ETH)
              </Typography>
              {expressLanePrice.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : expressLanePrice.isError ? (
                <Alert severity="error">{expressLanePrice.error?.message || 'Failed to load data'}</Alert>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  )
}

export default TimeboostSection

