import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../config';
import ProfileDropdown from './ProfileDropdown';

export const PUBLIC_NAV_ITEMS = [
  { id: 'services', label: 'Services', to: '/#services' },
  { id: 'vehicles', label: 'Fleet', to: '/vehicles' },
  { id: 'tours', label: 'Tours', to: '/tours' },
  { id: 'reviews', label: 'Reviews', to: '/reviews' },
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
              <a
                className="btn btn-primary btn-compact"
                href={siteConfig.whatsapp.linkWithMessage}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </li>
            <li className="cta-nav">
              <Link className="btn btn-outline btn-compact" to="/#contact">
                Enquire
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
