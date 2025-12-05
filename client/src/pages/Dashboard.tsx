import './Dashboard.css'
import MEVSection from './sections/MEVSection'
import ExpressLaneSection from './sections/ExpressLaneSection'
import TimeboostSection from './sections/TimeboostSection'

function Dashboard() {
  const timeRange = '1hour'

  return (
    <div className="dashboard-container">
      <MEVSection timeRange={timeRange} />
      <ExpressLaneSection timeRange={timeRange} />
      <TimeboostSection timeRange={timeRange} />
    </div>
  )
}

export default Dashboard
