import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTours, formatTourPrice, calculateTourPrice } from "../lib/api";
import BackToTop from "../components/BackToTop";
import ProfileDropdown from "../components/ProfileDropdown";
import SafeImage from "../components/SafeImage";
import { useLocale } from "../contexts/LocaleContext";
import LocaleSwitcher from "../components/LocaleSwitcher";

const formatStars = (rating) => {
  const fullStars = Math.round(rating || 0);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

/**
 * Booking entry: pick a tour (live /api/tours with local fallback), then booking form.
 */
function Book() {
  const [navOpen, setNavOpen] = useState(false);
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
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>

          <button
            className="nav-toggle"
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>

          <nav className={`main-nav ${navOpen ? "open" : ""}`} aria-label="Primary">
            <ul>
              <li>
                <Link className="link-button" to="/" onClick={() => setNavOpen(false)}>
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/tours" onClick={() => setNavOpen(false)}>
                  {t("tours")}
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/book" onClick={() => setNavOpen(false)}>
                  {t("book")}
                </Link>
              </li>
              <li className="cta-nav">
                <Link className="btn btn-primary btn-compact" to="/book" onClick={() => setNavOpen(false)}>
                  {t("bookNow")}
                </Link>
              </li>
            </ul>
          </nav>

          <div style={{ marginLeft: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <LocaleSwitcher />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main>
        <section className="section tours" style={{ paddingTop: "8rem" }}>
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">{t("book")}</p>
              <h1>{t("chooseExperience")}</h1>
              <p className="section-intro max-720">
                Select a tour to continue to dates, group size, and driver selection.
              </p>
            </header>

            {loading ? (
              <p style={{ textAlign: "center" }}>Loading tours…</p>
            ) : (
              <div className="cards-grid" aria-live="polite">
                {tours.map((tour) => {
                  const fromPrice = calculateTourPrice(tour, 2) || calculateTourPrice(tour, 1);
                  return (
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
                          <h3 className="card-title">{tour.name}</h3>
                          <p className="tour-duration">{tour.duration}</p>
                          {tour.rating && (
                            <div className="rating" style={{ marginTop: "0.5rem" }}>
                              <span className="stars" aria-hidden="true">
                                {formatStars(tour.rating)}
                              </span>
                              <span style={{ fontSize: "0.85rem", marginLeft: "0.5rem" }}>
                                {tour.rating.toFixed(1)}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="card-body" style={{ fontSize: "0.95rem" }}>
                        {tour.priceFrom || (fromPrice ? `From ${formatTourPrice(fromPrice)}` : "Price on request")}
                      </p>
                      <div className="card-footer" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Link
                          to={`/tours/${tour.id}/booking`}
                          className="btn btn-primary btn-compact"
                          style={{ textDecoration: "none" }}
                        >
                          Book this tour
                        </Link>
                        <Link
                          to={`/tours/${tour.id}`}
                          className="btn btn-outline btn-compact"
                          style={{ textDecoration: "none" }}
                        >
                          Details
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <BackToTop />
    </div>
  );
}

export default Book;
