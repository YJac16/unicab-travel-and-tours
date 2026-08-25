import React from 'react';
import { Link } from 'react-router-dom';
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
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
          <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
        </Link>

        {(showProfile || trailing) && (
          <div className="header-trailing">
            {trailing}
            {showProfile ? <ProfileDropdown /> : null}
          </div>
        )}

        <nav className="main-nav" aria-label="Primary">
          <ul>
            {PUBLIC_NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  className="link-button"
                  to={item.to}
                  onClick={() => {
                    if (!item.to.includes('#')) window.scrollTo(0, 0);
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="cta-nav">
              <Link className="btn btn-primary btn-compact" to="/book">
                Book Now
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
