import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export interface PieChartData {
  name: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  showLegend?: boolean
  showTooltip?: boolean
  innerRadius?: number
  outerRadius?: number
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

/**
 * PieChart - A reusable pie chart component using Recharts
 */
function PieChart({
  data,
  showLegend = true,
  showTooltip = true,
  innerRadius = 0,
  outerRadius = 80,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return <div>No data available</div>
  }

  return (
    <div className="chart-container" style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend 
              content={({ payload }) => {
                return (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    {payload?.map((entry, index) => (
                      <li key={entry.value || index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: entry.color,
                          borderRadius: '2px'
                        }} />
                        <span style={{ fontSize: '14px' }}>{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                )
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PieChart


