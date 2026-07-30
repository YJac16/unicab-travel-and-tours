import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { membershipPlans } from "../data";

function MembershipComparison() {
  const navigate = useNavigate();

  const handleSelectPlan = (planId) => {
    navigate(`/membership/transaction/${planId}`);
  };

  // Find the recommended plan (middle one - Frequent Traveller)
  const recommendedPlanId = "frequent";

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
        <section className="section membership" style={{ paddingTop: "clamp(6rem, 12vw, 8rem)", paddingBottom: "clamp(3rem, 6vw, 4rem)" }}>
          <div className="container">
            <header className="section-header center" style={{ marginBottom: "clamp(2rem, 4vw, 3rem)" }}>
              <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Choose Your Plan</p>
              <h2 style={{ marginBottom: "1rem" }}>Compare Membership Tiers</h2>
              <p className="section-intro max-720" style={{ margin: "0 auto" }}>
                Select the membership plan that best fits your travel needs. All plans include exclusive benefits and priority access to our premium services.
              </p>
            </header>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", 
              gap: "clamp(1.5rem, 3vw, 2rem)",
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 clamp(0.5rem, 2vw, 1rem)"
            }}>
              {membershipPlans.map((plan, index) => {
                const isRecommended = plan.id === recommendedPlanId;
                
                return (
                  <article 
                    key={plan.id} 
                    className="card soft" 
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      border: isRecommended ? "2px solid var(--accent-gold)" : "1px solid var(--border-soft)",
                      borderRadius: "16px",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      boxShadow: isRecommended 
                        ? "0 12px 32px rgba(201, 169, 97, 0.25)" 
                        : "0 4px 16px rgba(0, 0, 0, 0.08)",
                      background: "white"
                    }}
                  >
                    <div className="card-header" style={{ 
                      textAlign: "center", 
                      padding: "2rem 1.5rem 1.5rem",
                      background: isRecommended ? "linear-gradient(180deg, rgba(201, 169, 97, 0.08) 0%, transparent 100%)" : "transparent",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}>
                      <h3 className="card-title" style={{ 
                        fontSize: "clamp(1.4rem, 3vw, 1.6rem)", 
                        marginBottom: "0.75rem",
                        marginTop: 0,
                        fontWeight: "700",
                        color: "var(--text-main)"
                      }}>
                        {plan.name}
                      </h3>
                      {isRecommended && (
                        <div style={{
                          display: "block",
                          background: "linear-gradient(135deg, var(--accent-gold-bright), var(--accent-gold))",
                          color: "white",
                          padding: "0.4rem 1rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          boxShadow: "0 4px 12px rgba(201, 169, 97, 0.4)",
                          marginBottom: "0.75rem",
                          width: "fit-content"
                        }}>
                          Most Popular
                        </div>
                      )}
                      <div style={{ 
                        fontSize: "clamp(2rem, 4vw, 2.5rem)", 
                        fontWeight: "700", 
                        color: "var(--accent-gold)",
                        marginBottom: "1rem",
                        lineHeight: "1.2"
                      }}>
                        {plan.price}
                      </div>
                      {plan.tagline && (
                        <p style={{ 
                          fontSize: "0.9rem", 
                          color: "var(--text-soft)", 
                          marginBottom: "1rem",
                          fontWeight: "500"
                        }}>
                          {plan.tagline}
                        </p>
                      )}
                      {plan.shortDescription && (
                        <p style={{ 
                          fontSize: "0.9rem", 
                          color: "var(--text-soft)", 
                          marginBottom: "0",
                          lineHeight: "1.6",
                          textAlign: "center",
                          padding: "0 0.5rem"
                        }}>
                          {plan.shortDescription}
                        </p>
                      )}
                    </div>

                    <div className="card-body" style={{ 
                      flex: "1",
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      <ul style={{ 
                        listStyle: "none", 
                        padding: 0,
                        margin: 0,
                        flex: "1"
                      }}>
                        {plan.benefits.map((benefit, idx) => (
                          <li 
                            key={idx} 
                            style={{ 
                              padding: "0.875rem 0",
                              borderBottom: idx < plan.benefits.length - 1 ? "1px solid var(--border-soft)" : "none",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem"
                            }}
                          >
                            <span style={{ 
                              color: "var(--accent-gold)", 
                              fontSize: "1.1rem",
                              lineHeight: "1.4",
                              flexShrink: 0,
                              marginTop: "0.1rem",
                              fontWeight: "600"
                            }}>✓</span>
                            <span style={{ 
                              fontSize: "0.9rem", 
                              lineHeight: "1.6",
                              color: "var(--text-main)"
                            }}>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="card-footer" style={{ 
                      padding: "1.5rem",
                      borderTop: "1px solid var(--border-soft)",
                      background: isRecommended ? "var(--accent-gold-light)" : "transparent"
                    }}>
                      <button 
                        className={isRecommended ? "btn btn-primary" : "btn btn-outline"}
                        onClick={() => handleSelectPlan(plan.id)}
                        style={{ 
                          width: "100%",
                          fontSize: "0.95rem",
                          padding: "0.9rem 1.5rem",
                          fontWeight: "600",
                          letterSpacing: "0.05em"
                        }}
                      >
                        {isRecommended ? "Get Started" : "Select Plan"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div style={{ 
              marginTop: "clamp(2rem, 4vw, 3rem)", 
              textAlign: "center",
              padding: "clamp(1.5rem, 3vw, 2rem)",
              background: "var(--bg-soft)",
              borderRadius: "12px",
              border: "1px solid var(--border-soft)",
              maxWidth: "900px",
              marginLeft: "auto",
              marginRight: "auto"
            }}>
              <p style={{ 
                fontSize: "0.85rem", 
                color: "var(--text-soft)", 
                margin: 0,
                lineHeight: "1.7"
              }}>
                <strong style={{ color: "var(--text-main)" }}>Disclaimer:</strong> Membership benefits apply while subscription is active. Discounts exclude third-party entrance fees, activities, and seasonal surcharges unless stated otherwise. All services are subject to availability.
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

export default MembershipComparison;

