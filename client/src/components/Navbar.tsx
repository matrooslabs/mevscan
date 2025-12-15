import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()

  const scrollToSection = useCallback((targetId: string) => {
    if (typeof window === 'undefined') return

    const sectionHeading = document.getElementById(targetId)
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
          timeboost.art
        </button>
        <div className="navbar-menu" role="navigation" aria-label="Section navigation">
          <Button
            type="button"
            className="navbar-menu-item"
            variant="text"
            onClick={() => scrollToSection('live-section')}
          >
            Express Lane Live
          </Button>
          <Button
            type="button"
            className="navbar-menu-item"
            variant="text"
            onClick={() => scrollToSection('mev-section')}
          >
            MEV
          </Button>
          <Button
            type="button"
            className="navbar-menu-item"
            variant="text"
            onClick={() => scrollToSection('express-lane-section')}
          >
            Express Lane
          </Button>
          <Button
            type="button"
            className="navbar-menu-item"
            variant="text"
            onClick={() => scrollToSection('timeboost-section')}
          >
            Timeboost
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

