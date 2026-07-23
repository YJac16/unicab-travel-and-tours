import React, { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { membershipPlans } from "../data";
import { confirmYocoPayment } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import BackToTop from "../components/BackToTop";

function MembershipSuccess() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState("confirming");
  const [transaction, setTransaction] = useState(location.state?.transaction || null);

  const tier = searchParams.get("tier") || transaction?.planId;
  const plan = membershipPlans.find((p) => p.id === tier);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!tier || !user?.id) {
        if (plan) {
          setTransaction({
            planId: plan.id,
            planName: plan.name,
            amount: plan.price,
            id: searchParams.get("checkoutId") || "pending",
          });
          setStatus("ready");
        } else {
          setStatus("ready");
        }
        return;
      }

      const { data, error } = await confirmYocoPayment(null, {
        kind: "subscription",
        tier,
        userId: user.id,
        checkoutId: searchParams.get("checkoutId") || undefined,
      });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        setTransaction({
          planId: plan?.id,
          planName: plan?.name || tier,
          amount: plan?.price,
          id: searchParams.get("checkoutId") || "—",
          error: error.message,
        });
        return;
      }

      setTransaction({
        planId: plan?.id || tier,
        planName: plan?.name || tier,
        amount: plan?.price,
        id: data?.id || searchParams.get("checkoutId") || "active",
        customer: { email: user.email },
      });
      setStatus("ready");
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [tier, user?.id]);

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
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
              <div style={{
                fontSize: "4rem",
                color: status === "error" ? "#b00020" : "var(--accent-teal)",
                marginBottom: "1.5rem"
              }}>
                {status === "confirming" ? "…" : status === "error" ? "!" : "✓"}
              </div>

              <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
                {status === "confirming"
                  ? "Confirming membership…"
                  : status === "error"
                    ? "Almost there"
                    : "Welcome to UNICAB!"}
              </h1>

              <p style={{ fontSize: "1.1rem", color: "var(--text-soft)", marginBottom: "2rem" }}>
                {status === "confirming"
                  ? "Activating your plan after YOCO payment."
                  : status === "error"
                    ? transaction?.error || "We could not auto-confirm yet. If you paid, your plan will activate shortly via webhook — or open Membership in your hub."
                    : "Your membership has been successfully activated."}
              </p>

              {transaction && status !== "confirming" && (
                <div style={{
                  background: "var(--bg-soft)",
                  padding: "2rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)",
                  marginBottom: "2rem",
                  textAlign: "left"
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Membership Details</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--text-soft)" }}>Plan:</span>
                    <strong>{transaction.planName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--text-soft)" }}>Amount:</span>
                    <strong>{transaction.amount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-soft)" }}>Reference:</span>
                    <strong style={{ fontSize: "0.9rem" }}>{transaction.id}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/member/subscriptions" className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Membership hub
                </Link>
                <Link to="/tours" className="btn btn-outline" style={{ textDecoration: "none" }}>
                  Explore Tours
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

export default MembershipSuccess;
