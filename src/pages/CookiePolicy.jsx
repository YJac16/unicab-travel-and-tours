import React from 'react';
import { Link } from 'react-router-dom';
import BackToTop from '../components/BackToTop';
import ProfileDropdown from '../components/ProfileDropdown';

function CookiePolicy() {
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
              <Link to="/" className="btn btn-outline" style={{ marginBottom: "2rem", textDecoration: "none" }}>
                ← Back to Home
              </Link>

              <h1 style={{ marginBottom: "1rem" }}>Cookie Policy</h1>
              <p style={{ color: "var(--text-soft)", marginBottom: "3rem" }}>
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div style={{ lineHeight: "1.8", color: "var(--text-main)" }}>
                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>1. What Are Cookies?</h2>
                  <p>
                    Cookies are small text files that are placed on your device when you visit a website. 
                    They are widely used to make websites work more efficiently and provide information to 
                    the website owners.
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>2. How We Use Cookies</h2>
                  <p>We use cookies for the following purposes:</p>
                  
                  <h3 style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>2.1 Essential Cookies</h3>
                  <p>
                    These cookies are necessary for the website to function properly. They enable core functionality 
                    such as security, network management, and accessibility. You cannot opt-out of these cookies.
                  </p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>Authentication and session management</li>
                    <li>Security features</li>
                    <li>Load balancing</li>
                  </ul>

                  <h3 style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>2.2 Analytics Cookies</h3>
                  <p>
                    These cookies help us understand how visitors interact with our website by collecting and 
                    reporting information anonymously. These cookies are optional and require your consent.
                  </p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>Page views and navigation patterns</li>
                    <li>Time spent on pages</li>
                    <li>Traffic sources</li>
                  </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>3. Third-Party Cookies</h2>
                  <p>
                    We may use third-party services that set cookies on your device. These services help us 
                    provide and improve our website functionality. We do not control these third-party cookies.
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>4. Managing Cookies</h2>
                  <p>You can manage your cookie preferences in several ways:</p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>
                      <strong>Cookie Banner:</strong> Use the cookie consent banner on our website to accept, 
                      reject, or customize your cookie preferences.
                    </li>
                    <li>
                      <strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies. 
                      You can also delete cookies that have already been set. However, blocking essential cookies 
                      may affect website functionality.
                    </li>
                  </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>5. Cookie Duration</h2>
                  <p>Cookies may be:</p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>
                      <strong>Session cookies:</strong> Temporary cookies that are deleted when you close your browser
                    </li>
                    <li>
                      <strong>Persistent cookies:</strong> Remain on your device for a set period or until you delete them
                    </li>
                  </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>6. Your Rights</h2>
                  <p>
                    Under GDPR and POPIA, you have the right to:
                  </p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>Be informed about the use of cookies</li>
                    <li>Give or withdraw consent for non-essential cookies</li>
                    <li>Access information about cookies used on our website</li>
                  </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>7. Changes to This Policy</h2>
                  <p>
                    We may update this Cookie Policy from time to time. We will notify you of any changes 
                    by posting the new policy on this page and updating the "Last updated" date.
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>8. Contact Us</h2>
                  <p>
                    If you have questions about our use of cookies, please contact us:
                  </p>
                  <p style={{ marginTop: "0.5rem" }}>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:info@unicabtravel.co.za" style={{ color: "var(--accent-gold)" }}>
                      info@unicabtravel.co.za
                    </a>
                    <br />
                    <strong>Phone:</strong> +27 81 281 8105
                  </p>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default CookiePolicy;






