import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

export const PUBLIC_NAV_ITEMS = [
  { id: 'tours', label: 'Tours', to: '/tours' },
  { id: 'packages', label: 'Packages', to: '/packages' },
  { id: 'vehicles', label: 'Vehicles', to: '/vehicles' },
  { id: 'drivers', label: 'Drivers', to: '/drivers' },
  { id: 'reviews', label: 'Reviews', to: '/reviews' },
  { id: 'membership', label: 'Membership', to: '/membership' },
  { id: 'about', label: 'About', to: '/#about' },
  { id: 'contact', label: 'Contact', to: '/#contact' },
];

/**
 * Shared marketing header for public pages.
 */
export default function PublicHeader({ showProfile = true, trailing = null }) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!navOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setNavOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('mobile-nav-open');

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('mobile-nav-open');
    };
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  return (
    <header className={`site-header${navOpen ? ' nav-open' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home" onClick={closeNav}>
          <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
        </Link>

        <nav id="primary-nav" className={`main-nav${navOpen ? ' is-open' : ''}`} aria-label="Primary">
          <ul>
            {PUBLIC_NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  className="link-button"
                  to={item.to}
                  onClick={() => {
                    closeNav();
                    if (!item.to.includes('#')) window.scrollTo(0, 0);
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="cta-nav">
              <Link className="btn btn-primary btn-compact" to="/book" onClick={closeNav}>
                Book Now
              </Link>
            </li>
          </ul>
        </nav>

        {(showProfile || trailing) && (
          <div className="header-trailing">
            {trailing}
            {showProfile ? <ProfileDropdown /> : null}
          </div>
        )}

        <button
          type="button"
          className="nav-toggle"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={navOpen}
          aria-controls="primary-nav"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>
      </div>
    </header>
  );
}
