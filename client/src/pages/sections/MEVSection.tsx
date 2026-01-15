import { useCallback } from 'react';
import { Typography, Box } from '@mui/material';
import { chartColorPalette, chartColors } from '../../theme';
import TimeSeriesChart, { type LineConfig } from '../../components/TimeSeriesChart';
import { apiClient } from '../../hooks/useApi';
import './SectionCommon.css';

// Transform standard time series data
const transformTimeSeriesData = (data: unknown[]) => {
  return (data as { time: number; total: number; normal: number; timeboost: number }[]).map(
    (item) => ({
      time: item.time,
      total: item.total,
      normal: item.normal,
      timeboost: item.timeboost,
    })
  );
};

// Transform protocol data for multi-line charts
const transformProtocolData = (data: unknown[]) => {
  const typedData = data as { time: number; proto: string; profit_usd: number }[];
  if (!typedData || typedData.length === 0) {
    return [];
  }

  const protocols = Array.from(new Set(typedData.map((item) => String(item.proto)))).sort();
  const times = Array.from(new Set(typedData.map((item) => item.time))).sort((a, b) => a - b);

  const dataMap = new Map<number, Map<string, number>>();
  typedData.forEach((item) => {
    if (!dataMap.has(item.time)) {
      dataMap.set(item.time, new Map());
    }
    dataMap.get(item.time)!.set(String(item.proto), Number(item.profit_usd) || 0);
  });

  return times.map((time) => {
    const protoMap = dataMap.get(time) || new Map();
    const dataPoint: Record<string, number> = { time };

    protocols.forEach((proto) => {
      const safeProtoName = proto.replace(/[^a-zA-Z0-9]/g, '_');
      dataPoint[safeProtoName] = protoMap.get(proto) || 0;
    });

    return dataPoint;
  });
};

// Generate line configs for protocol data
const generateProtocolLineConfigs = (data: unknown[]): LineConfig[] => {
  const typedData = data as { proto: string }[];
  if (!typedData || typedData.length === 0) {
    return [];
  }

  const protocols = Array.from(new Set(typedData.map((item) => String(item.proto)))).sort();
  return protocols.map((proto, index) => ({
    dataKey: proto.replace(/[^a-zA-Z0-9]/g, '_'),
    name: proto,
    strokeColor: chartColorPalette[index % chartColorPalette.length],
  }));
};

const grossMevLines: LineConfig[] = [
  { dataKey: 'total', name: 'Total', strokeColor: chartColors.total },
  { dataKey: 'normal', name: 'Normal', strokeColor: chartColors.normal },
  { dataKey: 'timeboost', name: 'Timeboost', strokeColor: chartColors.timeboost },
];

const atomicArbLines: LineConfig[] = [
  { dataKey: 'total', name: 'Total', strokeColor: chartColors.atomic },
  { dataKey: 'normal', name: 'Normal', strokeColor: chartColors.normal },
  { dataKey: 'timeboost', name: 'Timeboost', strokeColor: chartColors.timeboost },
];

const cexDexLines: LineConfig[] = [
  { dataKey: 'total', name: 'Total', strokeColor: chartColors.cexdex },
  { dataKey: 'normal', name: 'Normal', strokeColor: chartColors.normal },
  { dataKey: 'timeboost', name: 'Timeboost', strokeColor: chartColors.timeboost },
];

const liquidationLines: LineConfig[] = [
  { dataKey: 'total', name: 'Total', strokeColor: chartColors.liquidation },
  { dataKey: 'normal', name: 'Normal', strokeColor: chartColors.normal },
  { dataKey: 'timeboost', name: 'Timeboost', strokeColor: chartColors.timeboost },
];

