import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicReviewsFeed } from "../lib/reviewsFeed";
import { tours } from "../data";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SiteFooter from "../components/SiteFooter";

const formatStars = (rating) => {
  const fullStars = Math.round(rating || 0);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function Reviews() {
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
    <>
      <DocumentTitle
        title="Reviews"
        description="Guest feedback on UNICAB private tours and drivers in Cape Town."
      />
      <PublicHeader />

      <main>
        <section className="section reviews page-section">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Guest reviews</p>
              <h1>What guests share</h1>
              <p className="section-intro max-720">
                Approved guest feedback on tours and drivers. After your trip, you can leave a review from a tour or driver page.
              </p>
            </header>

            <div className="filter-row" role="group" aria-label="Filter reviews">
              {[
                ["all", "All"],
                ["tour", "Tours"],
                ["driver", "Drivers"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={filter === value ? "btn btn-primary btn-compact" : "btn btn-outline btn-compact"}
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
                        <h2 className="card-title">{review.name}</h2>
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
                      <span className="chip">{review.review_type === "driver" ? "Driver" : "Tour"}</span>
                    </div>
                  </article>
                ))}
              {!loading && !visible.length && (
                <p style={{ textAlign: "center", gridColumn: "1 / -1", color: "var(--text-soft)" }}>
                  No published reviews in this category yet. Be the first after your next journey.
                </p>
              )}
            </div>

            <div className="section-cta">
              <Link to={`/tours/${tours[0]?.id || ""}`} className="btn btn-primary">
                Review a tour
              </Link>
              <Link to="/drivers" className="btn btn-outline">
                Review a driver
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default Reviews;
