import React from 'react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface BarChartData {
  name: string
  value: number
}

interface BarChartProps {
  data: BarChartData[]
  xAxisKey?: string
  yAxisLabel?: string
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  barColor?: string
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    color?: string
  }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const entry = payload[0]
  const roundedValue = typeof entry.value === 'number' 
    ? entry.value.toFixed(2) 
    : entry.value

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px' }}>
        {entry.name}: {roundedValue}
      </p>
    </div>
  )
}

const FONT_SIZE_SMALL = 11
const FONT_SIZE_MEDIUM = 12

/**
 * BarChart - A reusable vertical bar chart component using Recharts
 */
function BarChart({
  data,
  xAxisKey = 'name',
  yAxisLabel,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  barColor = '#8884d8',
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <div>No data available</div>
  }

  return (
    <div className="chart-container" style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data as unknown as Array<Record<string, unknown>>}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: FONT_SIZE_MEDIUM }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: FONT_SIZE_MEDIUM }}
            {...(yAxisLabel && {
              label: {
                value: yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: FONT_SIZE_SMALL }
              }
            })}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend />}
          <Bar dataKey="value" fill={barColor} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default React.memo(BarChart)

