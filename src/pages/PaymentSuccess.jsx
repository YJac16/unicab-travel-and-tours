import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { confirmYocoPayment } from "../lib/api";
import BackToTop from "../components/BackToTop";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingRef = searchParams.get("bookingRef");
  const [confirming, setConfirming] = useState(!!bookingRef);

  useEffect(() => {
    const confirm = async () => {
      if (!bookingRef) {
        setConfirming(false);
        return;
      }

      try {
        await confirmYocoPayment(bookingRef);
      } catch (error) {
        console.warn("Payment confirm fallback failed (webhook may still update):", error);
      } finally {
        setConfirming(false);
        navigate(`/booking-confirmation?bookingRef=${encodeURIComponent(bookingRef)}`, { replace: true });
      }
    };

    confirm();
  }, [bookingRef, navigate]);

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
        <section className="section" style={{ paddingTop: "8rem", textAlign: "center" }}>
          <div className="container">
            <h1>{confirming ? "Confirming your payment..." : "Payment Successful"}</h1>
            <p style={{ color: "var(--text-soft)" }}>
              {confirming
                ? "Please wait while we finalize your booking."
                : "Your YOCO payment was received."}
            </p>
            {bookingRef && (
              <p style={{ marginTop: "1rem" }}>
                <Link className="btn btn-primary" to={`/booking-confirmation?bookingRef=${encodeURIComponent(bookingRef)}`}>
                  View Confirmation
                </Link>
              </p>
            )}
          </div>
        </section>
      </main>
      <BackToTop />
    </div>
  );
}

export default PaymentSuccess;
