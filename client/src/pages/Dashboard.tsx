import './Dashboard.css'
import MEVSection from './sections/MEVSection'
import ExpressLaneSection from './sections/ExpressLaneSection'
import TimeboostSection from './sections/TimeboostSection'

function Dashboard() {
  return (
    <div className="dashboard-container">
      <MEVSection />
      <ExpressLaneSection />
      <TimeboostSection />
    </div>
  )
}

export default Dashboard
