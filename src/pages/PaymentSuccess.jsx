import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { confirmYocoPayment } from "../lib/api";
import DocumentTitle from "../components/DocumentTitle";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingRef = searchParams.get("bookingRef");
  const [confirming, setConfirming] = useState(!!bookingRef);
  const [confirmFailed, setConfirmFailed] = useState(false);

  useEffect(() => {
    const confirm = async () => {
      if (!bookingRef) {
        setConfirming(false);
        return;
      }

      try {
        const result = await confirmYocoPayment(bookingRef);
        if (result?.error) {
          setConfirmFailed(true);
        }
      } catch (error) {
        console.warn("Payment confirm fallback failed (webhook may still update):", error);
        setConfirmFailed(true);
      } finally {
        setConfirming(false);
        navigate(`/booking-confirmation?bookingRef=${encodeURIComponent(bookingRef)}`, {
          replace: true,
        });
      }
    };

    confirm();
  }, [bookingRef, navigate]);

  return (
    <div>
      <DocumentTitle title="Payment successful" description="UNICAB payment confirmation." />
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
              <h1 className="checkout-title">
                {confirming
                  ? "Confirming your payment"
                  : confirmFailed
                    ? "Payment received"
                    : "Payment successful"}
              </h1>
              <p className="checkout-lead">
                {confirming
                  ? "Please wait while we finalize your booking."
                  : confirmFailed
                    ? "YOCO reported success. If confirmation takes a moment, your booking page will show reserved until payment status updates."
                    : "Your YOCO payment was received."}
              </p>
              {bookingRef && (
                <div className="checkout-actions" style={{ justifyContent: "center" }}>
                  <Link
                    className="btn btn-primary"
                    to={`/booking-confirmation?bookingRef=${encodeURIComponent(bookingRef)}`}
                  >
                    View confirmation
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PaymentSuccess;