function MEVSection({ id }: { id?: string }) {
  // Fetch functions for each chart
  const fetchGrossMEV = useCallback((timeRange: string) => apiClient.getGrossMEV(timeRange), []);
  const fetchGrossAtomicArb = useCallback(
    (timeRange: string) => apiClient.getGrossAtomicArb(timeRange),
    []
  );
  const fetchGrossCexDex = useCallback(
    (timeRange: string) => apiClient.getGrossCexDexQuotes(timeRange),
    []
  );
  const fetchGrossLiquidation = useCallback(
    (timeRange: string) => apiClient.getGrossLiquidation(timeRange),
    []
  );
  const fetchAtomicMEV = useCallback((timeRange: string) => apiClient.getAtomicMEV(timeRange), []);
  const fetchAtomicMEVTimeboosted = useCallback(
    (timeRange: string) => apiClient.getAtomicMEVTimeboosted(timeRange),
    []
  );
  const fetchCexDex = useCallback((timeRange: string) => apiClient.getCexDex(timeRange), []);
  const fetchCexDexTimeboosted = useCallback(
    (timeRange: string) => apiClient.getCexDexTimeboosted(timeRange),
    []
  );
  const fetchLiquidation = useCallback(
    (timeRange: string) => apiClient.getLiquidation(timeRange),
    []
  );
  const fetchLiquidationTimeboosted = useCallback(
    (timeRange: string) => apiClient.getLiquidationTimeboosted(timeRange),
    []
  );

  return (
    <Box id={id} className="section-container">
      <Box className="section-header">
        <Typography variant="h4" component="h2" className="section-title">
          MEV Analytics
        </Typography>
      </Box>
      <Box className="section-content">
        {/* Overview Row - Full width hero chart */}
        <Box className="chart-grid" sx={{ marginBottom: '16px' }}>
          <TimeSeriesChart
            enableTimeRangeSelector
            title="Gross MEV Overview"
            queryKey="gross-mev"
            fetchData={fetchGrossMEV}
            transformData={transformTimeSeriesData}
            lines={grossMevLines}
            yAxisLabel="Profit (USD)"
            className="chart-card-full"
            variant="default"
            accentColor={chartColors.total}
          />
        </Box>

        {/* Gross MEV Category Breakdown - 3 compact charts per row */}
        <Box className="chart-grid chart-grid-dense" sx={{ marginBottom: '16px' }}>
          <TimeSeriesChart
            enableTimeRangeSelector
            title="Gross Atomic Arb"
            queryKey="gross-atomic-arb"
            fetchData={fetchGrossAtomicArb}
            transformData={transformTimeSeriesData}
            lines={atomicArbLines}
            yAxisLabel="Profit (USD)"
            className="chart-card-third"
            variant="compact"
            accentColor={chartColors.atomic}
          />

          <TimeSeriesChart
            enableTimeRangeSelector
            title="Gross CexDex"
            queryKey="gross-cex-dex"
            fetchData={fetchGrossCexDex}
            transformData={transformTimeSeriesData}
            lines={cexDexLines}
            yAxisLabel="Profit (USD)"
            className="chart-card-third"
            variant="compact"
            accentColor={chartColors.cexdex}
          />

          <TimeSeriesChart
            enableTimeRangeSelector
            title="Gross Liquidation"
            queryKey="gross-liquidation"
            fetchData={fetchGrossLiquidation}
            transformData={transformTimeSeriesData}
            lines={liquidationLines}
            yAxisLabel="Profit (USD)"
            className="chart-card-third"
            variant="compact"
            accentColor={chartColors.liquidation}
          />
        </Box>

        {/* Protocol Breakdown - Atomic Arb - 2 per row */}
        <Box className="chart-grid chart-grid-dense" sx={{ marginBottom: '16px' }}>
          <TimeSeriesChart
            enableTimeRangeSelector
            title="Atomic Arb by Protocol"
            queryKey="atomic-mev"
            fetchData={fetchAtomicMEV}
            transformData={transformProtocolData}
            lines={[]}
            dynamicLines={generateProtocolLineConfigs}
            yAxisLabel="Profit (USD)"
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.atomic}
          />

          <TimeSeriesChart
            enableTimeRangeSelector
            title="Atomic Arb Timeboosted"
            queryKey="atomic-mev-timeboosted"
            fetchData={fetchAtomicMEVTimeboosted}
            transformData={transformProtocolData}
            lines={[]}
            dynamicLines={generateProtocolLineConfigs}
            yAxisLabel="Profit (USD)"
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.timeboost}
          />
        </Box>

        {/* Protocol Breakdown - CexDex - 2 per row */}
        <Box className="chart-grid chart-grid-dense" sx={{ marginBottom: '16px' }}>
          <TimeSeriesChart
            enableTimeRangeSelector
            title="CexDex by Protocol"
            queryKey="cexdex"
            fetchData={fetchCexDex}
            transformData={transformProtocolData}
            lines={[]}
            dynamicLines={generateProtocolLineConfigs}
            yAxisLabel="Profit (USD)"
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.cexdex}
          />

          <TimeSeriesChart
            enableTimeRangeSelector
            title="CexDex Timeboosted"
            queryKey="cexdex-timeboosted"
            fetchData={fetchCexDexTimeboosted}
            transformData={transformProtocolData}
            lines={[]}
            dynamicLines={generateProtocolLineConfigs}
            yAxisLabel="Profit (USD)"
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.timeboost}
          />
        </Box>

        {/* Protocol Breakdown - Liquidation - 2 per row */}
        <Box className="chart-grid chart-grid-dense">
          <TimeSeriesChart
            enableTimeRangeSelector
            title="Liquidation by Protocol"
            queryKey="liquidation"
            fetchData={fetchLiquidation}
            transformData={transformProtocolData}
            lines={[]}
            dynamicLines={generateProtocolLineConfigs}
            yAxisLabel="Profit (USD)"
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.liquidation}
          />

          <TimeSeriesChart
            enableTimeRangeSelector
            title="Liquidation Timeboosted"
            queryKey="liquidation-timeboosted"
            fetchData={fetchLiquidationTimeboosted}
            transformData={transformProtocolData}
            lines={[]}
            dynamicLines={generateProtocolLineConfigs}
            yAxisLabel="Profit (USD)"
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.timeboost}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default MEVSection;
