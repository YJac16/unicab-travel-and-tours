import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createYocoPayment } from "../lib/api";
import { siteConfig } from "../config";

function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const bookingRef = searchParams.get("bookingRef");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);

  const handleRetryPayment = async () => {
    if (!bookingRef || retrying) return;
    setRetrying(true);
    setRetryError(null);

    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingRef)}`);
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Could not load your booking to retry payment.");
      }

      const booking = result.data;
      const amount = Number(booking.total_price);
      if (!amount || amount <= 0) {
        throw new Error("This booking has no payable amount. Please contact us.");
      }

      const amountInCents = Math.round(amount * 100);
      const tourName = booking.tour?.name || "Tour booking";
      const { data: payment, error: paymentError } = await createYocoPayment(
        amountInCents,
        bookingRef,
        { description: `${tourName} — retry payment` }
      );

      const redirectUrl = payment?.redirectUrl || payment?.data?.redirectUrl;
      if (paymentError || !redirectUrl) {
        throw new Error(
          paymentError?.message ||
            paymentError?.error ||
            "Failed to start YOCO checkout. Please try again or contact us."
        );
      }

      window.location.assign(redirectUrl);
    } catch (err) {
      setRetryError(err.message || "Unable to retry payment.");
      setRetrying(false);
    }
  };

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
              <div
                style={{
                  fontSize: "4rem",
                  color: "#e74c3c",
                  marginBottom: "1.5rem",
                }}
              >
                ✗
              </div>

              <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Payment Not Completed</h1>

              <p style={{ fontSize: "1.1rem", color: "var(--text-soft)", marginBottom: "2rem" }}>
                Your payment was not completed. If nothing was charged, you can try again below.
              </p>

              {bookingRef && (
                <div
                  style={{
                    background: "var(--bg-soft)",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border-soft)",
                    marginBottom: "2rem",
                  }}
                >
                  <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.9rem" }}>
                    <strong>Booking Reference:</strong> {bookingRef}
                  </p>
                </div>
              )}

              <div
                style={{
                  background: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  textAlign: "left",
                }}
              >
                <p style={{ margin: 0, color: "#856404", fontSize: "0.95rem" }}>
                  <strong>Don&apos;t worry!</strong> Your booking reservation is still saved. You can
                  try payment again or contact us directly to complete your booking.
                </p>
              </div>

              {retryError && (
                <p style={{ color: "#e74c3c", marginBottom: "1rem" }}>{retryError}</p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: "2rem",
                }}
              >
                {bookingRef && (
                  <button
                    type="button"
                    onClick={handleRetryPayment}
                    className="btn btn-primary"
                    disabled={retrying}
                  >
                    {retrying ? "Starting payment..." : "Try Payment Again"}
                  </button>
                )}
                <Link to="/tours" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  Browse Tours
                </Link>
                <Link to="/" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  Return Home
                </Link>
              </div>

              <div
                style={{
                  background: "#d1ecf1",
                  border: "1px solid #0c5460",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  textAlign: "left",
                }}
              >
                <p style={{ margin: 0, color: "#0c5460", fontSize: "0.95rem" }}>
                  <strong>Need Help?</strong> Contact us via{" "}
                  <a
                    href={siteConfig.whatsapp.linkWithMessage}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0c5460", fontWeight: 600 }}
                  >
                    WhatsApp
                  </a>{" "}
                  or{" "}
                  <a
                    href={`mailto:${siteConfig.email}`}
                    style={{ color: "#0c5460", fontWeight: 600 }}
                  >
                    {siteConfig.email}
                  </a>
                  {bookingRef ? ` and mention booking ${bookingRef}.` : "."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PaymentFailed;
