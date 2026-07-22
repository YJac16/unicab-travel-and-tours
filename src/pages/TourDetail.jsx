import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { tours } from "../data";
import { getTour, getTourReviews, getTourReviewStats } from "../lib/api";
import BackToTop from "../components/BackToTop";
import TourReviewForm from "../components/TourReviewForm";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
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
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <Link to="/tours" className="btn btn-outline" style={{ marginBottom: "2rem", textDecoration: "none" }}>
                ← Back to Tours
              </Link>

              {tour.image && (
                <div style={{ marginBottom: "2rem", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <img
                    src={tour.image}
                    alt={tour.name}
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

export default TourDetail;

