import './Dashboard.css'
import { useState } from 'react'
import { Select, MenuItem, FormControl, InputLabel, Alert, Box } from '@mui/material'
import {
  useGrossMEV,
  useGrossAtomicArb,
  useGrossCexDexQuotes,
  useGrossLiquidation,
  useAtomicMEVTimeboosted,
  useExpressLaneMEVPercentage,
  useExpressLaneMEVPercentagePerMinute,
  useAtomicMEV,
  useCexDex,
  useCexDexTimeboosted,
  useLiquidation,
  useLiquidationTimeboosted,
  useExpressLaneNetProfit,
  useExpressLaneProfitByController,
  useTimeboostGrossRevenue,
  useTimeboostRevenue,
  useBidsPerAddress,
  useAuctionWinCount,
  useTimeboostedTxPerSecond,
  useTimeboostedTxPerBlock,
  useBidsPerRound,
  useExpressLanePrice,
  usePeriodicApiRefreshByKeys,
} from '../hooks/useApi'
import MEVSection from './sections/MEVSection'
import ExpressLaneSection from './sections/ExpressLaneSection'
import TimeboostSection from './sections/TimeboostSection'

function Dashboard() {
  const [timeRange, setTimeRange] = useState<string>('15min')

  // Fetch all data
  const grossMEV = useGrossMEV(timeRange)
  const grossAtomicArb = useGrossAtomicArb(timeRange)
  const grossCexDexQuotes = useGrossCexDexQuotes(timeRange)
  const grossLiquidation = useGrossLiquidation(timeRange)
  const atomicMEVTimeboosted = useAtomicMEVTimeboosted(timeRange)
  const expressLaneMEVPercentage = useExpressLaneMEVPercentage(timeRange)
  const expressLaneMEVPercentagePerMinute = useExpressLaneMEVPercentagePerMinute(timeRange)
  const atomicMEV = useAtomicMEV(timeRange)
  const cexDex = useCexDex(timeRange)
  const cexDexTimeboosted = useCexDexTimeboosted(timeRange)
  const liquidation = useLiquidation(timeRange)
  const liquidationTimeboosted = useLiquidationTimeboosted(timeRange)
  const expressLaneNetProfit = useExpressLaneNetProfit(timeRange)
  const expressLaneProfitByController = useExpressLaneProfitByController(timeRange)
  const timeboostGrossRevenue = useTimeboostGrossRevenue()
  const timeboostRevenue = useTimeboostRevenue(timeRange)
  const bidsPerAddress = useBidsPerAddress(timeRange)
  const auctionWinCount = useAuctionWinCount(timeRange)
  const timeboostedTxPerSecond = useTimeboostedTxPerSecond(timeRange)
  const timeboostedTxPerBlock = useTimeboostedTxPerBlock(timeRange)
  const bidsPerRound = useBidsPerRound()
  const expressLanePrice = useExpressLanePrice(timeRange)

  // Periodic refresh - refresh all queries every 1 minute with staggered refreshes
  // Stagger refreshes by 200ms to avoid overwhelming the server
  usePeriodicApiRefreshByKeys(
    [
      ['gross-mev', timeRange],
      ['gross-atomic-arb', timeRange],
      ['gross-cex-dex-quotes', timeRange],
      ['gross-liquidation', timeRange],
      ['atomic-mev-timeboosted', timeRange],
      ['express-lane-mev-percentage', timeRange],
      ['express-lane-mev-percentage-per-minute', timeRange],
      ['atomic-mev', timeRange],
      ['cexdex', timeRange],
      ['cexdex-timeboosted', timeRange],
      ['liquidation', timeRange],
      ['liquidation-timeboosted', timeRange],
      ['express-lane-net-profit', timeRange],
      ['express-lane-profit-by-controller', timeRange],
      ['timeboost-gross-revenue'],
      ['timeboost-revenue', timeRange],
      ['bids-per-address', timeRange],
      ['auction-win-count', timeRange],
      ['timeboosted-tx-per-second', timeRange],
      ['timeboosted-tx-per-block', timeRange],
      ['bids-per-round'],
      ['express-lane-price', timeRange],
    ],
    60000, // 1 minute
    true, // enabled by default
    200 // 200ms stagger between refreshes
  )


  // Check if any query has error
  const hasError = 
    grossMEV.isError ||
    grossAtomicArb.isError ||
    grossCexDexQuotes.isError ||
    grossLiquidation.isError ||
    atomicMEVTimeboosted.isError ||
    expressLaneMEVPercentage.isError ||
    expressLaneMEVPercentagePerMinute.isError ||
    atomicMEV.isError ||
    cexDex.isError ||
    cexDexTimeboosted.isError ||
    liquidation.isError ||
    liquidationTimeboosted.isError ||
    expressLaneNetProfit.isError ||
    expressLaneProfitByController.isError ||
    timeboostGrossRevenue.isError ||
    timeboostRevenue.isError ||
    bidsPerAddress.isError ||
    auctionWinCount.isError ||
    timeboostedTxPerSecond.isError ||
    timeboostedTxPerBlock.isError ||
    bidsPerRound.isError ||
    expressLanePrice.isError

  const errorMessage = 
    grossMEV.error?.message ||
    grossAtomicArb.error?.message ||
    grossCexDexQuotes.error?.message ||
    grossLiquidation.error?.message ||
    atomicMEVTimeboosted.error?.message ||
    expressLaneMEVPercentage.error?.message ||
    expressLaneMEVPercentagePerMinute.error?.message ||
    atomicMEV.error?.message ||
    cexDex.error?.message ||
    cexDexTimeboosted.error?.message ||
    liquidation.error?.message ||
    liquidationTimeboosted.error?.message ||
    expressLaneNetProfit.error?.message ||
    expressLaneProfitByController.error?.message ||
    timeboostGrossRevenue.error?.message ||
    timeboostRevenue.error?.message ||
    bidsPerAddress.error?.message ||
    auctionWinCount.error?.message ||
    timeboostedTxPerSecond.error?.message ||
    timeboostedTxPerBlock.error?.message ||
    bidsPerRound.error?.message ||
    expressLanePrice.error?.message ||
    'An error occurred while fetching data'

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end', padding: '0 var(--spacing-lg)' }}>
        <FormControl size="small" style={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="5min">5 minutes</MenuItem>
            <MenuItem value="15min">15 minutes</MenuItem>
            <MenuItem value="30min">30 minutes</MenuItem>
            <MenuItem value="1hour">1 hour</MenuItem>
            <MenuItem value="12hours">12 hours</MenuItem>
          </Select>
        </FormControl>
      </div>

      {hasError && (
        <Box style={{ padding: '0 var(--spacing-lg)' }}>
          <Alert severity="error" style={{ marginBottom: 'var(--spacing-md)' }}>
            {errorMessage}
          </Alert>
        </Box>
      )}

      <MEVSection
        timeRange={timeRange}
        grossMEV={grossMEV}
        grossAtomicArb={grossAtomicArb}
        grossCexDexQuotes={grossCexDexQuotes}
        grossLiquidation={grossLiquidation}
        atomicMEV={atomicMEV}
        atomicMEVTimeboosted={atomicMEVTimeboosted}
        cexDex={cexDex}
        cexDexTimeboosted={cexDexTimeboosted}
        liquidation={liquidation}
        liquidationTimeboosted={liquidationTimeboosted}
      />

      <ExpressLaneSection
        timeRange={timeRange}
        expressLaneMEVPercentage={expressLaneMEVPercentage}
        expressLaneMEVPercentagePerMinute={expressLaneMEVPercentagePerMinute}
        expressLaneNetProfit={expressLaneNetProfit}
        expressLaneProfitByController={expressLaneProfitByController}
      />

      <TimeboostSection
        timeRange={timeRange}
        timeboostGrossRevenue={timeboostGrossRevenue}
        timeboostRevenue={timeboostRevenue}
        bidsPerAddress={bidsPerAddress}
        auctionWinCount={auctionWinCount}
        timeboostedTxPerSecond={timeboostedTxPerSecond}
        timeboostedTxPerBlock={timeboostedTxPerBlock}
        bidsPerRound={bidsPerRound}
        expressLanePrice={expressLanePrice}
      />
    </div>
  )
}

export default Dashboard
