import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import BackToTop from "../components/BackToTop";

function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingRef = searchParams.get('bookingRef');

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
            <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
              <div style={{
                fontSize: "4rem",
                color: "#e74c3c",
                marginBottom: "1.5rem"
              }}>
                ✗
              </div>
              
              <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Payment Not Completed</h1>
              
              <p style={{ fontSize: "1.1rem", color: "var(--text-soft)", marginBottom: "2rem" }}>
                Your payment was not processed. No money has been deducted from your account.
              </p>

              {bookingRef && (
                <div style={{
                  background: "var(--bg-soft)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)",
                  marginBottom: "2rem"
                }}>
                  <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.9rem" }}>
                    <strong>Booking Reference:</strong> {bookingRef}
                  </p>
                </div>
              )}

              <div style={{
                background: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "2rem",
                textAlign: "left"
              }}>
                <p style={{ margin: 0, color: "#856404", fontSize: "0.95rem" }}>
                  <strong>Don't worry!</strong> Your booking reservation is still saved. You can try again or contact us directly to complete your booking.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
                {bookingRef && (
                  <button
                    onClick={() => {
                      // Navigate back to checkout if we have booking reference
                      // In a real implementation, you might want to restore the booking state
                      navigate('/tours');
                    }}
                    className="btn btn-primary"
                  >
                    Try Payment Again
                  </button>
                )}
                <Link to="/tours" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  Browse Tours
                </Link>
                <Link to="/" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  Return Home
                </Link>
              </div>

              <div style={{
                background: "#d1ecf1",
                border: "1px solid #0c5460",
                borderRadius: "8px",
                padding: "1.5rem",
                textAlign: "left"
              }}>
                <p style={{ margin: 0, color: "#0c5460", fontSize: "0.95rem" }}>
                  <strong>Need Help?</strong> Contact us via WhatsApp or email and we'll be happy to assist you with your booking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default PaymentFailed;

