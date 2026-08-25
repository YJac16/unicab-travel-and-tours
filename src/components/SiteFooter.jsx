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
          Private transfers &amp; tours — Cape Town &amp; the Western Cape.
        </p>
        <div className="footer-contact">
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          <a href={`tel:${siteConfig.phone.tel}`}>{siteConfig.phone.display}</a>
          <a href={siteConfig.whatsapp.link} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a href="https://www.unicab.co.za/" target="_blank" rel="noopener noreferrer">
            Cab &amp; Staff Transport
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
