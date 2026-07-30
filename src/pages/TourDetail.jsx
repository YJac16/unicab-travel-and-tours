import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { tours } from "../data";
import { getTour, getTourReviews, getTourReviewStats } from "../lib/api";
import TourReviewForm from "../components/TourReviewForm";
import SafeImage from "../components/SafeImage";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [tourReviews, setTourReviews] = useState([]);
  const [tourRating, setTourRating] = useState(null);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  // Load tour and reviews
  useEffect(() => {
    const loadTourAndReviews = async () => {
      setLoading(true);
      try {
        // Try to get tour from database first
        const { data: dbTour, error: tourError } = await getTour(id);
        if (dbTour && !tourError) {
          setTour(dbTour);
        } else {
          // Fallback to local data
          const localTour = tours.find((t) => t.id === id);
          setTour(localTour);
        }

        // Load tour-specific reviews from Supabase
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
      } catch (err) {
        console.error('Error loading tour:', err);
        // Fallback to local data
        const localTour = tours.find((t) => t.id === id);
        setTour(localTour);
      } finally {
        setLoading(false);
      }
    };

    loadTourAndReviews();
  }, [id]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!tour) {
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
              </ul>
            </nav>
          </div>
        </header>
        <main>
          <section className="section" style={{ paddingTop: "8rem", textAlign: "center" }}>
            <div className="container">
              <h2>Tour Not Found</h2>
              <p>The tour you're looking for doesn't exist.</p>
              <Link to="/tours" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                Back to Tours
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const scrollToContact = () => {
    navigate("/#contact");
    setTimeout(() => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
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
                  to={`/tours/${tour.id}/booking`}
                 
                >
                  Book Now
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <Link to="/tours" className="btn btn-outline" style={{ marginBottom: "2rem", textDecoration: "none" }}>
                ← Back to Tours
              </Link>

              {tour.image && (
                <div style={{ marginBottom: "2rem", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <SafeImage
                    src={tour.image}
                    alt={tour.name}
                    fallbackLabel={tour.name}
                    style={{ width: "100%", height: "400px", objectFit: "cover", display: "block" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ fontSize: "2.5rem", margin: "0 0 0.5rem 0", color: "var(--text-main)" }}>
                    {tour.name}
                  </h1>
                  {tour.promotion && (
                    <span className="chip" style={{ backgroundColor: "var(--accent-gold-soft)", color: "var(--accent-gold)" }}>
                      {tour.promotion}
                    </span>
                  )}
                </div>
                {tourRating !== null && (
                  <div className="rating">
                    <span className="stars" aria-hidden="true" style={{ fontSize: "1.5rem" }}>
                      {formatStars(tourRating)}
                    </span>
                    <span style={{ fontSize: "1rem", marginLeft: "0.5rem" }}>
                      {tourRating.toFixed(1)}/5
                      {reviewStats.count > 0 && (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-soft)", marginLeft: "0.5rem" }}>
                          ({reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                <div>
                  <strong style={{ color: "var(--text-soft)" }}>Duration:</strong> {tour.duration}
                </div>
                <div>
                  <strong style={{ color: "var(--text-soft)" }}>Price:</strong> {tour.priceFrom}
                </div>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Overview</h2>
                <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "var(--text-soft)" }}>{tour.description}</p>
              </div>

              {tour.highlights && tour.highlights.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Highlights</h2>
                  <ul style={{ paddingLeft: "1.5rem", fontSize: "1rem", lineHeight: "1.8" }}>
                    {tour.highlights.map((highlight, idx) => (
                      <li key={idx} style={{ marginBottom: "0.5rem", color: "var(--text-soft)" }}>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reviews Section */}
              <div style={{ marginTop: "3rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Guest Reviews</h2>
                
                {loading ? (
                  <p style={{ color: "var(--text-soft)", marginBottom: "2rem" }}>Loading reviews...</p>
                ) : tourReviews.length > 0 ? (
                  <div style={{ marginBottom: "2rem" }}>
                    {tourReviews.map((review) => (
                      <article key={review.id} className="card soft" style={{ marginBottom: "1rem" }}>
                        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <h3 className="card-title" style={{ margin: 0 }}>
                              {review.reviewer_name || "Guest"}
                            </h3>
                            {review.created_at && (
                              <p className="card-meta" style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem" }}>
                                {new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            )}
                          </div>
                          <div className="rating">
                            <span className="stars" aria-hidden="true">
                              {formatStars(review.rating)}
                            </span>
                          </div>
                        </div>
                        <p className="card-body" style={{ margin: "0.5rem 0 0 0" }}>{review.comment}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-soft)", marginBottom: "2rem" }}>
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}

                {tour && (
                  <TourReviewForm
                    tourId={tour.id}
                    onReviewSubmit={async () => {
                      // Reload reviews after submission
                      const { data: reviews } = await getTourReviews(id);
                      if (reviews) setTourReviews(reviews);
                      const { data: stats } = await getTourReviewStats(id);
                      if (stats) {
                        setReviewStats(stats);
                        setTourRating(stats.average > 0 ? stats.average : null);
                      }
                    }}
                  />
                )}
              </div>

              <div style={{ marginTop: "3rem", padding: "2rem", backgroundColor: "var(--bg-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)" }}>
                <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Ready to Book?</h3>
                <p style={{ marginBottom: "1.5rem", color: "var(--text-soft)" }}>
                  Book this experience through our secure online booking system. Payment is completed with YOCO Checkout.
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <Link to={`/tours/${tour.id}/booking`} className="btn btn-primary" style={{ textDecoration: "none" }}>
                    Book Now
                  </Link>
                  <Link to="/tours" className="btn btn-outline" style={{ textDecoration: "none" }}>
                    View All Tours
                  </Link>
                </div>
              </div>
            </div>
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

export default TourDetail;

