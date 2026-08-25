import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { tours } from "../data";
import { getTour, getTourReviews, getTourReviewStats, getPublicPriceLabel } from "../lib/api";
import TourReviewForm from "../components/TourReviewForm";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";
import { siteConfig } from "../config";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function TourDetail() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [tourReviews, setTourReviews] = useState([]);
  const [tourRating, setTourRating] = useState(null);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourAndReviews = async () => {
      setLoading(true);
      try {
        const { data: dbTour, error: tourError } = await getTour(id);
        if (dbTour && !tourError) {
          setTour(dbTour);
        } else {
          setTour(tours.find((t) => t.id === id) || null);
        }

        const { data: reviews, error: reviewsError } = await getTourReviews(id);
        if (!reviewsError && reviews) {
          setTourReviews(reviews || []);
          const { data: stats } = await getTourReviewStats(id);
          if (stats) {
            setReviewStats(stats);
            setTourRating(stats.average > 0 ? stats.average : null);
          } else if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            const average = totalRating / reviews.length;
            setReviewStats({ average, count: reviews.length });
            setTourRating(average > 0 ? average : null);
          }
        }
      } catch {
        setTour(tours.find((t) => t.id === id) || null);
      } finally {
        setLoading(false);
      }
    };

    loadTourAndReviews();
  }, [id]);

  if (loading) {
    return (
      <>
        <PublicHeader />
        <main className="section page-section">
          <div className="container center">
            <p>Loading…</p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!tour) {
    return (
      <>
        <DocumentTitle title="Tour not found" description="This tour could not be found." />
        <PublicHeader />
        <main className="section page-section">
          <div className="container center">
            <h1>Tour not found</h1>
            <p>The tour you requested does not exist or is no longer available.</p>
            <Link to="/tours" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Back to tours
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <DocumentTitle
        title={tour.name}
        description={tour.description?.slice(0, 155) || `${tour.name} — private tour with UNICAB in Cape Town.`}
      />
      <PublicHeader />

      <main>
        <section className="section page-section">
          <div className="container">
            <div className="tour-detail">
              <Link to="/tours" className="btn btn-outline btn-compact" style={{ marginBottom: "1.5rem" }}>
                ← Back to tours
              </Link>

              {tour.image && (
                <div className="tour-detail-image">
                  <SafeImage
                    src={tour.image}
                    alt={tour.name}
                    fallbackLabel={tour.name}
                    className="tour-detail-img"
                  />
                </div>
              )}

              <div className="tour-detail-header">
                <div>
                  <h1>{tour.name}</h1>
                  {tour.promotion ? <span className="chip">{tour.promotion}</span> : null}
                </div>
                {tourRating != null && reviewStats.count > 0 && (
                  <div className="rating">
                    <span className="stars" aria-hidden="true">
                      {formatStars(tourRating)}
                    </span>
                    <span style={{ marginLeft: "0.5rem" }}>
                      {tourRating.toFixed(1)}/5 ({reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}
              </div>

              <div className="tour-detail-meta">
                <div>
                  <strong>Duration:</strong> {tour.duration}
                </div>
                <div>
                  <strong>Price:</strong> {getPublicPriceLabel(tour)}
                </div>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h2>Overview</h2>
                <p className="section-intro">{tour.description}</p>
              </div>

              {tour.highlights?.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h2>Highlights</h2>
                  <ul className="tour-highlights">
                    {tour.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {tour.notes && (
                <p className="card-meta" style={{ marginBottom: "2rem" }}>
                  <strong>Note:</strong> {tour.notes}
                </p>
              )}

              <div style={{ marginBottom: "2.5rem" }}>
                <h2>Guest reviews</h2>
                {tourReviews.length > 0 ? (
                  tourReviews.map((review) => (
                    <article key={review.id} className="card soft" style={{ marginBottom: "1rem" }}>
                      <div className="card-header">
                        <div>
                          <h3 className="card-title">{review.reviewer_name || "Guest"}</h3>
                        </div>
                        <div className="rating">
                          <span className="stars" aria-hidden="true">
                            {formatStars(review.rating)}
                          </span>
                        </div>
                      </div>
                      <p className="card-body">{review.comment}</p>
                    </article>
                  ))
                ) : (
                  <p className="card-meta">No guest reviews yet for this tour.</p>
                )}
                <TourReviewForm
                  tourId={tour.id}
                  onReviewSubmit={async () => {
                    const { data: reviews } = await getTourReviews(id);
                    if (reviews) setTourReviews(reviews);
                    const { data: stats } = await getTourReviewStats(id);
                    if (stats) {
                      setReviewStats(stats);
                      setTourRating(stats.average > 0 ? stats.average : null);
                    }
                  }}
                />
              </div>

              <div className="cta-panel">
                <h2>Ready to book?</h2>
                <p>Continue online or message us on WhatsApp with your preferred dates and group size.</p>
                <div className="card-actions">
                  <Link to={`/tours/${tour.id}/booking`} className="btn btn-primary">
                    Book Now
                  </Link>
                  <a
                    className="btn btn-grey"
                    href={`${siteConfig.whatsapp.link}?text=${encodeURIComponent(
                      `Hello, I'd like to enquire about: ${tour.name}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                  <Link to="/tours" className="btn btn-outline">
                    View all tours
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default TourDetail;
