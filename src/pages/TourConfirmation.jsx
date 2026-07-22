import React from "react";
import { Link, useLocation } from "react-router-dom";
import BackToTop from "../components/BackToTop";
import { siteConfig } from "../config";

function TourConfirmation() {
  const location = useLocation();
  const { booking, emailSent } = location.state || {};

  if (!booking) {
    return (
      <div>
        <main style={{ paddingTop: "8rem", textAlign: "center" }}>
          <div className="container">
            <h2>Booking Not Found</h2>
            <Link to="/tours" className="btn btn-primary" style={{ marginTop: "1rem", textDecoration: "none" }}>
              Browse Tours
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
                color: "var(--accent-teal)",
                marginBottom: "1.5rem"
              }}>
                ✓
              </div>
              
              <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Booking Confirmed!</h1>
              
              <p style={{ fontSize: "1.1rem", color: "var(--text-soft)", marginBottom: "2rem" }}>
                {emailSent 
                  ? `A confirmation email has been sent to ${booking.customer_email || booking.customer?.email} with your booking details.`
                  : "Your booking has been received. Please check your email for confirmation details."
                }
              </p>
              {booking.status === 'pending' && (
                <p style={{ 
                  fontSize: "0.95rem", 
                  color: "#856404", 
                  background: "#fff3cd",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "2rem"
                }}>
                  Your booking is pending confirmation. You will receive an email once it's confirmed.
                </p>
              )}

              <div style={{
                background: "var(--bg-soft)",
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                marginBottom: "2rem",
                textAlign: "left"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "1.5rem", textAlign: "center" }}>Booking Details</h3>
                
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ color: "var(--text-soft)" }}>Tour:</span>
                    <strong>{booking.tours?.name || booking.tourName || 'Tour'}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ color: "var(--text-soft)" }}>Date:</span>
                    <strong>{new Date(booking.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ color: "var(--text-soft)" }}>Group Size:</span>
                    <strong>{booking.group_size || booking.pax} {(booking.group_size || booking.pax) === 1 ? "person" : "people"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ color: "var(--text-soft)" }}>Driver:</span>
                    <strong>{booking.drivers?.name || booking.driverName || 'TBD'}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ color: "var(--text-soft)" }}>Price per person:</span>
                    <strong>R{parseFloat(booking.price_per_person || booking.pricePerPerson || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ color: "var(--text-soft)" }}>Total Amount:</span>
                    <strong style={{ fontSize: "1.2rem", color: "var(--accent-gold)" }}>R{parseFloat(booking.total_price || booking.totalPrice || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem" }}>
                    <span style={{ color: "var(--text-soft)" }}>Booking ID:</span>
                    <strong style={{ fontSize: "0.9rem", fontFamily: "monospace" }}>{booking.id}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem" }}>
                    <span style={{ color: "var(--text-soft)" }}>Status:</span>
                    <strong style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      background: booking.status === 'confirmed' ? '#d4edda' : '#fff3cd',
                      color: booking.status === 'confirmed' ? '#155724' : '#856404'
                    }}>{booking.status || 'pending'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontSize: "0.95rem", color: "var(--text-soft)" }}>
                  We look forward to providing you with an exceptional travel experience. If you have any questions, please contact us at{" "}
                  <a href={`mailto:${siteConfig.email}`} style={{ color: "var(--accent-gold)" }}>
                    {siteConfig.email}
                  </a>{" "}
                  or{" "}
                  <a href={siteConfig.whatsapp.link} style={{ color: "var(--accent-gold)" }}>
                    WhatsApp us
                  </a>.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/tours" className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Browse More Tours
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

export default TourConfirmation;

