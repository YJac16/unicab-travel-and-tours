import React from 'react';
import { Link } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';

function TermsOfService() {
  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <img src="/logo-white.png" alt="UNICAB" className="logo-img" />
          </Link>
          <Link to="/" className="btn btn-outline btn-compact hub-chrome-btn" style={{ marginLeft: 'auto' }}>
            Home
          </Link>
        </div>
      </header>
      <main className="container" style={{ padding: '7rem 1rem 4rem', maxWidth: 760 }}>
        <h1>Terms of Service</h1>
        <p style={{ color: 'var(--text-soft)' }}>Last updated: July 2026</p>
        <section style={{ display: 'grid', gap: '1rem', lineHeight: 1.7 }}>
          <p>
            These Terms govern your use of the UNICAB Travel &amp; Tours website and booking services
            for private transfers and guided tours in Cape Town and the Western Cape.
          </p>
          <h2>Bookings and payment</h2>
          <p>
            Bookings are confirmed once payment is successfully completed via our payment provider (YOCO)
            or as otherwise agreed in writing. Prices are quoted in South African Rand (ZAR) unless stated otherwise.
          </p>
          <h2>Your responsibilities</h2>
          <p>
            You must provide accurate contact and pickup details, arrive on time, and ensure passengers
            and luggage fit the selected vehicle capacity. Illegal or unsafe activity during a trip is prohibited.
          </p>
          <h2>Our services</h2>
          <p>
            We provide private chauffeur and tour services subject to availability, weather, road conditions,
            and safety considerations. Itineraries may be adjusted when required for safety or access restrictions.
          </p>
          <h2>Liability</h2>
          <p>
            To the fullest extent permitted by South African law, UNICAB is not liable for indirect or consequential
            loss. Nothing in these Terms excludes liability that cannot be excluded by law.
          </p>
          <h2>Contact</h2>
          <p>
            Questions about these Terms: <Link to="/">unicabtraveltours.com</Link> or email info@unicabtravel.co.za.
          </p>
          <p>
            See also our <Link to="/cancellation">Cancellation &amp; Refund Policy</Link> and{' '}
            <Link to="/privacy-policy">Privacy Policy</Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default TermsOfService;
