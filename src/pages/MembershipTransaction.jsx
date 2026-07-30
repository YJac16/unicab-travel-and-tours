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
  const { user, loading: authLoading } = useAuth();  const [submitting, setSubmitting] = useState(false);
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
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
          <div className="container" style={{ maxWidth: 560 }}>
            <header className="section-header" style={{ marginBottom: "2rem" }}>
              <p className="eyebrow">Checkout</p>
              <h1 style={{ marginBottom: "0.5rem" }}>{plan.name}</h1>
              <p style={{ color: "var(--text-soft)", fontSize: "1.25rem", margin: 0 }}>{plan.price}</p>
            </header>

            {cancelled && (
              <p style={{ color: "var(--accent-gold)", marginBottom: "1rem" }}>
                Checkout was cancelled. You can try again when ready.
              </p>
            )}

            <ul style={{ marginBottom: "1.5rem", paddingLeft: "1.25rem", color: "var(--text-soft)" }}>
              {plan.benefits.map((b) => (
                <li key={b} style={{ marginBottom: "0.4rem" }}>
                  {b}
                </li>
              ))}
            </ul>

            {authLoading ? (
              <p>Checking sign-in…</p>
            ) : !user ? (
              <div>
                <p style={{ color: "var(--text-soft)", marginBottom: "1rem" }}>
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
                <p style={{ color: "var(--text-soft)", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  Paying as <strong>{user.email}</strong>. You will be redirected to YOCO to complete payment.
                </p>
                {error && (
                  <p style={{ color: "#b00020", marginBottom: "1rem" }} role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePay}
                  disabled={submitting}
                >
                  {submitting ? "Starting checkout…" : `Pay ${plan.price} with YOCO`}
                </button>
              </div>
            )}

            <p style={{ marginTop: "2rem" }}>
              <Link to="/membership/comparison">← Compare plans</Link>
            </p>
          </div>
        </section>
      </main>    </div>
  );
}

export default MembershipTransaction;
