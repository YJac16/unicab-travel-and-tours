import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { membershipPlans } from "../data";

function Membership() {
  const navigate = useNavigate();
  
  const handleJoin = () => {
    navigate("/membership/comparison");
  };

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>

          <nav className="main-nav" aria-label="Primary">
            <ul>
              <li>
                <Link className="link-button" to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/tours">
                  Tours
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/vehicles">
                  Vehicles
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/drivers">
                  Drivers
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/reviews">
                  Reviews
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/membership">
                  Membership
                </Link>
              </li>
              <li>
                <Link 
                  className="link-button" 
                  to="/"
                  onClick={() => {
                    setTimeout(() => {
                      const aboutSection = document.getElementById('about');
                      if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  className="link-button" 
                  to="/"
                  onClick={() => {
                    setTimeout(() => {
                      const contactSection = document.getElementById('contact');
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                >
                  Contact
                </Link>
              </li>
              <li className="cta-nav">
                <Link 
                  className="btn btn-primary btn-compact" 
                  to="/book"
                 
                >
                  Book Now
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="section membership" style={{ paddingTop: "8rem" }}>
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Membership</p>
              <h2>Exclusive Travel Benefits</h2>
              <p className="section-intro max-720">
                Join our membership program for priority booking, special rates, and exclusive access to premium
                experiences. Choose the plan that best suits your travel needs.
              </p>
            </header>

            <div className="cards-grid" aria-live="polite">
              {membershipPlans.map((plan) => (
                <article className="card soft" key={plan.id}>
                  <div className="card-header">
                    <h3 className="card-title">{plan.name}</h3>
                    <span className="badge badge-gold">{plan.price}</span>
                  </div>
                  {plan.shortDescription && (
                    <p style={{ 
                      fontSize: "0.9rem", 
                      color: "var(--text-soft)", 
                      marginBottom: "1rem",
                      lineHeight: "1.6"
                    }}>
                      {plan.shortDescription}
                    </p>
                  )}
                  <ul className="card-body">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="card-footer">
                    <button className="btn btn-primary" onClick={handleJoin}>
                      Join Now
                    </button>
                  </div>
                </article>
              ))}
            </div>
            
            <div style={{ 
              marginTop: "3rem", 
              textAlign: "center",
              paddingTop: "2rem",
              borderTop: "1px solid var(--border-soft)"
            }}>
              <p style={{ 
                fontSize: "0.85rem", 
                color: "var(--text-soft)", 
                lineHeight: "1.6",
                maxWidth: "800px",
                margin: "0 auto"
              }}>
                Membership benefits apply while subscription is active. Discounts exclude third-party entrance fees, activities, and seasonal surcharges unless stated otherwise. All services are subject to availability.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            &copy; <span>{new Date().getFullYear()}</span> UNICAB Travel &amp; Tours. All rights reserved.
          </p>
          <p className="footer-meta">Premium private transfers &amp; tours in Cape Town and the Western Cape.</p>
          <div className="footer-contact" style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-soft)" }}>
            <p style={{ margin: "0.25rem 0" }}>
              <a href="mailto:info@unicabtravel.co.za" style={{ color: "var(--accent-gold)", textDecoration: "none", marginRight: "1rem" }}>
                info@unicabtravel.co.za
              </a>
              <a
                href="https://wa.me/+27822818105"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-gold)", textDecoration: "none", marginRight: "1rem" }}
              >
                +27 82 281 8105
              </a>
              <a
                href="https://www.unicab.co.za/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-gold)", textDecoration: "none" }}
              >
                Cab &amp; Staff Transport
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Membership;

