import React from "react";
import { Link } from "react-router-dom";
import { membershipPlans } from "../data";
import { siteConfig } from "../config";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SiteFooter from "../components/SiteFooter";

function Membership() {
  return (
    <>
      <DocumentTitle
        title="Membership"
        description="UNICAB membership options for returning travellers and corporate partners in Cape Town."
      />
      <PublicHeader />

      <main>
        <section className="section membership page-section">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Membership</p>
              <h1>Travel support for returning guests</h1>
              <p className="section-intro max-720">
                Membership options for frequent travellers and hospitality or corporate partners. Contact us for current rates and suitability.
              </p>
            </header>

            <div className="cards-grid">
              {membershipPlans.map((plan) => (
                <article className="card soft" key={plan.id}>
                  <div className="card-header">
                    <h2 className="card-title">{plan.name}</h2>
                    <span className="badge badge-gold">{plan.price}</span>
                  </div>
                  {plan.tagline && <p className="card-meta">{plan.tagline}</p>}
                  {plan.shortDescription && <p className="card-meta">{plan.shortDescription}</p>}
                  <ul className="card-body">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="card-footer">
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

            <p className="membership-disclaimer">
              Membership availability and benefits are confirmed directly with our team. All services remain subject to availability.
            </p>

            <div className="section-cta">
              <Link to="/membership/comparison" className="btn btn-outline">
                Compare options
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default Membership;
