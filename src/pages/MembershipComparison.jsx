import React from "react";
import { Link } from "react-router-dom";
import { membershipPlans } from "../data";
import { siteConfig } from "../config";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SiteFooter from "../components/SiteFooter";

function MembershipComparison() {
  return (
    <>
      <DocumentTitle
        title="Compare membership"
        description="Compare UNICAB membership options for returning travellers and corporate partners."
      />
      <PublicHeader />

      <main>
        <section className="section page-section">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Membership</p>
              <h1>Compare options</h1>
              <p className="section-intro max-720">
                Review the focus of each membership option, then contact us for current rates and suitability.
              </p>
            </header>

            <div className="cards-grid">
              {membershipPlans.map((plan) => (
                <article className={`card soft${plan.popular ? " plan-popular" : ""}`} key={plan.id}>
                  <div className="card-header">
                    <h2 className="card-title">{plan.name}</h2>
                    <span className="badge badge-gold">{plan.price}</span>
                  </div>
                  <p className="card-meta">{plan.tagline}</p>
                  <p className="card-meta">{plan.shortDescription}</p>
                  <ul className="card-body">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="card-footer card-actions">
                    <Link className="btn btn-primary" to="/#contact">
                      Enquire
                    </Link>
                    <a
                      className="btn btn-outline"
                      href={siteConfig.whatsapp.linkWithMessage}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="section-cta">
              <Link to="/membership" className="btn btn-outline">
                Back to membership
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default MembershipComparison;
