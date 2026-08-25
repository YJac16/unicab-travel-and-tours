import React from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { membershipPlans } from "../data";
import { siteConfig } from "../config";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * Membership pricing is pending confirmation — do not charge hardcoded ZAR amounts.
 * This route collects an enquiry instead of starting YOCO checkout.
 */
function MembershipTransaction() {
  const { planId } = useParams();
  const plan = membershipPlans.find((p) => p.id === planId);

  if (!plan) {
    return <Navigate to="/membership" replace />;
  }

  const waUrl = `${siteConfig.whatsapp.link}?text=${encodeURIComponent(
    `Hello, I'd like to enquire about the UNICAB ${plan.name} membership.`
  )}`;

  return (
    <>
      <DocumentTitle
        title={`${plan.name} membership`}
        description={`Enquire about the UNICAB ${plan.name} membership option.`}
      />
      <PublicHeader />

      <main>
        <section className="section page-section">
          <div className="container section-inner" style={{ maxWidth: 640 }}>
            <Link to="/membership/comparison" className="btn btn-outline btn-compact" style={{ marginBottom: "1.5rem" }}>
              ← Compare options
            </Link>
            <p className="eyebrow">Membership enquiry</p>
            <h1>{plan.name}</h1>
            <p className="tour-price">{plan.price}</p>
            <p className="section-intro">
              Membership rates are confirmed directly with our team. Share your details and we will follow up with suitability and pricing.
            </p>
            <ul className="tour-highlights" style={{ marginBottom: "1.5rem" }}>
              {plan.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="card-actions">
              <Link className="btn btn-primary" to="/#contact">
                Contact us
              </Link>
              <a className="btn btn-grey" href={waUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <Link className="btn btn-outline" to="/membership">
                Back
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default MembershipTransaction;
