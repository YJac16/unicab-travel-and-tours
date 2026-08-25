import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createYocoPayment } from "../lib/api";
import { siteConfig } from "../config";
import DocumentTitle from "../components/DocumentTitle";

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
      <DocumentTitle title="Payment not completed" description="Retry or complete your UNICAB payment." />
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>
        </div>
      </header>

      <main>
        <section className="section checkout-page">
          <div className="container">
            <div className="checkout-shell checkout-status">
              <p className="checkout-eyebrow">Payment</p>
              <h1 className="checkout-title">Payment not completed</h1>
              <p className="checkout-lead">
                Your payment was not completed. If nothing was charged, you can try again below.
              </p>

              {bookingRef && (
                <div className="checkout-panel" style={{ textAlign: "left" }}>
                  <div className="checkout-rows">
                    <div className="checkout-row">
                      <span>Booking reference</span>
                      <strong>{bookingRef}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-alert" style={{ textAlign: "left" }}>
                Your reservation is still saved. Retry payment, or contact us to complete the booking.
              </div>

              {retryError && <p className="checkout-field-error">{retryError}</p>}

              <div className="checkout-actions" style={{ justifyContent: "center" }}>
                {bookingRef && (
                  <button
                    type="button"
                    onClick={handleRetryPayment}
                    className="btn btn-primary"
                    disabled={retrying}
                  >
                    {retrying ? "Starting payment..." : "Try payment again"}
                  </button>
                )}
                <Link to="/tours" className="btn btn-outline">
                  Browse tours
                </Link>
                <Link to="/" className="btn btn-outline">
                  Return home
                </Link>
              </div>

              <p className="checkout-note" style={{ marginTop: "2rem" }}>
                Need help?{" "}
                <a href={siteConfig.whatsapp.linkWithMessage} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>{" "}
                or{" "}
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
                {bookingRef ? ` — mention booking ${bookingRef}.` : "."}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PaymentFailed;
