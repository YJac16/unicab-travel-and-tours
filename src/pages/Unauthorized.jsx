import React from 'react';
import { Link } from 'react-router-dom';
import BackToTop from '../components/BackToTop';
import ProfileDropdown from '../components/ProfileDropdown';

function Unauthorized() {
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
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
              <div style={{
                fontSize: "4rem",
                marginBottom: "1rem",
                color: "var(--text-soft)"
              }}>
                🔒
              </div>
              <h1 style={{ marginBottom: "1rem" }}>Access Denied</h1>
              <p style={{ 
                color: "var(--text-soft)", 
                marginBottom: "2rem",
                fontSize: "1.1rem"
              }}>
                You don't have permission to access this page. This area is restricted to administrators only.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Go to Home
                </Link>
                <Link to="/login" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  Sign In
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

export default Unauthorized;






