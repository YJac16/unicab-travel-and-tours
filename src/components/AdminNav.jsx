import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import HubChromeActions from './HubChromeActions';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Bookings' },
  { to: '/admin/tours', label: 'Tours' },
  { to: '/admin/fleet', label: 'Fleet' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/tracking', label: 'Tracking' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/reviews', label: 'Reviews' },
];

export default function AdminNav() {
  const { pathname } = useLocation();
  return (
    <header className="site-header hub-header">
      <div className="container header-inner hub-header-inner">
        <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
          <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
        </Link>
        <nav className="hub-nav" aria-label="Admin">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                pathname.startsWith(link.to)
                  ? 'hub-nav-link hub-nav-link-active'
                  : 'hub-nav-link'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hub-header-actions">
          <HubChromeActions />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
