import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { drivers as localDrivers } from "../data";
import { getDrivers, getDriverReviews, getDriverReviewStats } from "../lib/api";
import DriverReviewForm from "../components/DriverReviewForm";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";

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
      } catch {
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
    <>
      <DocumentTitle
        title="Drivers"
        description="Meet UNICAB professional chauffeurs and guides for Cape Town transfers and private tours."
      />
      <PublicHeader />

      <main>
        <section className="section drivers page-section">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Drivers</p>
              <h1>Professional chauffeurs &amp; guides</h1>
              <p className="section-intro max-720">
                UNICAB drivers focus on punctual pickups, clear communication, and a comfortable journey across Cape Town and the Western Cape.
              </p>
            </header>

            {loading ? (
              <p style={{ textAlign: "center", color: "var(--text-soft)" }}>Loading drivers…</p>
            ) : (
              <div className="cards-grid" aria-live="polite">
                {drivers.map((driver) => {
                  const driverId = driver.id || driver.name;
                  const liveRating = driverRatings[driverId];
                  const reviews = driverReviews[driverId] || [];
                  const isExpanded = expandedDriver === driverId;

                  return (
                    <article className="card soft" key={driverId}>
                      <div className="driver-card-header">
                        {driver.image && (
                          <SafeImage
                            src={driver.image}
                            alt={driver.name}
                            fallbackLabel={driver.name}
                            className="driver-avatar"
                          />
                        )}
                        <div>
                          <h2 className="card-title">{driver.name}</h2>
                          <p className="card-meta">{driver.experience || "Professional chauffeur & guide"}</p>
                          {liveRating != null && (
                            <div className="rating" style={{ marginTop: "0.5rem" }}>
                              <span className="stars" aria-hidden="true">
                                {formatStars(liveRating)}
                              </span>
                              <span style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                                {liveRating.toFixed(1)}
                                {reviews.length > 0 && (
                                  <span style={{ color: "var(--text-soft)", marginLeft: "0.5rem" }}>
                                    ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {driver.languages?.length > 0 && (
                        <p className="card-meta" style={{ marginTop: "0.75rem" }}>
                          <strong>Languages:</strong> {driver.languages.join(", ")}
                        </p>
                      )}
                      {driver.skills?.length > 0 && (
                        <ul className="vehicle-features" style={{ marginTop: "0.75rem" }}>
                          {driver.skills.map((skill) => (
                            <li key={skill}>{skill}</li>
                          ))}
                        </ul>
                      )}

                      <div style={{ marginTop: "1.25rem" }}>
                        <button
                          type="button"
                          onClick={() => setExpandedDriver(isExpanded ? null : driverId)}
                          className="btn btn-outline btn-compact"
                          style={{ width: "100%" }}
                        >
                          {isExpanded ? "Hide reviews" : `Guest reviews (${reviews.length})`}
                        </button>

                        {isExpanded && (
                          <div style={{ marginTop: "1rem" }}>
                            {reviews.length > 0 ? (
                              reviews.map((review) => (
                                <div key={review.id} className="review-snippet">
                                  <div className="review-snippet-header">
                                    <strong>{review.reviewer_name || "Guest"}</strong>
                                    <span className="stars" aria-hidden="true">
                                      {formatStars(review.rating)}
                                    </span>
                                  </div>
                                  <p>{review.comment}</p>
                                </div>
                              ))
                            ) : (
                              <p className="card-meta">No guest reviews yet.</p>
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

            <div className="section-cta">
              <Link to="/book" className="btn btn-primary">
                Book with UNICAB
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default Drivers;
