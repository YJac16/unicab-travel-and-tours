import React from "react";
import { Link } from "react-router-dom";
import { tours } from "../data";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";
import { getPublicPriceLabel } from "../lib/pricing";
import { siteConfig } from "../config";

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
                Explore the Western Cape with private tours tailored to your interests and schedule. Request a quote or book online.
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
                    <span className="price">{getPublicPriceLabel(tour)}</span>
                    <div className="card-actions">
                      <Link to={`/tours/${tour.id}/booking`} className="btn btn-primary btn-compact">
                        Book Now
                      </Link>
                      <Link to={`/tours/${tour.id}`} className="btn btn-outline btn-compact">
                        View Details
                      </Link>
                      <a
                        className="btn btn-grey btn-compact"
                        href={`${siteConfig.whatsapp.link}?text=${encodeURIComponent(
                          `Hello, I'd like a quote for: ${tour.name}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
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
