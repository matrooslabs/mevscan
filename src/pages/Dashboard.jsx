import './Dashboard.css'
import { useMemo } from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import TimeSeriesChart from '../components/TimeSeriesChart'

function Dashboard() {
  // Generate time series data with one-minute intervals
  /** @type {import('../components/TimeSeriesChart').TimeSeriesData} */
  const timeSeriesData = useMemo(() => {
    const data = []
    const now = new Date()
    const minutes = 60 // Generate data for the last 60 minutes
    
    // Use different seeds for deterministic "random" values per line
    let seedTotal = 12345
    let seedNormal = 54321
    let seedExpress = 98765
    
    for (let i = minutes; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 1000)
      const hours = time.getHours().toString().padStart(2, '0')
      const mins = time.getMinutes().toString().padStart(2, '0')
      const timeLabel = `${hours}:${mins}`
      
      // Generate values for each line with different variations
      const baseValue = 100
      
      // Total line
      seedTotal = (seedTotal * 1103515245 + 12345) & 0x7fffffff
      const randomTotal = (seedTotal / 0x7fffffff) * 10 - 5
      const variationTotal = Math.sin((minutes - i) / 10) * 20 + randomTotal
      const total = Math.round((baseValue + variationTotal) * 100) / 100
      
      // Normal line
      seedNormal = (seedNormal * 1103515245 + 54321) & 0x7fffffff
      const randomNormal = (seedNormal / 0x7fffffff) * 8 - 4
      const variationNormal = Math.sin((minutes - i) / 12) * 15 + randomNormal
      const normal = Math.round((baseValue * 0.6 + variationNormal) * 100) / 100
      
      // Express line
      seedExpress = (seedExpress * 1103515245 + 98765) & 0x7fffffff
      const randomExpress = (seedExpress / 0x7fffffff) * 6 - 3
      const variationExpress = Math.sin((minutes - i) / 8) * 12 + randomExpress
      const express = Math.round((baseValue * 0.4 + variationExpress) * 100) / 100
      
      data.push({
        time: timeLabel,
        total: total,
        normal: normal,
        express: express,
      })
    }
    
    return data
  }, [])

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        {/* Gross MEV */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Gross MEV
            </Typography>
            <TimeSeriesChart 
              data={timeSeriesData}
              xAxisKey="time"
              lines={[
                { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                { dataKey: 'express', name: 'Express', strokeColor: '#82ca9d' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Gross Atomic MEV */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Gross Atomic MEV
            </Typography>
            <TimeSeriesChart 
              data={timeSeriesData}
              xAxisKey="time"
              lines={[
                { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                { dataKey: 'express', name: 'Express', strokeColor: '#82ca9d' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Gross CexDex MEV */}
        <Card className="dashboard-box dashboard-box-full">
          <CardContent 
            className="chart-card-content"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--spacing-lg)' }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              className="chard-card-title"
            >
              Gross CexDex MEV
            </Typography>
            <TimeSeriesChart 
              data={timeSeriesData}
              xAxisKey="time"
              lines={[
                { dataKey: 'total', name: 'Total', strokeColor: '#555555' },
                { dataKey: 'normal', name: 'Normal', strokeColor: '#ffc658' },
                { dataKey: 'express', name: 'Express', strokeColor: '#82ca9d' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Placeholder Title 4 */}
        <Card className="dashboard-box">
          <CardContent className="dashboard-card-content">
            <Typography 
              variant="h5" 
              component="h2"
              className="chard-card-title"
            >
              Placeholder Title 4
            </Typography>
          </CardContent>
        </Card>

        {/* Placeholder Title 5 */}
        <Card className="dashboard-box">
          <CardContent className="dashboard-card-content">
            <Typography 
              variant="h5" 
              component="h2"
              className="chard-card-title"
            >
              Placeholder Title 5
            </Typography>
          </CardContent>
        </Card>

        {/* Placeholder Title 6 */}
        <Card className="dashboard-box">
          <CardContent className="dashboard-card-content">
            <Typography 
              variant="h5" 
              component="h2"
              className="chard-card-title"
            >
              Placeholder Title 6
            </Typography>
          </CardContent>
        </Card>

        {/* Placeholder Title 7 */}
        <Card className="dashboard-box">
          <CardContent className="dashboard-card-content">
            <Typography 
              variant="h5" 
              component="h2"
              className="chard-card-title"
            >
              Placeholder Title 7
            </Typography>
          </CardContent>
        </Card>

        {/* Placeholder Title 8 */}
        <Card className="dashboard-box">
          <CardContent className="dashboard-card-content">
            <Typography 
              variant="h5" 
              component="h2"
              className="chard-card-title"
            >
              Placeholder Title 8
            </Typography>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

