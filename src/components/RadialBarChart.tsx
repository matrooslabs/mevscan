import { RadialBarChart as RechartsRadialBarChart, RadialBar, ResponsiveContainer, Legend, Tooltip, Cell } from 'recharts'

export interface RadialBarChartData {
  total_first_price: number
  total_second_price: number
}

interface RadialBarChartProps {
  data: RadialBarChartData
  showLegend?: boolean
  showTooltip?: boolean
}

const FONT_SIZE_LARGE = 14

/**
 * RadialBarChart - A Grafana Gauge-like radial chart component using Recharts
 * Displays first price and second price as concentric arcs where the first price (larger)
 * surrounds the second price (smaller) as nested rings
 */
function RadialBarChart({
  data,
  showLegend = true,
  showTooltip = true,
}: RadialBarChartProps) {
  if (!data || (data.total_first_price === 0 && data.total_second_price === 0)) {
    return <div>No data available</div>
  }

  // Ensure first_price is always larger than or equal to second_price
  const firstPrice = Math.max(data.total_first_price || 0, data.total_second_price || 0)
  const secondPrice = Math.min(data.total_first_price || 0, data.total_second_price || 0)

  // Use first_price as the maximum value for normalization
  const maxValue = firstPrice > 0 ? firstPrice : 1

  // Normalize values to percentage (0-100) for gauge display
  // Both arcs will use the same scale based on first_price as maximum
  const firstPricePercent = (firstPrice / maxValue) * 100
  const secondPricePercent = (secondPrice / maxValue) * 100

  // Gauge-style arc configuration: partial arc (180-270 degrees typical for gauges)
  // Using 180 to 0 for a bottom arc gauge appearance
  const startAngle = 180
  const endAngle = 0

  // Radius configuration for concentric rings
  const baseInnerRadius = 40
  const ringGap = 15 // Gap between inner and outer rings
  const ringThickness = 25 // Thickness of each ring

  // Outer ring (first price) - surrounds the inner ring
  const outerRingInnerRadius = baseInnerRadius + ringThickness + ringGap
  const outerRingOuterRadius = outerRingInnerRadius + ringThickness

  // Inner ring (second price) - surrounded by outer ring
  const innerRingInnerRadius = baseInnerRadius
  const innerRingOuterRadius = baseInnerRadius + ringThickness

  // Separate data arrays for each ring (for rendering)
  const outerRingData = [
    { name: 'First Price', value: firstPricePercent, actualValue: firstPrice, fill: '#82ca9d' }
  ]
  
  const innerRingData = [
    { name: 'Second Price', value: secondPricePercent, actualValue: secondPrice, fill: '#ffc658' }
  ]

  // Combined data array for Legend and Tooltip
  const chartData = [
    { name: 'First Price', value: firstPricePercent, actualValue: firstPrice, fill: '#82ca9d' },
    { name: 'Second Price', value: secondPricePercent, actualValue: secondPrice, fill: '#ffc658' }
  ]

  return (
    <div className="chart-container" style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadialBarChart
          cx="50%"
          cy="75%"
          innerRadius={innerRingInnerRadius}
          outerRadius={outerRingOuterRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          data={chartData}
        >
          {showTooltip && (
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) {
                  return null
                }
                return (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {payload.map((entry: any, index) => {
                      const actualValue = entry.payload?.actualValue ?? entry.value
                      const roundedValue = typeof actualValue === 'number' 
                        ? actualValue.toFixed(2) 
                        : actualValue
                      return (
                        <p key={index} style={{ margin: '2px 0', fontSize: '12px' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '10px', 
                            height: '2px', 
                            backgroundColor: entry.color,
                            marginRight: '4px'
                          }} />
                          {entry.name}: {roundedValue}
                        </p>
                      )
                    })}
                  </div>
                )
              }} 
            />
          )}
          {showLegend && (
            <Legend 
              content={() => {
                return (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    {chartData.map((entry, index) => (
                      <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: entry.fill,
                          borderRadius: '2px'
                        }} />
                        <span style={{ fontSize: `${FONT_SIZE_LARGE}px` }}>
                          {entry.name}: {entry.actualValue.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              }}
            />
          )}
          {/* Outer ring - First Price (surrounds inner ring) */}
          <RadialBar
            dataKey="value"
            innerRadius={outerRingInnerRadius}
            outerRadius={outerRingOuterRadius}
            cornerRadius={4}
            data={outerRingData}
          >
            {outerRingData.map((entry, index) => (
              <Cell key={`outer-${index}`} fill={entry.fill} />
            ))}
          </RadialBar>
          {/* Inner ring - Second Price (surrounded by outer ring) */}
          <RadialBar
            dataKey="value"
            innerRadius={innerRingInnerRadius}
            outerRadius={innerRingOuterRadius}
            cornerRadius={4}
            data={innerRingData}
          >
            {innerRingData.map((entry, index) => (
              <Cell key={`inner-${index}`} fill={entry.fill} />
            ))}
          </RadialBar>
        </RechartsRadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RadialBarChart

