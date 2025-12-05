import { useMemo } from 'react'
import { Card, CardContent, Typography, CircularProgress, Alert, Box } from '@mui/material'
import type { UseQueryResult } from '@tanstack/react-query'
import { chartColorPalette } from '../../theme'
import TimeSeriesChart, { type TimeSeriesData, type LineConfig } from '../../components/TimeSeriesChart'
import './MEVSection.css'

interface MEVSectionProps {
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

const transformProtocolData = (data: any): { transformedData: Record<string, string | number>[], lineConfigs: LineConfig[] } => {
  if (!data || data.length === 0) {
    return { transformedData: [], lineConfigs: [] }
  }
  
  const protocols = Array.from(new Set(data.map((item: any) => String(item.proto)))).sort() as string[]
  const times = Array.from(new Set(data.map((item: any) => String(item.time)))).sort() as string[]
  
  const dataMap = new Map<string, Map<string, number>>()
  data.forEach((item: any) => {
    const time = String(item.time)
    const proto = String(item.proto)
    if (!dataMap.has(time)) {
      dataMap.set(time, new Map())
    }
    dataMap.get(time)!.set(proto, Number(item.profit_usd) || 0)
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
  
  const lineConfigs: LineConfig[] = protocols.map((proto, index) => ({
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
      return { transformedAtomicMEVData: [], atomicMEVLineConfigs: [] as LineConfig[] }
    }
    
    const protocols = Array.from(new Set(atomicMEVTimeboosted.data.map((item: any) => String(item.proto)))).sort() as string[]
    const times = Array.from(new Set(atomicMEVTimeboosted.data.map((item: any) => String(item.time)))).sort() as string[]
    
    const dataMap = new Map<string, Map<string, number>>()
    atomicMEVTimeboosted.data.forEach((item: any) => {
      const time = String(item.time)
      const proto = String(item.proto)
      if (!dataMap.has(time)) {
        dataMap.set(time, new Map())
      }
      dataMap.get(time)!.set(proto, Number(item.profit_usd) || 0)
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
    
    const lineConfigs: LineConfig[] = protocols.map((proto, index) => ({
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
      <Box className="dashboard-section-group">
        <Typography 
          variant="h4" 
          component="h2" 
          className="mev-section-title"
        >
          MEV
        </Typography>
        <Box className="dashboard-section">
          {/* Gross MEV */}
          <Card className="dashboard-box dashboard-box-full">
            <CardContent className="chart-card-content">
              <Typography variant="h5" component="h2" className="chard-card-title">
                Gross MEV
              </Typography>
              {grossMEV.isLoading ? (
                <Box className="loading-container">
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
            <CardContent className="chart-card-content">
              <Typography variant="h5" component="h2" className="chard-card-title">
                Gross Atomic Arb
              </Typography>
              {grossAtomicArb.isLoading ? (
                <Box className="loading-container">
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
            <CardContent className="chart-card-content">
              <Typography variant="h5" component="h2" className="chard-card-title">
                Gross CexDex
              </Typography>
              {grossCexDexQuotes.isLoading ? (
                <Box className="loading-container">
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
            <CardContent className="chart-card-content">
              <Typography variant="h5" component="h2" className="chard-card-title">
                Gross Liquidation
              </Typography>
              {grossLiquidation.isLoading ? (
                <Box className="loading-container">
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
          <CardContent className="chart-card-content">
            <Typography variant="h5" component="h2" className="chard-card-title">
              Atomic Arb MEV
            </Typography>
            {atomicMEV.isLoading ? (
              <Box className="loading-container">
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
          <CardContent className="chart-card-content">
            <Typography variant="h5" component="h2" className="chard-card-title">
              Atomic MEV Timeboosted
            </Typography>
            {atomicMEVTimeboosted.isLoading ? (
              <Box className="loading-container">
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
          <CardContent className="chart-card-content">
            <Typography variant="h5" component="h2" className="chard-card-title">
              CexDex Arb
            </Typography>
            {cexDex.isLoading ? (
              <Box className="loading-container">
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
          <CardContent className="chart-card-content">
            <Typography variant="h5" component="h2" className="chard-card-title">
              CexDex MEV Timeboosted
            </Typography>
            {cexDexTimeboosted.isLoading ? (
              <Box className="loading-container">
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
          <CardContent className="chart-card-content">
            <Typography variant="h5" component="h2" className="chard-card-title">
              Liquidation
            </Typography>
            {liquidation.isLoading ? (
              <Box className="loading-container">
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
          <CardContent className="chart-card-content">
            <Typography variant="h5" component="h2" className="chard-card-title">
              Liquidation Timeboosted
            </Typography>
            {liquidationTimeboosted.isLoading ? (
              <Box className="loading-container">
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

