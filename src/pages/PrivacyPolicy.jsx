import React from 'react';
import { Link } from 'react-router-dom';
import BackToTop from '../components/BackToTop';
import ProfileDropdown from '../components/ProfileDropdown';

function PrivacyPolicy() {
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

              <h1 style={{ marginBottom: "1rem" }}>Privacy Policy</h1>
              <p style={{ color: "var(--text-soft)", marginBottom: "3rem" }}>
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div style={{ lineHeight: "1.8", color: "var(--text-main)" }}>
                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>1. Introduction</h2>
                  <p>
                    UNICAB Travel & Tours ("we," "our," or "us") is committed to protecting your privacy. 
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                    when you visit our website and use our services.
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>2. Information We Collect</h2>
                  <h3 style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>2.1 Personal Information</h3>
                  <p>We may collect personal information that you provide to us, including:</p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Booking information (dates, group size, special requests)</li>
                    <li>Payment information (processed securely through third-party payment processors)</li>
                    <li>Account credentials (if you create an account)</li>
                  </ul>

                  <h3 style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>2.2 Automatically Collected Information</h3>
                  <p>We may automatically collect certain information when you visit our website:</p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>IP address and browser type</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website addresses</li>
                    <li>Device information</li>
                  </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>3. How We Use Your Information</h2>
                  <p>We use the information we collect to:</p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>Process and manage your bookings</li>
                    <li>Communicate with you about your bookings and our services</li>
                    <li>Improve our website and services</li>
                    <li>Send you marketing communications (with your consent)</li>
                    <li>Comply with legal obligations</li>
                    <li>Prevent fraud and ensure security</li>
                  </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>4. Information Sharing and Disclosure</h2>
                  <p>We do not sell your personal information. We may share your information with:</p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>Service providers who assist us in operating our website and conducting our business</li>
                    <li>Payment processors to handle transactions</li>
                    <li>Legal authorities when required by law</li>
                    <li>Business partners with your explicit consent</li>
                  </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>5. Data Security</h2>
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal information. 
                    However, no method of transmission over the Internet or electronic storage is 100% secure.
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>6. Your Rights (GDPR & POPIA)</h2>
                  <p>Under GDPR and POPIA, you have the right to:</p>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    <li>Access your personal data</li>
                    <li>Rectify inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Object to processing of your data</li>
                    <li>Data portability</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                  <p style={{ marginTop: "1rem" }}>
                    To exercise these rights, please contact us at{' '}
                    <a href="mailto:info@unicabtravel.co.za" style={{ color: "var(--accent-gold)" }}>
                      info@unicabtravel.co.za
                    </a>
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>7. Cookies</h2>
                  <p>
                    We use cookies to enhance your experience on our website. For more information, 
                    please see our{' '}
                    <Link to="/cookie-policy" style={{ color: "var(--accent-gold)" }}>
                      Cookie Policy
                    </Link>.
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>8. Children's Privacy</h2>
                  <p>
                    Our services are not directed to individuals under the age of 18. 
                    We do not knowingly collect personal information from children.
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>9. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. 
                    We will notify you of any changes by posting the new policy on this page 
                    and updating the "Last updated" date.
                  </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                  <h2 style={{ marginBottom: "1rem" }}>10. Contact Us</h2>
                  <p>
                    If you have questions about this Privacy Policy, please contact us:
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

export default PrivacyPolicy;






