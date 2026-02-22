import { useCallback } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import logoImage from '../assets/logo-timeboost.png';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  const scrollToSection = useCallback((targetId: string) => {
    if (typeof window === 'undefined') return;

    const sectionHeading = document.getElementById(targetId);
    if (!sectionHeading) return;

    const navbarHeight = document.querySelector('.navbar')?.clientHeight || 0;
    const offset = 12;
    const targetPosition =
      sectionHeading.getBoundingClientRect().top + window.scrollY - navbarHeight - offset;

    window.scrollTo({
      top: Math.max(targetPosition, 0),
      behavior: 'smooth',
    });
  }, []);

  const handleLogoClick = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <AppBar position="sticky" elevation={0} className="navbar" color="transparent">
      <Toolbar className="navbar-container" disableGutters>
        <Button
          component={RouterLink}
          to="/"
          type="button"
          className="navbar-logo"
          onClick={handleLogoClick}
          disableRipple
        >
          <img src={logoImage} alt="Timeboost Logo" className="navbar-logo-img" />
          <span className="navbar-logo-text">timeboost.art</span>
        </Button>
        <Box
          className="navbar-menu"
          component="nav"
          role="navigation"
          aria-label="Section navigation"
        >
          <Button
            component={RouterLink}
            to="/explorer"
            className={`navbar-menu-item ${!isDashboard ? 'navbar-menu-item-active' : ''}`}
            variant="text"
          >
            Explorer
          </Button>
          {isDashboard && (
            <>
              <Button
                type="button"
                className="navbar-menu-item"
                variant="text"
                onClick={() => scrollToSection('live-section')}
              >
                Live
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
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
