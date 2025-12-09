import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

const SECTION_TITLES = [
  { key: 'express-lane-rt', label: 'Express Lane Real-Time Performance' },
  { key: 'mev', label: 'MEV' },
  { key: 'express-lane', label: 'Express Lane' },
  { key: 'timeboost', label: 'Timeboost' },
  { key: 'timeboost-bids', label: 'Timeboost Bids' },
]

function Navbar() {
  const navigate = useNavigate()

  const scrollToSection = useCallback((label: string) => {
    if (typeof window === 'undefined') return

    const sectionHeading = Array.from(
      document.querySelectorAll<HTMLElement>('.section-title')
    ).find((element) => element.textContent?.trim().toLowerCase() === label.toLowerCase())

    if (!sectionHeading) return

    const navbarHeight = document.querySelector('.navbar')?.clientHeight || 0
    const offset = 12
    const targetPosition =
      sectionHeading.getBoundingClientRect().top + window.scrollY - navbarHeight - offset

    window.scrollTo({
      top: Math.max(targetPosition, 0),
      behavior: 'smooth',
    })
  }, [])

  const handleLogoClick = useCallback(() => {
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [navigate])

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button
          type="button"
          className="navbar-logo"
          onClick={handleLogoClick}
        >
          MevScan
        </button>
        <div className="navbar-menu" role="navigation" aria-label="Section navigation">
          {SECTION_TITLES.map((section) => (
            <button
              key={section.key}
              type="button"
              className="navbar-menu-item"
              onClick={() => scrollToSection(section.label)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

