import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { membershipPlans } from "../data";
import { createYocoPayment } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

const TIER_CENTS = {
  explorer: 29900,
  frequent: 89900,
  elite: 250000,
};

function MembershipTransaction() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const plan = membershipPlans.find((p) => p.id === planId);
  const cancelled = searchParams.get("cancelled") === "1";

  useEffect(() => {
    if (!plan) navigate("/membership/comparison");
  }, [plan, navigate]);

  if (!plan) return null;

  const handlePay = async () => {
    setError("");
    if (!user?.id) {
      navigate(`/login?redirect=${encodeURIComponent(`/membership/transaction/${plan.id}`)}`);
      return;
    }

    setSubmitting(true);
    const { data, error: payError } = await createYocoPayment(TIER_CENTS[plan.id], null, {
      kind: "subscription",
      tier: plan.id,
      userId: user.id,
      description: `UNICAB ${plan.name} membership`,
    });
    setSubmitting(false);

    if (payError || !data?.redirectUrl) {
      setError(payError?.message || "Could not start checkout. Please try again.");
      return;
    }

    window.location.href = data.redirectUrl;
  };

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>
          <nav className="main-nav" aria-label="Primary">
            <ul>
              <li>
                <Link className="link-button" to="/membership">
                  Membership
                </Link>
              </li>
              <li className="cta-nav">
                <Link className="btn btn-primary btn-compact" to="/book">
                  Book Now
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="section checkout-page">
          <div className="container">
            <div className="checkout-shell">
              <Link to="/membership/comparison" className="btn btn-outline checkout-back">
                ← Compare plans
              </Link>

              <p className="checkout-eyebrow">Membership checkout</p>
              <h1 className="checkout-title">{plan.name}</h1>
              <p className="checkout-price">{plan.price}</p>
              <p className="checkout-lead">
                Billed monthly as a prepaid month — not auto-renewing. Pay once with YOCO for the next calendar month of benefits.
              </p>

              {cancelled && (
                <div className="checkout-alert">
                  Checkout was cancelled. You can try again when ready.
                </div>
              )}

              <div className="checkout-panel">
                <h2>Included</h2>
                <ul className="checkout-benefits">
                  {plan.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>

                {authLoading ? (
                  <p className="checkout-note">Checking sign-in…</p>
                ) : !user ? (
                  <div>
                    <p className="checkout-note">
                      Sign in to continue to secure YOCO checkout for this membership.
                    </p>
                    <Link
                      className="btn btn-primary"
                      to={`/login?redirect=${encodeURIComponent(`/membership/transaction/${plan.id}`)}`}
                    >
                      Sign in to pay
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="checkout-note">
                      Paying as <strong>{user.email}</strong>. You will be redirected to YOCO to complete payment.
                    </p>
                    {error && (
                      <p className="checkout-field-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handlePay}
                      disabled={submitting}
                      style={{ width: "100%", padding: "1rem" }}
                    >
                      {submitting ? "Starting checkout…" : `Pay ${plan.price} with YOCO`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MembershipTransaction;
