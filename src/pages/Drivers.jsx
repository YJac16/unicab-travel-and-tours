import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { drivers as localDrivers } from "../data";
import { getDrivers, getDriverReviews, getDriverReviewStats } from "../lib/api";
import BackToTop from "../components/BackToTop";
import DriverReviewForm from "../components/DriverReviewForm";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function Drivers() {
  const [navOpen, setNavOpen] = useState(false);
  const [drivers, setDrivers] = useState(localDrivers);
  const [driverReviews, setDriverReviews] = useState({});
  const [driverRatings, setDriverRatings] = useState({});
  const [expandedDriver, setExpandedDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load drivers and reviews from database
  useEffect(() => {
    const loadDriversAndReviews = async () => {
      setLoading(true);
      try {
        const { data: dbDrivers } = await getDrivers();
        const driverList = dbDrivers?.length ? dbDrivers : localDrivers;
        setDrivers(driverList);

        const reviewsMap = {};
        const ratingsMap = {};

        for (const driver of driverList) {
          const key = driver.id || driver.name;
          if (!key) continue;
          const { data: driverReviewsList } = await getDriverReviews(key);
          const { data: stats } = await getDriverReviewStats(key);
          reviewsMap[key] = driverReviewsList || [];
          ratingsMap[key] = stats?.average > 0 ? stats.average : (driver.rating || null);
        }

        setDriverReviews(reviewsMap);
        setDriverRatings(ratingsMap);
      } catch (err) {
        console.warn('Using local drivers (Supabase unavailable)');
        setDrivers(localDrivers);
      } finally {
        setLoading(false);
      }
    };

    loadDriversAndReviews();
  }, []);

  const handleReviewSubmit = async (driverId) => {
    if (!driverId) return;
    const { data: reviews } = await getDriverReviews(driverId);
    const { data: stats } = await getDriverReviewStats(driverId);
    if (reviews) {
      setDriverReviews((prev) => ({ ...prev, [driverId]: reviews }));
    }
    if (stats) {
      setDriverRatings((prev) => ({
        ...prev,
        [driverId]: stats.average > 0 ? stats.average : null
      }));
    }
  };
  
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
          </button>

          <nav className={`main-nav ${navOpen ? "open" : ""}`} aria-label="Primary">
            <ul>
              <li>
                <Link className="link-button" to="/" onClick={() => setNavOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/tours" onClick={() => setNavOpen(false)}>
                  Tours
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/vehicles" onClick={() => setNavOpen(false)}>
                  Vehicles
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/drivers" onClick={() => setNavOpen(false)}>
                  Drivers
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/reviews" onClick={() => setNavOpen(false)}>
                  Reviews
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/membership" onClick={() => setNavOpen(false)}>
                  Membership
                </Link>
              </li>
              <li>
                <Link 
                  className="link-button" 
                  to="/"
                  onClick={() => {
                    setNavOpen(false);
                    setTimeout(() => {
                      const aboutSection = document.getElementById('about');
                      if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  className="link-button" 
                  to="/"
                  onClick={() => {
                    setNavOpen(false);
                    setTimeout(() => {
                      const contactSection = document.getElementById('contact');
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                >
                  Contact
                </Link>
              </li>
              <li className="cta-nav">
                <Link 
                  className="btn btn-primary btn-compact" 
                  to="/tours"
                  onClick={() => setNavOpen(false)}
                >
                  Book Now
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="section drivers" style={{ paddingTop: "8rem" }}>
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Drivers</p>
              <h2>Professional, Experienced, and Personable</h2>
              <p className="section-intro max-720">
                Our drivers are more than chauffeurs—they're your local guides, ensuring a safe, comfortable, and
                informative journey through Cape Town and beyond.
              </p>
            </header>

            {loading ? (
              <p style={{ textAlign: "center", color: "var(--text-soft)" }}>Loading drivers...</p>
            ) : (
              <div className="cards-grid" aria-live="polite">
                {[...drivers].sort((a, b) => {
                  const ratingA = driverRatings[a.id || a.name] || a.rating || 0;
                  const ratingB = driverRatings[b.id || b.name] || b.rating || 0;
                  return ratingB - ratingA;
                }).map((driver) => {
                  const driverId = driver.id || driver.name;
                  const driverRating = driverRatings[driverId] !== undefined ? driverRatings[driverId] : (driver.rating || null);
                  const reviews = driverReviews[driverId] || [];
                  const isExpanded = expandedDriver === driverId;

                return (
                  <article className="card soft" key={driver.name}>
                    <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexDirection: "row-reverse" }}>
                      {driver.image && (
                        <img
                          src={driver.image}
                          alt={driver.name}
                          style={{
                            width: "180px",
                            height: "180px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid var(--border-gold)",
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 className="card-title">{driver.name}</h3>
                        <p className="card-meta">{driver.experience}</p>
                        {driverRating !== null && (
                          <div className="rating" style={{ marginTop: "0.5rem" }}>
                            <span className="stars" aria-hidden="true">
                              {formatStars(driverRating)}
                            </span>
                            <span style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                              {driverRating.toFixed(1)}
                              {reviews.length > 0 && (
                                <span style={{ fontSize: "0.75rem", color: "var(--text-soft)", marginLeft: "0.5rem" }}>
                                  ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {driver.languages && driver.languages.length > 0 && (
                      <p className="card-meta" style={{ marginTop: "0.5rem" }}>
                        <strong>Languages:</strong> {driver.languages.join(", ")}
                      </p>
                    )}
                    {driver.skills && driver.skills.length > 0 && (
                      <div style={{ marginTop: "0.8rem" }}>
                        <p className="card-meta" style={{ marginBottom: "0.4rem" }}>
                          <strong>Areas of Expertise:</strong>
                        </p>
                        <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
                          {driver.skills.map((skill, idx) => (
                            <li key={idx} style={{ marginBottom: "0.3rem" }}>
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {driver.quote && (
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-soft)" }}>
                        <p style={{ fontStyle: "italic", color: "var(--text-soft)", fontSize: "0.9rem" }}>
                          {driver.quote}
                        </p>
                      </div>
                    )}

                    {/* Reviews Section */}
                    <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "2px solid var(--border-soft)" }}>
                      <button
                        onClick={() => setExpandedDriver(isExpanded ? null : driverId)}
                        className="btn btn-outline btn-compact"
                        style={{ width: "100%", marginBottom: "1rem" }}
                      >
                        {isExpanded ? "Hide Reviews" : `View Reviews (${reviews.length})`}
                      </button>

                      {isExpanded && (
                        <div>
                          {reviews.length > 0 ? (
                            <div style={{ marginBottom: "1.5rem" }}>
                              {reviews.map((review) => (
                                <div key={review.id} style={{ 
                                  marginBottom: "1rem", 
                                  padding: "1rem", 
                                  background: "var(--bg-soft)", 
                                  borderRadius: "8px",
                                  border: "1px solid var(--border-soft)"
                                }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                    <div>
                                      <strong style={{ fontSize: "0.9rem" }}>
                                        {review.reviewer_name || "Guest"}
                                      </strong>
                                      {review.created_at && (
                                        <p style={{ fontSize: "0.8rem", color: "var(--text-soft)", margin: "0.25rem 0 0 0" }}>
                                          {new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                        </p>
                                      )}
                                    </div>
                                    <div className="rating">
                                      <span className="stars" aria-hidden="true" style={{ fontSize: "0.9rem" }}>
                                        {formatStars(review.rating)}
                                      </span>
                                    </div>
                                  </div>
                                  <p style={{ fontSize: "0.9rem", margin: 0, color: "var(--text-soft)" }}>{review.comment}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: "var(--text-soft)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                              No reviews yet. Be the first to rate {driver.name}!
                            </p>
                          )}

                          {driver.id && (
                            <DriverReviewForm
                              driverId={driver.id}
                              onReviewSubmit={() => handleReviewSubmit(driver.id)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            &copy; <span>{new Date().getFullYear()}</span> UNICAB Travel &amp; Tours. All rights reserved.
          </p>
          <p className="footer-meta">Premium private transfers &amp; tours in Cape Town and the Western Cape.</p>
          <div className="footer-contact" style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-soft)" }}>
            <p style={{ margin: "0.25rem 0" }}>
              <a href="mailto:info@unicabtravel.co.za" style={{ color: "var(--accent-gold)", textDecoration: "none", marginRight: "1rem" }}>
                info@unicabtravel.co.za
              </a>
              <a
                href="https://wa.me/+27822818105"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-gold)", textDecoration: "none", marginRight: "1rem" }}
              >
                +27 82 281 8105
              </a>
              <a
                href="https://www.unicab.co.za/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-gold)", textDecoration: "none" }}
              >
                Cab &amp; Staff Transport
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Chat Button */}
      <a
        href="https://wa.me/+27822818105?text=Hello%2C%20I%27d%20like%20to%20inquire%20about%20your%20services"
        className="whatsapp-button"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="whatsapp-icon"
        >
          <path
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
            fill="currentColor"
          />
        </svg>
        <span className="whatsapp-tooltip">Chat with us</span>
      </a>

      <BackToTop />
    </div>
  );
}

export default Drivers;

