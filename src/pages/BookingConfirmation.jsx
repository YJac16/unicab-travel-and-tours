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
    ? "Loading your booking"
    : isPaid
      ? "Booking confirmed"
      : booking
        ? "Booking reserved"
        : "Booking status";

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
        <section className="section checkout-page">
          <div className="container">
            <div className="checkout-shell checkout-status">
              <p className="checkout-eyebrow">{isPaid ? "Confirmed" : "Reservation"}</p>
              <h1 className="checkout-title">{title}</h1>
              <p className="checkout-lead">{subtitle}</p>

              {loading && <p className="checkout-note">Loading booking details…</p>}
              {error && <p className="checkout-field-error">{error}</p>}

              {booking && (
                <div className="checkout-panel" style={{ textAlign: "left" }}>
                  <div className="checkout-rows">
                    <div className="checkout-row">
                      <span>Reference</span>
                      <strong>{booking.id}</strong>
                    </div>
                    <div className="checkout-row">
                      <span>Status</span>
                      <strong>{booking.status}</strong>
                    </div>
                    <div className="checkout-row">
                      <span>Payment</span>
                      <strong>{booking.payment_status || "unknown"}</strong>
                    </div>
                    {booking.tour?.name && (
                      <div className="checkout-row">
                        <span>Tour</span>
                        <strong>{booking.tour.name}</strong>
                      </div>
                    )}
                    {booking.booking_date && (
                      <div className="checkout-row">
                        <span>Date</span>
                        <strong>
                          {new Date(booking.booking_date).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </strong>
                      </div>
                    )}
                    {booking.group_size && (
                      <div className="checkout-row">
                        <span>Guests</span>
                        <strong>{booking.group_size}</strong>
                      </div>
                    )}
                    {booking.customer_name && (
                      <div className="checkout-row">
                        <span>Guest</span>
                        <strong>{booking.customer_name}</strong>
                      </div>
                    )}
                    {booking.total_price != null && (
                      <div className="checkout-row checkout-row-total">
                        <span>{isPaid ? "Total paid" : "Total due"}</span>
                        <span>{formatTourPrice(booking.total_price)}</span>
                      </div>
                    )}
                    {booking.payment_reference && (
                      <div className="checkout-row">
                        <span>Payment ref</span>
                        <strong>{booking.payment_reference}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="checkout-actions" style={{ justifyContent: "center" }}>
                {isPending && bookingRef && (
                  <Link
                    to={`/payment-failed?bookingRef=${encodeURIComponent(bookingRef)}`}
                    className="btn btn-primary"
                  >
                    Complete payment
                  </Link>
                )}
                <Link to="/book" className="btn btn-primary">
                  Book now
                </Link>
                <Link to="/" className="btn btn-outline">
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
