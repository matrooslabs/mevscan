import { useMemo } from "react";
import { Typography, Box, Stack } from "@mui/material";
import { chartColorPalette, chartColors } from "../../theme";
import TimeSeriesChart, {
  type TimeSeriesData,
  type LineConfig,
} from "../../components/TimeSeriesChart";
import ChartCard from "../../components/ChartCard";
import type { ProtocolProfitPoint, TimeSeriesPoint } from "../../types/api";
import {
  useAtomicMEV,
  useAtomicMEVTimeboosted,
  useCexDex,
  useCexDexTimeboosted,
  useGrossAtomicArb,
  useGrossCexDexQuotes,
  useGrossLiquidation,
  useGrossMEV,
  useLiquidation,
  useLiquidationTimeboosted,
  usePeriodicApiRefreshByKeys,
} from "../../hooks/useApi";
import "./SectionCommon.css";

const transformTimeSeriesData = (data?: TimeSeriesPoint[]): TimeSeriesData => {
  if (!data) return [];
  return data.map((item) => ({
    time: item.time,
    total: item.total,
    normal: item.normal,
    timeboost: item.timeboost,
  }));
};

const transformProtocolData = (
  data?: ProtocolProfitPoint[]
): {
  transformedData: Record<string, string | number>[];
  lineConfigs: LineConfig[];
} => {
  if (!data || data.length === 0) {
    return { transformedData: [], lineConfigs: [] };
  }

  const protocols = Array.from(
    new Set(data.map((item) => String(item.proto)))
  ).sort();
  const times = Array.from(
    new Set(data.map((item) => String(item.time)))
  ).sort();

  const dataMap = new Map<string, Map<string, number>>();
  data.forEach((item) => {
    const time = String(item.time);
    const proto = String(item.proto);
    if (!dataMap.has(time)) {
      dataMap.set(time, new Map());
    }
    dataMap.get(time)!.set(proto, Number(item.profit_usd) || 0);
  });

  const transformedData = times.map((time) => {
    const protoMap = dataMap.get(time) || new Map();
    const dataPoint: Record<string, string | number> = { time };

    protocols.forEach((proto) => {
      const safeProtoName = proto.replace(/[^a-zA-Z0-9]/g, "_");
      dataPoint[safeProtoName] = protoMap.get(proto) || 0;
    });

    return dataPoint;
  });

  const lineConfigs: LineConfig[] = protocols.map((proto, index) => ({
    dataKey: proto.replace(/[^a-zA-Z0-9]/g, "_"),
    name: proto,
    strokeColor: chartColorPalette[index % chartColorPalette.length],
  }));

  return {
    transformedData,
    lineConfigs,
  };
};

