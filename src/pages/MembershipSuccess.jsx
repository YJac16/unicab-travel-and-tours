import React, { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { membershipPlans } from "../data";
import { confirmYocoPayment } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

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
        <section className="section checkout-page">
          <div className="container">
            <div className="checkout-shell checkout-status">
              <p className="checkout-eyebrow">Membership</p>
              <h1 className="checkout-title">
                {status === "confirming"
                  ? "Confirming membership"
                  : status === "error"
                    ? "Almost there"
                    : "Welcome to UNICAB"}
              </h1>
              <p className="checkout-lead">
                {status === "confirming"
                  ? "Activating your prepaid month after YOCO payment."
                  : status === "error"
                    ? transaction?.error ||
                      "We could not auto-confirm yet. If you paid, your plan will activate shortly via webhook — or open Membership in your hub."
                    : "Your prepaid monthly membership is active. It does not auto-renew — pay again before the period ends to continue."}
              </p>

              {transaction && status !== "confirming" && (
                <div className="checkout-panel" style={{ textAlign: "left" }}>
                  <h2>Membership details</h2>
                  <div className="checkout-rows">
                    <div className="checkout-row">
                      <span>Plan</span>
                      <strong>{transaction.planName}</strong>
                    </div>
                    <div className="checkout-row">
                      <span>Amount</span>
                      <strong>{transaction.amount}</strong>
                    </div>
                    <div className="checkout-row">
                      <span>Reference</span>
                      <strong>{transaction.id}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-actions" style={{ justifyContent: "center" }}>
                <Link to="/member/subscriptions" className="btn btn-primary">
                  Membership hub
                </Link>
                <Link to="/tours" className="btn btn-outline">
                  Explore tours
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MembershipSuccess;
