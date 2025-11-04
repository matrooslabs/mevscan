import React from 'react'
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'

/**
 * Time series data point for chart visualization
 */
export interface TimeSeriesDataPoint {
  time: string;
  total: number;
  normal: number;
  timeboost: number;
}

/**
 * Array of time series data points
 */
export type TimeSeriesData = TimeSeriesDataPoint[];

export interface LineConfig {
  dataKey: string;
  name: string;
  strokeColor: string;
  strokeWidth?: number;
  showDots?: boolean;
}

export interface TimeSeriesChartProps {
  data?: TimeSeriesData | Record<string, string | number>[];
  dataKey?: string;
  xAxisKey?: string;
  name?: string;
  strokeColor?: string;
  lines?: LineConfig[];
  showGrid?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  showDots?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showArea?: boolean;
  fillOpacity?: number;
  hideZeroValues?: boolean;
}

interface TooltipPayloadEntry {
  dataKey?: string;
  name?: string;
  value?: string | number;
  color?: string;
  type?: string;
  payload?: Record<string, unknown>;
}

interface LegendPayloadEntry {
  dataKey?: string;
  value?: string;
  color?: string;
  type?: string;
}

// Constants
const DEFAULT_STROKE_COLOR = '#8884d8';
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_FILL_OPACITY = 0.3;
const DEFAULT_DOT_RADIUS = 4;
const DEFAULT_DOT_STROKE_WIDTH = 2;
const DEFAULT_DOT_STROKE_COLOR = '#fff';
const FONT_SIZE_SMALL = 11;
const FONT_SIZE_MEDIUM = 12;
const FONT_SIZE_LARGE = 14;

// Styles
const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const tooltipHeaderStyle: React.CSSProperties = {
  margin: '0 0 4px 0',
  fontWeight: 'bold',
  fontSize: `${FONT_SIZE_MEDIUM}px`
};

const tooltipEntryStyle: React.CSSProperties = {
  margin: '2px 0',
  fontSize: `${FONT_SIZE_MEDIUM}px`
};

const tooltipColorIndicatorStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '10px',
  height: '2px',
  marginRight: '4px'
};

const legendListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '16px'
};

const legendItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const legendColorIndicatorStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '16px',
  height: '2px'
};

// Helper functions
function createLineConfigs(
  lines?: LineConfig[],
  dataKey?: string,
  name?: string,
  strokeColor?: string,
  strokeWidth?: number,
  showDots?: boolean
): LineConfig[] {
  if (lines) {
    return lines;
  }
  
  if (dataKey) {
    return [{
      dataKey,
      name: name || 'Value',
      strokeColor: strokeColor || DEFAULT_STROKE_COLOR,
      strokeWidth,
      showDots
    }];
  }
  
  return [];
}

function filterLineEntries(payload: TooltipPayloadEntry[]): TooltipPayloadEntry[] {
  return payload.filter(entry => entry.type !== 'area');
}

function deduplicateEntries(entries: TooltipPayloadEntry[]): TooltipPayloadEntry[] {
  const seen = new Set<string>();
  return entries.filter(entry => {
    const key = entry.dataKey || entry.name || '';
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function orderLegendPayload(
  payload: LegendPayloadEntry[],
  lineConfigs: LineConfig[]
): LegendPayloadEntry[] {
  return lineConfigs
    .map(config => 
      payload.find(p => p.dataKey === config.dataKey || p.value === config.name)
    )
    .filter((item): item is LegendPayloadEntry => Boolean(item));
}

function formatValue(value: string | number | undefined): string {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value || '');
}

interface TooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  hideZeroValues?: boolean;
}

interface LegendContentProps {
  payload?: LegendPayloadEntry[];
  lineConfigs: LineConfig[];
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, hideZeroValues = false }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const lineEntries = filterLineEntries(payload);
  
  if (lineEntries.length === 0) {
    return null;
  }

  let uniqueEntries = deduplicateEntries(lineEntries);
  
  // Filter out entries with value 0 if hideZeroValues is enabled
  if (hideZeroValues) {
    uniqueEntries = uniqueEntries.filter(entry => {
      const value = entry.value;
      if (typeof value === 'number') {
        return value !== 0;
      }
      // For string values, check if they represent zero
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        return !isNaN(numValue) && numValue !== 0;
      }
      return true; // Keep entries with undefined/null values
    });
  }
  
  // If all entries were filtered out, return null
  if (uniqueEntries.length === 0) {
    return null;
  }

  const timeValue = uniqueEntries[0]?.payload?.time as string | undefined;

  return (
    <div style={tooltipStyle}>
      {timeValue && <p style={tooltipHeaderStyle}>{timeValue}</p>}
      {uniqueEntries.map((entry, index) => (
        <p 
          key={entry.dataKey || index} 
          style={{ ...tooltipEntryStyle, color: entry.color }}
        >
          <span 
            style={{ 
              ...tooltipColorIndicatorStyle, 
              backgroundColor: entry.color 
            }} 
          />
          {entry.name}: {formatValue(entry.value)}
        </p>
      ))}
    </div>
  );
}