function MEVSection({ id }: { id?: string }) {
  const grossMEV = useGrossMEV();
  const grossAtomicArb = useGrossAtomicArb();
  const grossCexDexQuotes = useGrossCexDexQuotes();
  const grossLiquidation = useGrossLiquidation();
  const atomicMEVTimeboosted = useAtomicMEVTimeboosted();
  const atomicMEV = useAtomicMEV();
  const cexDex = useCexDex();
  const cexDexTimeboosted = useCexDexTimeboosted();
  const liquidation = useLiquidation();
  const liquidationTimeboosted = useLiquidationTimeboosted();

  usePeriodicApiRefreshByKeys(
    [
      ["gross-mev"],
      ["gross-atomic-arb"],
      ["gross-cex-dex-quotes"],
      ["gross-liquidation"],
      ["atomic-mev-timeboosted"],
      ["atomic-mev"],
      ["cexdex"],
      ["cexdex-timeboosted"],
      ["liquidation"],
      ["liquidation-timeboosted"],
    ],
    60000,
    true,
    200
  );
  const atomicMEVTimeboostedTransformed = useMemo(
    () => transformProtocolData(atomicMEVTimeboosted.data),
    [atomicMEVTimeboosted.data]
  );
  const atomicMEVTransformed = useMemo(
    () => transformProtocolData(atomicMEV.data),
    [atomicMEV.data]
  );
  const cexDexTransformed = useMemo(
    () => transformProtocolData(cexDex.data),
    [cexDex.data]
  );
  const cexDexTimeboostedTransformed = useMemo(
    () => transformProtocolData(cexDexTimeboosted.data),
    [cexDexTimeboosted.data]
  );
  const liquidationTransformed = useMemo(
    () => transformProtocolData(liquidation.data),
    [liquidation.data]
  );
  const liquidationTimeboostedTransformed = useMemo(
    () => transformProtocolData(liquidationTimeboosted.data),
    [liquidationTimeboosted.data]
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
          <ChartCard
            title="Gross MEV Overview"
            isLoading={grossMEV.isLoading}
            isError={grossMEV.isError}
            errorMessage={grossMEV.error?.message}
            className="chart-card-full"
            variant="default"
            accentColor={chartColors.total}
          >
            <TimeSeriesChart
              data={transformTimeSeriesData(grossMEV.data || [])}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={[
                {
                  dataKey: "total",
                  name: "Total",
                  strokeColor: chartColors.total,
                },
                {
                  dataKey: "normal",
                  name: "Normal",
                  strokeColor: chartColors.normal,
                },
                {
                  dataKey: "timeboost",
                  name: "Timeboost",
                  strokeColor: chartColors.timeboost,
                },
              ]}
            />
          </ChartCard>
        </Box>

        {/* Gross MEV Category Breakdown - 3 compact charts per row */}
        <Box className="chart-grid chart-grid-dense" sx={{ marginBottom: '16px' }}>
          <ChartCard
            title="Gross Atomic Arb"
            isLoading={grossAtomicArb.isLoading}
            isError={grossAtomicArb.isError}
            errorMessage={grossAtomicArb.error?.message}
            className="chart-card-third"
            variant="compact"
            accentColor={chartColors.atomic}
          >
            <TimeSeriesChart
              data={transformTimeSeriesData(grossAtomicArb.data || [])}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={[
                {
                  dataKey: "total",
                  name: "Total",
                  strokeColor: chartColors.atomic,
                },
                {
                  dataKey: "normal",
                  name: "Normal",
                  strokeColor: chartColors.normal,
                },
                {
                  dataKey: "timeboost",
                  name: "Timeboost",
                  strokeColor: chartColors.timeboost,
                },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Gross CexDex"
            isLoading={grossCexDexQuotes.isLoading}
            isError={grossCexDexQuotes.isError}
            errorMessage={grossCexDexQuotes.error?.message}
            className="chart-card-third"
            variant="compact"
            accentColor={chartColors.cexdex}
          >
            <TimeSeriesChart
              data={transformTimeSeriesData(grossCexDexQuotes.data || [])}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={[
                {
                  dataKey: "total",
                  name: "Total",
                  strokeColor: chartColors.cexdex,
                },
                {
                  dataKey: "normal",
                  name: "Normal",
                  strokeColor: chartColors.normal,
                },
                {
                  dataKey: "timeboost",
                  name: "Timeboost",
                  strokeColor: chartColors.timeboost,
                },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Gross Liquidation"
            isLoading={grossLiquidation.isLoading}
            isError={grossLiquidation.isError}
            errorMessage={grossLiquidation.error?.message}
            className="chart-card-third"
            variant="compact"
            accentColor={chartColors.liquidation}
          >
            <TimeSeriesChart
              data={transformTimeSeriesData(grossLiquidation.data || [])}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={[
                {
                  dataKey: "total",
                  name: "Total",
                  strokeColor: chartColors.liquidation,
                },
                {
                  dataKey: "normal",
                  name: "Normal",
                  strokeColor: chartColors.normal,
                },
                {
                  dataKey: "timeboost",
                  name: "Timeboost",
                  strokeColor: chartColors.timeboost,
                },
              ]}
            />
          </ChartCard>
        </Box>

        {/* Protocol Breakdown - Atomic Arb - 2 per row */}
        <Box className="chart-grid chart-grid-dense" sx={{ marginBottom: '16px' }}>
          <ChartCard
            title="Atomic Arb by Protocol"
            isLoading={atomicMEV.isLoading}
            isError={atomicMEV.isError}
            errorMessage={atomicMEV.error?.message}
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.atomic}
          >
            <TimeSeriesChart
              data={atomicMEVTransformed.transformedData}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={atomicMEVTransformed.lineConfigs}
            />
          </ChartCard>

          <ChartCard
            title="Atomic Arb Timeboosted"
            isLoading={atomicMEVTimeboosted.isLoading}
            isError={atomicMEVTimeboosted.isError}
            errorMessage={atomicMEVTimeboosted.error?.message}
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.timeboost}
          >
            <TimeSeriesChart
              data={atomicMEVTimeboostedTransformed.transformedData}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={atomicMEVTimeboostedTransformed.lineConfigs}
            />
          </ChartCard>
        </Box>

        {/* Protocol Breakdown - CexDex - 2 per row */}
        <Box className="chart-grid chart-grid-dense" sx={{ marginBottom: '16px' }}>
          <ChartCard
            title="CexDex by Protocol"
            isLoading={cexDex.isLoading}
            isError={cexDex.isError}
            errorMessage={cexDex.error?.message}
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.cexdex}
          >
            <TimeSeriesChart
              data={cexDexTransformed.transformedData}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={cexDexTransformed.lineConfigs}
            />
          </ChartCard>

          <ChartCard
            title="CexDex Timeboosted"
            isLoading={cexDexTimeboosted.isLoading}
            isError={cexDexTimeboosted.isError}
            errorMessage={cexDexTimeboosted.error?.message}
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.timeboost}
          >
            <TimeSeriesChart
              data={cexDexTimeboostedTransformed.transformedData}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={cexDexTimeboostedTransformed.lineConfigs}
            />
          </ChartCard>
        </Box>

        {/* Protocol Breakdown - Liquidation - 2 per row */}
        <Box className="chart-grid chart-grid-dense">
          <ChartCard
            title="Liquidation by Protocol"
            isLoading={liquidation.isLoading}
            isError={liquidation.isError}
            errorMessage={liquidation.error?.message}
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.liquidation}
          >
            <TimeSeriesChart
              data={liquidationTransformed.transformedData}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={liquidationTransformed.lineConfigs}
            />
          </ChartCard>

          <ChartCard
            title="Liquidation Timeboosted"
            isLoading={liquidationTimeboosted.isLoading}
            isError={liquidationTimeboosted.isError}
            errorMessage={liquidationTimeboosted.error?.message}
            className="chart-card-half"
            variant="medium"
            accentColor={chartColors.timeboost}
          >
            <TimeSeriesChart
              data={liquidationTimeboostedTransformed.transformedData}
              xAxisKey="time"
              yAxisLabel="Profit (USD)"
              showArea={true}
              hideZeroValues={true}
              lines={liquidationTimeboostedTransformed.lineConfigs}
            />
          </ChartCard>
        </Box>
      </Box>
    </Box>
  );
}

export default MEVSection;
