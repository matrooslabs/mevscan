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
          {showTooltip && <Tooltip />}
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


