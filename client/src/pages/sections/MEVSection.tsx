import { useMemo } from 'react'
import { Card, CardContent, Typography, CircularProgress, Alert, Box } from '@mui/material'
import type { UseQueryResult } from '@tanstack/react-query'
import { chartColorPalette } from '../../theme'
import TimeSeriesChart, { type TimeSeriesData } from '../../components/TimeSeriesChart'

interface MEVSectionProps {
  timeRange: string
  grossMEV: UseQueryResult<any>
  grossAtomicArb: UseQueryResult<any>
  grossCexDexQuotes: UseQueryResult<any>
  grossLiquidation: UseQueryResult<any>
  atomicMEV: UseQueryResult<any>
  atomicMEVTimeboosted: UseQueryResult<any>
  cexDex: UseQueryResult<any>
  cexDexTimeboosted: UseQueryResult<any>
  liquidation: UseQueryResult<any>
  liquidationTimeboosted: UseQueryResult<any>
}

const transformTimeSeriesData = (data: any): TimeSeriesData => {
  if (!data) return []
  return data.map((item: any) => ({
    time: item.time,
    total: item.total,
    normal: item.normal,
    timeboost: item.timeboost,
  }))
}

const transformProtocolData = (data: any) => {
  if (!data || data.length === 0) {
    return { transformedData: [], lineConfigs: [] }
  }
  
  const protocols = Array.from(new Set(data.map((item: any) => item.proto))).sort()
  const times = Array.from(new Set(data.map((item: any) => item.time))).sort()
  
  const dataMap = new Map<string, Map<string, number>>()
  data.forEach((item: any) => {
    if (!dataMap.has(item.time)) {
      dataMap.set(item.time, new Map())
    }
    dataMap.get(item.time)!.set(item.proto, item.profit_usd)
  })
  
  const transformedData = times.map(time => {
    const protoMap = dataMap.get(time) || new Map()
    const dataPoint: Record<string, string | number> = { time }
    
    protocols.forEach(proto => {
      const safeProtoName = proto.replace(/[^a-zA-Z0-9]/g, '_')
      dataPoint[safeProtoName] = protoMap.get(proto) || 0
    })
    
    return dataPoint
  })
  
  const lineConfigs = protocols.map((proto, index) => ({
    dataKey: proto.replace(/[^a-zA-Z0-9]/g, '_'),
    name: proto,
    strokeColor: chartColorPalette[index % chartColorPalette.length],
  }))
  
  return {
    transformedData,
    lineConfigs,
  }
}

