import './Dashboard.css'
import { Typography, Box } from '@mui/material'
import MEVSection from './sections/MEVSection'
import ExpressLaneSection from './sections/ExpressLaneSection'
import ExpressLaneRealTimeSection from './sections/ExpressLaneRealTimeSection'
import TimeboostSection from './sections/TimeboostSection'

function Dashboard() {
  return (
    <div className="dashboard-container">
      <Box className="dashboard-title-section">
        <Typography variant="h1" className="dashboard-title">
          <span className="dashboard-title-emoji">🚀</span>
          <span className="dashboard-title-text">Timeboost.Art</span>
        </Typography>
        <Typography variant="h4" className="dashboard-subtitle">
          <span className="dashboard-subtitle-text">Built with ❤️ by Matroos Labs</span>
        </Typography>
      </Box>
      <ExpressLaneRealTimeSection />
      <MEVSection />
      <ExpressLaneSection />
      <TimeboostSection />
    </div>
  )
}

export default Dashboard
