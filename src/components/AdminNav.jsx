import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Bookings & Drivers' },
  { to: '/admin/tours', label: 'Tours & Pricing' },
  { to: '/admin/fleet', label: 'Fleet' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/tracking', label: 'Live Tracking' },
];

export default function AdminNav() {
  const { pathname } = useLocation();
  return (
    <header className="site-header">
      <div className="container header-inner" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
          <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
        </Link>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={pathname.startsWith(link.to) ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <ProfileDropdown />
      </div>
    </header>
  );
}
