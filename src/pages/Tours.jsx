import React from "react";
import { Link } from "react-router-dom";
import { tours } from "../data";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";
import { whatsappEnquiryUrl } from "../config";

function Tours() {
  return (
    <>
      <DocumentTitle
        title="Private Tours"
        description="Private Cape Town and Western Cape tours with UNICAB — city, peninsula, winelands, safari days, and multi-day itineraries."
      />
      <PublicHeader />

      <main>
        <section className="section tours page-section">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Tours</p>
              <h1>Discover Cape Town &amp; beyond</h1>
              <p className="section-intro max-720">
                Explore the Western Cape with private tours tailored to your interests and schedule. Message us for a personalised quote.
              </p>
            </header>

            <div className="cards-grid">
              {tours.map((tour) => (
                <article key={tour.id} className="card tour-card soft">
                  {tour.image && (
                    <div className="tour-image-wrapper">
                      <SafeImage src={tour.image} alt={tour.name} className="tour-image" fallbackLabel={tour.name} />
                    </div>
                  )}
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">{tour.name}</h2>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="card-meta">
                      <span>{tour.duration}</span>
                    </p>
                    <p>{tour.description}</p>
                    {tour.highlights?.length > 0 && (
                      <ul className="tour-highlights">
                        {tour.highlights.slice(0, 3).map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="card-footer">
                    <span className="price">Quote on request</span>
                    <div className="card-actions">
                      <a
                        className="btn btn-primary btn-compact"
                        href={whatsappEnquiryUrl(`Hello, I'd like a quote for the UNICAB tour: ${tour.name}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                      <Link to={`/tours/${tour.id}`} className="btn btn-outline btn-compact">
                        View details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default Tours;
