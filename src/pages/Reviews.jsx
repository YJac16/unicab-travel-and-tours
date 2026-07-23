import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BackToTop from "../components/BackToTop";
import { getPublicReviewsFeed } from "../lib/reviewsFeed";
import { tours, drivers } from "../data";

const formatStars = (rating) => {
  const fullStars = Math.round(rating || 0);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function Reviews() {
  const [navOpen, setNavOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const feed = await getPublicReviewsFeed(40);
      if (!cancelled) {
        setReviews(feed);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = reviews.filter((r) => {
    if (filter === "all") return true;
    return r.review_type === filter;
  });

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
                <Link className="link-button" to="/" onClick={() => setNavOpen(false)}>Home</Link>
              </li>
              <li>
                <Link className="link-button" to="/tours" onClick={() => setNavOpen(false)}>Tours</Link>
              </li>
              <li>
                <Link className="link-button" to="/drivers" onClick={() => setNavOpen(false)}>Drivers</Link>
              </li>
              <li>
                <Link className="link-button" to="/reviews" onClick={() => setNavOpen(false)}>Reviews</Link>
              </li>
              <li className="cta-nav">
                <Link className="btn btn-primary btn-compact" to="/tours" onClick={() => setNavOpen(false)}>
                  Book Now
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="section reviews" style={{ paddingTop: "8rem" }}>
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Client Reviews</p>
              <h2>What Our Guests Say</h2>
              <p className="section-intro max-720">
                Live guest feedback on tours and drivers. Sign in on a tour or driver page to leave your own review.
              </p>
            </header>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {[
                ["all", "All"],
                ["tour", "Tours"],
                ["driver", "Drivers"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={filter === value ? "btn btn-primary" : "btn btn-outline"}
                  style={{ fontSize: "0.85rem" }}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="cards-grid" aria-live="polite">
              {loading && <p style={{ textAlign: "center", gridColumn: "1 / -1" }}>Loading reviews…</p>}
              {!loading &&
                visible.map((review, index) => (
                  <article className="card soft" key={review.id || index}>
                    <div className="card-header">
                      <div>
                        <h3 className="card-title">{review.name}</h3>
                        <p className="card-meta">{review.target_name || review.tourName}</p>
                      </div>
                      <div className="rating">
                        <span className="stars" aria-hidden="true">
                          {formatStars(review.rating)}
                        </span>
                      </div>
                    </div>
                    <p className="card-body">{review.text || review.comment}</p>
                    <div className="review-footer">
                      <span className="chip">
                        {review.review_type === "driver" ? "Driver" : "Tour"}
                      </span>
                    </div>
                  </article>
                ))}
              {!loading && !visible.length && (
                <p style={{ textAlign: "center", gridColumn: "1 / -1" }}>No reviews in this category yet.</p>
              )}
            </div>

            <div style={{ marginTop: "2.5rem" }}>
              <h3 style={{ textAlign: "center" }}>Leave a review</h3>
              <p style={{ textAlign: "center", color: "var(--text-soft)" }}>
                Open a tour or driver page after signing in to submit feedback (moderated before publishing).
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1rem" }}>
                <Link to={`/tours/${tours[0]?.id || ""}`} className="btn btn-primary">
                  Review a tour
                </Link>
                <Link to="/drivers" className="btn btn-outline">
                  Review a driver
                </Link>
              </div>
              <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-soft)", marginTop: "0.75rem" }}>
                {drivers.length} drivers · {tours.length} tours available to review
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            &copy; <span>{new Date().getFullYear()}</span> UNICAB Travel &amp; Tours. All rights reserved.
          </p>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}

export default Reviews;
