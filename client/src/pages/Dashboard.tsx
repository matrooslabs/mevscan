import './Dashboard.css'
import MEVSection from './sections/MEVSection'
import ExpressLaneSection from './sections/ExpressLaneSection'
import ExpressLaneRealTimeSection from './sections/ExpressLaneRealTimeSection'
import TimeboostSection from './sections/TimeboostSection'

function Dashboard() {
  return (
    <div className="dashboard-container">
      <ExpressLaneRealTimeSection />
      <MEVSection />
      <ExpressLaneSection />
      <TimeboostSection />
    </div>
  )
}

export default Dashboard
