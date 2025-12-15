import { useMemo } from "react";
import { Typography, Box } from "@mui/material";
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

function MEVSection() {
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
    <Box className="dashboard-section">
      <Typography variant="h4" component="h2" className="section-title">
        MEV
      </Typography>
      {/* Gross MEV */}
      <ChartCard
        title="Gross MEV"
        isLoading={grossMEV.isLoading}
        isError={grossMEV.isError}
        errorMessage={grossMEV.error?.message}
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

      {/* Gross Atomic Arb */}
      <ChartCard
        title="Gross Atomic Arb"
        isLoading={grossAtomicArb.isLoading}
        isError={grossAtomicArb.isError}
        errorMessage={grossAtomicArb.error?.message}
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

      {/* Gross CexDex */}
      <ChartCard
        title="Gross CexDex"
        isLoading={grossCexDexQuotes.isLoading}
        isError={grossCexDexQuotes.isError}
        errorMessage={grossCexDexQuotes.error?.message}
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

      {/* Gross Liquidation */}
      <ChartCard
        title="Gross Liquidation"
        isLoading={grossLiquidation.isLoading}
        isError={grossLiquidation.isError}
        errorMessage={grossLiquidation.error?.message}
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
      {/* Atomic Arb MEV */}
      <ChartCard
        title="Atomic Arb MEV"
        isLoading={atomicMEV.isLoading}
        isError={atomicMEV.isError}
        errorMessage={atomicMEV.error?.message}
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

      {/* Atomic MEV Timeboosted */}
      <ChartCard
        title="Atomic MEV Timeboosted"
        isLoading={atomicMEVTimeboosted.isLoading}
        isError={atomicMEVTimeboosted.isError}
        errorMessage={atomicMEVTimeboosted.error?.message}
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

      {/* CexDex Arb */}
      <ChartCard
        title="CexDex Arb"
        isLoading={cexDex.isLoading}
        isError={cexDex.isError}
        errorMessage={cexDex.error?.message}
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

      {/* CexDex MEV Timeboosted */}
      <ChartCard
        title="CexDex MEV Timeboosted"
        isLoading={cexDexTimeboosted.isLoading}
        isError={cexDexTimeboosted.isError}
        errorMessage={cexDexTimeboosted.error?.message}
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

      {/* Liquidation */}
      <ChartCard
        title="Liquidation"
        isLoading={liquidation.isLoading}
        isError={liquidation.isError}
        errorMessage={liquidation.error?.message}
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

      {/* Liquidation Timeboosted */}
      <ChartCard
        title="Liquidation Timeboosted"
        isLoading={liquidationTimeboosted.isLoading}
        isError={liquidationTimeboosted.isError}
        errorMessage={liquidationTimeboosted.error?.message}
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
  );
}

export default MEVSection;
