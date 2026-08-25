import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getTours, getPublicPriceLabel } from "../lib/api";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";
import { useLocale } from "../contexts/LocaleContext";
import LocaleSwitcher from "../components/LocaleSwitcher";

function Book() {
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("package");
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await getTours();
      if (!cancelled) {
        setTours(data || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <DocumentTitle
        title="Book"
        description="Book a UNICAB private tour or transfer in Cape Town and the Western Cape."
      />
      <PublicHeader trailing={<LocaleSwitcher />} />

      <main>
        <section className="section tours page-section">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">{t("book")}</p>
              <h1>{t("chooseExperience")}</h1>
              <p className="section-intro max-720">
                Select a tour to continue to dates, group size, and driver selection. Pricing is confirmed during booking.
              </p>
            </header>

            {loading ? (
              <p style={{ textAlign: "center" }}>Loading tours…</p>
            ) : (
              <div className="cards-grid" aria-live="polite">
                {tours.map((tour) => (
                  <article className="card tour-card soft" key={tour.id}>
                    {tour.image && (
                      <div className="tour-image-wrapper">
                        <SafeImage
                          src={tour.image}
                          alt={tour.name}
                          className="tour-image"
                          fallbackLabel={tour.name}
                        />
                      </div>
                    )}
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">{tour.name}</h2>
                        <p className="tour-duration">{tour.duration}</p>
                      </div>
                    </div>
                    <p className="card-body" style={{ fontSize: "0.95rem" }}>
                      {getPublicPriceLabel(tour)}
                    </p>
                    <div className="card-footer card-actions">
                      <Link
                        to={
                          packageId
                            ? `/tours/${tour.id}/booking?package=${encodeURIComponent(packageId)}`
                            : `/tours/${tour.id}/booking`
                        }
                        className="btn btn-primary btn-compact"
                      >
                        Book this tour
                      </Link>
                      <Link to={`/tours/${tour.id}`} className="btn btn-outline btn-compact">
                        Details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default Book;
