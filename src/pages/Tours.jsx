import React, { useState } from "react";
import { tours } from "../data";
import { Link } from "react-router-dom";
import BackToTop from "../components/BackToTop";
import ProfileDropdown from "../components/ProfileDropdown";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function Tours() {
  const [navOpen, setNavOpen] = useState(false);
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
            
            <button
              className="nav-toggle"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((o) => !o)}
            >
              <span className="nav-toggle-bar" />
              <span className="nav-toggle-bar" />
            </button>
          </div>

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
                      <img src={tour.image} alt={tour.name} className="tour-image" />
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

export default Tours;

