import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/**
 * Time series data point for chart visualization
 */
export interface TimeSeriesDataPoint {
  time: string;
  total: number;
  normal: number;
  express: number;
}

/**
 * Array of time series data points
 */
export type TimeSeriesData = TimeSeriesDataPoint[];

interface LineConfig {
  dataKey: string;
  name: string;
  strokeColor: string;
  strokeWidth?: number;
  showDots?: boolean;
}

interface TimeSeriesChartProps {
  data?: TimeSeriesData;
  dataKey?: string;
  xAxisKey?: string;
  name?: string;
  strokeColor?: string;
  lines?: LineConfig[];
  showGrid?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  showDots?: boolean;
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
  strokeWidth = 2,
  showDots = false,
}: TimeSeriesChartProps) {
  // Support legacy single-line props or new multi-line prop
  const lineConfigs = lines || (dataKey ? [{ dataKey, name: name || 'Value', strokeColor: strokeColor || '#8884d8', strokeWidth, showDots }] : [])

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          {showLegend && (
            // @ts-ignore - recharts Legend type definition issue
            <Legend 
              content={({ payload }: any) => {
                // Ensure legend items appear in the same order as lineConfigs
                const orderedPayload = lineConfigs.map(config => 
                  payload?.find((p: any) => p.dataKey === config.dataKey || p.value === config.name)
                ).filter((item: any) => Boolean(item))
                
                return (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    {orderedPayload.map((entry, index) => (
                      <li key={entry.dataKey || index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '16px', 
                          height: '2px', 
                          backgroundColor: entry.color 
                        }} />
                        <span style={{ fontSize: '14px' }}>{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                )
              }}
            />
          )}
          {lineConfigs.map((line, index) => (
            <Line 
              key={line.dataKey || index}
              type="monotone" 
              dataKey={line.dataKey} 
              stroke={line.strokeColor} 
              strokeWidth={line.strokeWidth || strokeWidth}
              dot={line.showDots !== undefined ? line.showDots : showDots}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TimeSeriesChart

