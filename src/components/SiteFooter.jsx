import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../config';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          &copy; <span>{year}</span> UNICAB Travel &amp; Tours. All rights reserved.
        </p>
        <p className="footer-meta">
          Premium private transfers &amp; tours — Cape Town &amp; the Western Cape.
        </p>
        <div className="footer-contact" style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-soft)' }}>
          <a href={`mailto:${siteConfig.email}`} style={{ color: 'var(--accent-gold)', textDecoration: 'none', marginRight: '1rem' }}>
            {siteConfig.email}
          </a>
          <a href={`tel:${siteConfig.phone.tel}`} style={{ color: 'var(--accent-gold)', textDecoration: 'none', marginRight: '1rem' }}>
            {siteConfig.phone.display}
          </a>
          <a
            href={siteConfig.whatsapp.directLink}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--accent-gold)', textDecoration: 'none', marginRight: '1rem' }}
          >
            WhatsApp
          </a>
          <a href={siteConfig.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}>
            {siteConfig.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        </div>
        <nav className="footer-legal" aria-label="Legal">
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/cookie-policy">Cookies</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cancellation">Cancellation</Link>
        </nav>
      </div>
    </footer>
  );
}
