import React from 'react';
import { Link } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';

function Subscriptions() {
  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main>
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
          <div className="container">
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <h1>Subscription Management</h1>
              <p style={{ color: "var(--text-soft)", marginBottom: "2rem" }}>
                Manage your membership subscriptions and benefits
              </p>

              <div style={{
                background: "white",
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid var(--border-soft)"
              }}>
                <p style={{ color: "var(--text-soft)" }}>
                  Subscription management features coming soon. This will include:
                </p>
                <ul style={{ marginTop: "1rem", paddingLeft: "1.5rem", color: "var(--text-soft)" }}>
                  <li>Current subscription status</li>
                  <li>Upgrade/downgrade plans</li>
                  <li>Renewal dates</li>
                  <li>Subscription benefits</li>
                  <li>Cancel subscription</li>
                </ul>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <Link to="/membership" className="btn btn-primary" style={{ textDecoration: "none", marginRight: "1rem" }}>
                  View Membership Plans
                </Link>
                <Link to="/" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default Subscriptions;