// Custom Legend Component
function CustomLegend({ payload, lineConfigs }: LegendContentProps) {
  if (!payload || payload.length === 0) {
    return null;
  }

  const linePayload = filterLineEntries(payload as TooltipPayloadEntry[]) as LegendPayloadEntry[];
  const orderedPayload = orderLegendPayload(linePayload, lineConfigs);

  return (
    <ul style={legendListStyle}>
      {orderedPayload.map((entry, index) => (
        <li key={entry.dataKey || index} style={legendItemStyle}>
          <span 
            style={{ 
              ...legendColorIndicatorStyle, 
              backgroundColor: entry.color 
            }} 
          />
          <span style={{ fontSize: `${FONT_SIZE_LARGE}px` }}>
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Chart Axis Configuration
function createXAxisProps(xAxisKey: string, xAxisLabel?: string) {
  return {
    dataKey: xAxisKey,
    tick: { fontSize: FONT_SIZE_MEDIUM },
    interval: 'preserveStartEnd' as const,
    ...(xAxisLabel && {
      label: {
        value: xAxisLabel,
        position: 'insideBottom' as const,
        offset: -5,
        style: { fontSize: FONT_SIZE_SMALL }
      }
    })
  };
}

function createYAxisProps(yAxisLabel?: string) {
  return {
    tick: { fontSize: FONT_SIZE_MEDIUM },
    ...(yAxisLabel && {
      label: {
        value: yAxisLabel,
        angle: -90,
        position: 'insideLeft' as const,
        style: { fontSize: FONT_SIZE_SMALL }
      }
    })
  };
}

function createDotConfig(strokeColor: string, showDots: boolean) {
  return showDots
    ? {
        fill: strokeColor,
        strokeWidth: DEFAULT_DOT_STROKE_WIDTH,
        r: DEFAULT_DOT_RADIUS,
        stroke: DEFAULT_DOT_STROKE_COLOR
      }
    : false;
}

/**
 * TimeSeriesChart - A reusable time series line chart component
 */
function TimeSeriesChart({
  data = [],
  dataKey,
  xAxisKey = 'time',
  name,
  strokeColor,
  lines,
  showGrid = true,
  showLegend = true,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  showDots = true,
  xAxisLabel,
  yAxisLabel,
  showArea = true,
  fillOpacity = DEFAULT_FILL_OPACITY,
  hideZeroValues = false,
}: TimeSeriesChartProps) {
  const lineConfigs = createLineConfigs(
    lines,
    dataKey,
    name,
    strokeColor,
    strokeWidth,
    showDots
  );

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          
          <XAxis {...createXAxisProps(xAxisKey, xAxisLabel)} />
          <YAxis {...createYAxisProps(yAxisLabel)} />
          
          <Tooltip content={(props) => <CustomTooltip {...props} hideZeroValues={hideZeroValues} />} />
          
          {showLegend && (
            <Legend 
              content={(props) => (
                <CustomLegend {...props} lineConfigs={lineConfigs} />
              )}
            />
          )}
          
          {showArea && lineConfigs.map((line, index) => (
            <Area
              key={`area-${line.dataKey || index}`}
              type="monotone"
              dataKey={line.dataKey}
              stroke="none"
              fill={line.strokeColor}
              fillOpacity={fillOpacity}
              connectNulls={true}
              name={line.name}
            />
          ))}
          
          {lineConfigs.map((line, index) => {
            const shouldShowDots = line.showDots !== undefined ? line.showDots : showDots;
            return (
              <Line 
                key={line.dataKey || index}
                type="monotone" 
                dataKey={line.dataKey} 
                stroke={line.strokeColor} 
                strokeWidth={line.strokeWidth || strokeWidth}
                dot={createDotConfig(line.strokeColor, shouldShowDots)}
                name={line.name}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default React.memo(TimeSeriesChart)

