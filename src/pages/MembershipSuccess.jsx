import React from "react";
import { Link, useLocation } from "react-router-dom";
import BackToTop from "../components/BackToTop";

function MembershipSuccess() {
  const location = useLocation();
  const transaction = location.state?.transaction;

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
              
              <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Welcome to UNICAB!</h1>
              
              <p style={{ fontSize: "1.1rem", color: "var(--text-soft)", marginBottom: "2rem" }}>
                Your membership has been successfully activated.
              </p>

              {transaction && (
                <div style={{
                  background: "var(--bg-soft)",
                  padding: "2rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)",
                  marginBottom: "2rem",
                  textAlign: "left"
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Membership Details</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--text-soft)" }}>Plan:</span>
                    <strong>{transaction.planName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--text-soft)" }}>Amount:</span>
                    <strong>{transaction.amount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--text-soft)" }}>Status:</span>
                    <strong style={{ color: "var(--accent-teal)" }}>Active</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-soft)" }}>Transaction ID:</span>
                    <strong style={{ fontSize: "0.9rem" }}>{transaction.id}</strong>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontSize: "0.95rem", color: "var(--text-soft)" }}>
                  A confirmation email has been sent to {transaction?.customer?.email || "your email address"} with your membership details and next steps.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/tours" className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Explore Tours
                </Link>
                <Link to="/" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  Back to Home
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

export default MembershipSuccess;










