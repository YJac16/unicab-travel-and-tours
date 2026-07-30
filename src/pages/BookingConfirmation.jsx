import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { formatTourPrice } from "../lib/api";

/**
 * Booking confirmation — loads booking from custom Supabase system
 */
function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const bookingRef = searchParams.get("bookingRef") || location.state?.bookingId;
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!!bookingRef && !location.state?.booking);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!bookingRef || booking) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/bookings/${bookingRef}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Booking not found");
        }
        setBooking(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingRef, booking]);

  const paymentStatus = String(booking?.payment_status || "").toLowerCase();
  const isPaid = paymentStatus === "paid";
  const isPending = !booking
    ? false
    : !isPaid && ["unpaid", "pending", "failed", ""].includes(paymentStatus);

  const title = loading
    ? "Loading your booking..."
    : isPaid
      ? "Booking Confirmed"
      : booking
        ? "Booking Reserved"
        : "Booking Status";

  const subtitle = loading
    ? "Please wait while we load your details."
    : isPaid
      ? "Thank you for booking with UNICAB Travel & Tours. A confirmation email will follow shortly."
      : booking
        ? "Your reservation is saved, but payment is not confirmed yet. If you just paid, refresh in a moment or contact us with your reference."
        : "We could not load this booking yet.";

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
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
          <div className="container">
            <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
              <div
                style={{
                  fontSize: "3.5rem",
                  color: isPaid ? "var(--accent-teal)" : "var(--accent-gold)",
                  marginBottom: "1rem",
                }}
              >
                {isPaid ? "✓" : "…"}
              </div>
              <h1 style={{ marginBottom: "0.75rem" }}>{title}</h1>
              <p style={{ color: "var(--text-soft)", marginBottom: "2rem" }}>{subtitle}</p>

              {loading && <p>Loading booking details...</p>}
              {error && <p style={{ color: "#e74c3c" }}>{error}</p>}

              {booking && (
                <div
                  style={{
                    textAlign: "left",
                    background: "var(--bg-soft)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  <p>
                    <strong>Reference:</strong> {booking.id}
                  </p>
                  <p>
                    <strong>Status:</strong> {booking.status}
                  </p>
                  <p>
                    <strong>Payment:</strong> {booking.payment_status || "unknown"}
                  </p>
                  {booking.tour?.name && (
                    <p>
                      <strong>Tour:</strong> {booking.tour.name}
                    </p>
                  )}
                  {booking.booking_date && (
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(booking.booking_date).toLocaleDateString("en-ZA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  {booking.group_size && (
                    <p>
                      <strong>Guests:</strong> {booking.group_size}
                    </p>
                  )}
                  {booking.customer_name && (
                    <p>
                      <strong>Guest:</strong> {booking.customer_name}
                    </p>
                  )}
                  {booking.total_price != null && (
                    <p>
                      <strong>{isPaid ? "Total paid" : "Total due"}:</strong>{" "}
                      {formatTourPrice(booking.total_price)}
                    </p>
                  )}
                  {booking.payment_reference && (
                    <p>
                      <strong>Payment ref:</strong> {booking.payment_reference}
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                {isPending && bookingRef && (
                  <Link
                    to={`/payment-failed?bookingRef=${encodeURIComponent(bookingRef)}`}
                    className="btn btn-primary"
                    style={{ textDecoration: "none" }}
                  >
                    Complete Payment
                  </Link>
                )}
                <Link to="/book" className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Book Now
                </Link>
                <Link to="/" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BookingConfirmation;
