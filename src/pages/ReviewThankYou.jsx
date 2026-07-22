import React from "react";
import { Link, useLocation } from "react-router-dom";
import BackToTop from "../components/BackToTop";

function ReviewThankYou() {
  const location = useLocation();
  const reviewData = location.state?.review || {};

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>
        </div>
      </header>

      <main>
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "4rem", minHeight: "70vh" }}>
          <div className="container">
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
              <div style={{
                fontSize: "4rem",
                color: "var(--accent-teal)",
                marginBottom: "1.5rem"
              }}>
                ✓
              </div>
              
              <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Thank You for Your Review!</h1>
              
              <p style={{ fontSize: "1.1rem", color: "var(--text-soft)", marginBottom: "2rem", lineHeight: "1.6" }}>
                Your review has been submitted successfully and sent to our team. We appreciate your feedback and will review it shortly.
              </p>

              {reviewData.targetName && (
                <div style={{
                  background: "var(--bg-soft)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)",
                  marginBottom: "2rem"
                }}>
                  <p style={{ margin: "0.5rem 0", fontSize: "0.95rem", color: "var(--text-soft)" }}>
                    <strong>Review for:</strong> {reviewData.targetName}
                  </p>
                  {reviewData.rating && (
                    <p style={{ margin: "0.5rem 0", fontSize: "0.95rem", color: "var(--text-soft)" }}>
                      <strong>Rating:</strong> {reviewData.rating}/5
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontSize: "0.95rem", color: "var(--text-soft)" }}>
                  Your review helps us improve our services and helps other travelers make informed decisions.
                </p>
              </div>

              <Link to="/" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                Return to Home
              </Link>
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default ReviewThankYou;










