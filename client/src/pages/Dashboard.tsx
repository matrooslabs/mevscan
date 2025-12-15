import './Dashboard.css'
import { Typography, Box, IconButton } from '@mui/material'
import TwitterIcon from '@mui/icons-material/Twitter'
import GitHubIcon from '@mui/icons-material/GitHub'
import MEVSection from './sections/MEVSection'
import ExpressLaneSection from './sections/ExpressLaneSection'
import LiveSection from './sections/LiveSection'
import TimeboostSection from './sections/TimeboostSection'

function Dashboard() {
  return (
    <>
      <div className="dashboard-container">
        <Box className="dashboard-title-section">
          <Typography variant="h1" className="dashboard-title">
            {/* <span className="dashboard-title-emoji">🚀</span> */}
            <span className="dashboard-title-text">Timeboost.Art</span>
          </Typography>
          <Box className="dashboard-subtitle-container">
            <Typography variant="h4" className="dashboard-subtitle">
              <span className="dashboard-subtitle-text">Built with ❤️ by Matroos Labs</span>
            </Typography>
            <Box className="dashboard-social-links">
              <IconButton
                href="https://x.com/matrooslabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="dashboard-social-icon"
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                href="https://github.com/matrooslabs/mevscan"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="dashboard-social-icon"
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
        <LiveSection id="live-section" />
        <MEVSection id="mev-section" />
        <ExpressLaneSection id="express-lane-section" />
        <TimeboostSection id="timeboost-section" />
      </div>
    </>
  )
}

export default Dashboard
