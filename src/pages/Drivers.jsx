import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { drivers as localDrivers } from "../data";
import { getDrivers, getDriverReviews, getDriverReviewStats } from "../lib/api";
import DriverReviewForm from "../components/DriverReviewForm";
import SafeImage from "../components/SafeImage";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function Drivers() {
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
          ratingsMap[key] = stats?.count > 0 ? stats.average : null;
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

          <nav className="main-nav" aria-label="Primary">
            <ul>
              <li>
                <Link className="link-button" to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/tours">
                  Tours
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/vehicles">
                  Vehicles
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/drivers">
                  Drivers
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/reviews">
                  Reviews
                </Link>
              </li>
              <li>
                <Link className="link-button" to="/membership">
                  Membership
                </Link>
              </li>
              <li>
                <Link 
                  className="link-button" 
                  to="/"
                  onClick={() => {
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
                  to="/book"
                 
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
                        <SafeImage
                          src={driver.image}
                          alt={driver.name}
                          fallbackLabel={driver.name}
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
    </div>
  );
}

export default Drivers;