function MEVSection({
  timeRange,
  grossMEV,
  grossAtomicArb,
  grossCexDexQuotes,
  grossLiquidation,
  atomicMEV,
  atomicMEVTimeboosted,
  cexDex,
  cexDexTimeboosted,
  liquidation,
  liquidationTimeboosted,
}: MEVSectionProps) {
  // Transform Atomic MEV Timeboosted data
  const { transformedAtomicMEVData, atomicMEVLineConfigs } = useMemo(() => {
    if (!atomicMEVTimeboosted.data || atomicMEVTimeboosted.data.length === 0) {
      return { transformedAtomicMEVData: [], atomicMEVLineConfigs: [] }
    }
    
    const protocols = Array.from(new Set(atomicMEVTimeboosted.data.map((item: any) => item.proto))).sort()
    const times = Array.from(new Set(atomicMEVTimeboosted.data.map((item: any) => item.time))).sort()
    
    const dataMap = new Map<string, Map<string, number>>()
    atomicMEVTimeboosted.data.forEach((item: any) => {
      if (!dataMap.has(item.time)) {
        dataMap.set(item.time, new Map())
      }
      dataMap.get(item.time)!.set(item.proto, item.profit_usd)
    })
    
    const transformedData = times.map(time => {
      const protoMap = dataMap.get(time) || new Map()
      const dataPoint: Record<string, string | number> = { time }
      
      protocols.forEach(proto => {
        const safeProtoName = proto.replace(/[^a-zA-Z0-9]/g, '_')
        dataPoint[safeProtoName] = protoMap.get(proto) || 0
      })
      
      return dataPoint
    })
    
    const lineConfigs = protocols.map((proto, index) => ({
      dataKey: proto.replace(/[^a-zA-Z0-9]/g, '_'),
      name: proto,
      strokeColor: chartColorPalette[index % chartColorPalette.length],
    }))
    
    return {
      transformedAtomicMEVData: transformedData,
      atomicMEVLineConfigs: lineConfigs,
    }
  }, [atomicMEVTimeboosted.data])

  const atomicMEVTransformed = useMemo(() => transformProtocolData(atomicMEV.data), [atomicMEV.data])
  const cexDexTransformed = useMemo(() => transformProtocolData(cexDex.data), [cexDex.data])
  const cexDexTimeboostedTransformed = useMemo(() => transformProtocolData(cexDexTimeboosted.data), [cexDexTimeboosted.data])
  const liquidationTransformed = useMemo(() => transformProtocolData(liquidation.data), [liquidation.data])
  const liquidationTimeboostedTransformed = useMemo(() => transformProtocolData(liquidationTimeboosted.data), [liquidationTimeboosted.data])

  return (
    <>
      {/* Gross MEV Statistics Section */}
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
          MEV
        </Typography>
        <Box className="dashboard-section">
          {/* Gross MEV */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography variant="h5" component="h2" className="chard-card-title">
                Gross MEV
              </Typography>
              {grossMEV.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : grossMEV.isError ? (
                <Alert severity="error">{grossMEV.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <TimeSeriesChart 
                  data={transformTimeSeriesData(grossMEV.data || [])}
                  xAxisKey="time"
                  yAxisLabel="Profit (USD)"
                  showArea={true}
                  hideZeroValues={true}
                  lines={[
                    { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                    { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                    { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          {/* Gross Atomic Arb */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography variant="h5" component="h2" className="chard-card-title">
                Gross Atomic Arb
              </Typography>
              {grossAtomicArb.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : grossAtomicArb.isError ? (
                <Alert severity="error">{grossAtomicArb.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <TimeSeriesChart 
                  data={transformTimeSeriesData(grossAtomicArb.data || [])}
                  xAxisKey="time"
                  yAxisLabel="Profit (USD)"
                  showArea={true}
                  hideZeroValues={true}
                  lines={[
                    { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                    { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                    { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          {/* Gross CexDex */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography variant="h5" component="h2" className="chard-card-title">
                Gross CexDex
              </Typography>
              {grossCexDexQuotes.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : grossCexDexQuotes.isError ? (
                <Alert severity="error">{grossCexDexQuotes.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <TimeSeriesChart 
                  data={transformTimeSeriesData(grossCexDexQuotes.data || [])}
                  xAxisKey="time"
                  yAxisLabel="Profit (USD)"
                  showArea={true}
                  hideZeroValues={true}
                  lines={[
                    { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                    { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                    { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          {/* Gross Liquidation */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent 
              className="chart-card-content"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
            >
              <Typography variant="h5" component="h2" className="chard-card-title">
                Gross Liquidation
              </Typography>
              {grossLiquidation.isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : grossLiquidation.isError ? (
                <Alert severity="error">{grossLiquidation.error?.message || 'Failed to load data'}</Alert>
              ) : (
                <TimeSeriesChart 
                  data={transformTimeSeriesData(grossLiquidation.data || [])}
                  xAxisKey="time"
                  yAxisLabel="Profit (USD)"
                  showArea={true}
                  hideZeroValues={true}
                  lines={[
                    { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                    { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                    { dataKey: 'timeboost', name: 'Timeboost', strokeColor: '#82ca9d' },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box className="dashboard-section">
        {/* Atomic Arb MEV */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography variant="h5" component="h2" className="chard-card-title">
              Atomic Arb MEV
            </Typography>
            {atomicMEV.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : atomicMEV.isError ? (
              <Alert severity="error">{atomicMEV.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={atomicMEVTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={atomicMEVTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* Atomic MEV Timeboosted */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography variant="h5" component="h2" className="chard-card-title">
              Atomic MEV Timeboosted
            </Typography>
            {atomicMEVTimeboosted.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : atomicMEVTimeboosted.isError ? (
              <Alert severity="error">{atomicMEVTimeboosted.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={transformedAtomicMEVData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={atomicMEVLineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* CexDex Arb */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography variant="h5" component="h2" className="chard-card-title">
              CexDex Arb
            </Typography>
            {cexDex.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : cexDex.isError ? (
              <Alert severity="error">{cexDex.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={cexDexTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={cexDexTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* CexDex MEV Timeboosted */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography variant="h5" component="h2" className="chard-card-title">
              CexDex MEV Timeboosted
            </Typography>
            {cexDexTimeboosted.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : cexDexTimeboosted.isError ? (
              <Alert severity="error">{cexDexTimeboosted.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={cexDexTimeboostedTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={cexDexTimeboostedTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* Liquidation */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography variant="h5" component="h2" className="chard-card-title">
              Liquidation
            </Typography>
            {liquidation.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : liquidation.isError ? (
              <Alert severity="error">{liquidation.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={liquidationTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={liquidationTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>

        {/* Liquidation Timeboosted */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}
          >
            <Typography variant="h5" component="h2" className="chard-card-title">
              Liquidation Timeboosted
            </Typography>
            {liquidationTimeboosted.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : liquidationTimeboosted.isError ? (
              <Alert severity="error">{liquidationTimeboosted.error?.message || 'Failed to load data'}</Alert>
            ) : (
              <TimeSeriesChart 
                data={liquidationTimeboostedTransformed.transformedData}
                xAxisKey="time"
                yAxisLabel="Profit (USD)"
                showArea={true}
                hideZeroValues={true}
                lines={liquidationTimeboostedTransformed.lineConfigs}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

export default MEVSection

