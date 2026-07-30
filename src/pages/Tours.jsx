import React from "react";
import { tours } from "../data";
import { Link } from "react-router-dom";
import ProfileDropdown from "../components/ProfileDropdown";
import SafeImage from "../components/SafeImage";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function Tours() {
  const handleTourDetails = (tour) => {
    alert(
      `${tour.name}\n\n${tour.description}\n\nDuration: ${tour.duration}\nRating: ${formatStars(tour.rating)}\n${tour.priceFrom}\n\nHighlights:\n${tour.highlights.map((h) => `• ${h}`).join("\n")}`
    );
  };

  return (
    <div>
      {/* Header - Reuse from main site */}
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ProfileDropdown />
            </div>
          </div>

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
        <section className="section tours" style={{ paddingTop: "8rem" }}>
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Tours</p>
              <h2>Discover Cape Town & Beyond</h2>
              <p className="section-intro max-720">
                Explore the Western Cape with our curated selection of private tours. From city highlights to multi-day adventures, each experience is tailored to your interests and schedule.
              </p>
            </header>

            <div className="cards-grid">
              {tours.map((tour) => (
                <article key={tour.id} className="card tour-card">
                  {tour.image && (
                    <div className="tour-image-wrapper">
                      <SafeImage src={tour.image} alt={tour.name} className="tour-image" fallbackLabel={tour.name} />
                    </div>
                  )}
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{tour.name}</h3>
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
                    {tour.promotion && <span className="chip">{tour.promotion}</span>}
                  </div>
                  <div className="card-body">
                    <p className="card-meta">
                      <span>{tour.duration}</span>
                    </p>
                    <p>{tour.description}</p>
                    {tour.highlights && tour.highlights.length > 0 && (
                      <ul style={{ marginTop: "0.8rem", paddingLeft: "1.2rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
                        {tour.highlights.slice(0, 3).map((highlight, idx) => (
                          <li key={idx} style={{ marginBottom: "0.4rem" }}>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="card-footer">
                    <span className="price">{tour.priceFrom}</span>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <Link to={`/tours/${tour.id}/booking`} className="btn btn-primary btn-compact" style={{ textDecoration: "none" }}>
                        Book Now
                      </Link>
                      <Link to={`/tours/${tour.id}`} className="btn btn-outline btn-compact" style={{ textDecoration: "none" }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
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

export default Tours;

