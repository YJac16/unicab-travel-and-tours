import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { tours, vehicles, drivers, reviews, membershipPlans } from "../data";
import { siteConfig } from "../config";
import ProfileDropdown from "../components/ProfileDropdown";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

const navItems = [
  { id: "tours", label: "Tours", path: "/tours" },
  { id: "vehicles", label: "Vehicles", path: "/vehicles" },
  { id: "drivers", label: "Drivers", path: "/drivers" },
  { id: "reviews", label: "Reviews", path: "/reviews" },
  // MEMBER FEATURES HIDDEN - Customer-facing only, no membership
  // { id: "membership", label: "Membership", path: "/membership" },
  { id: "about", label: "About", path: null },
  { id: "contact", label: "Contact", path: null }
];

function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  // Back to top button visibility
  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    setNavOpen(false);
  };

  const validate = (data) => {
    const nextErrors = {};
    if (!data.name || data.name.trim().length < 2) {
      nextErrors.name = "Please provide your full name.";
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      nextErrors.email = "Please provide a valid email address.";
    }
    if (!data.phone) {
      nextErrors.phone = "Please provide a contact number.";
    }
    if (!data.message || data.message.trim().length < 10) {
      nextErrors.message = "Please provide a message (at least 10 characters).";
    }
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message")
    };

    const nextErrors = validate(data);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setSuccessMsg("Thank you! We'll be in touch soon.");
        e.target.reset();
      } else {
        setErrors({ submit: "Something went wrong. Please try again." });
      }
    } catch (err) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTourDetails = (tour) => {
    alert(
      `${tour.name}\n\n${tour.description}\n\nDuration: ${tour.duration}\nRating: ${formatStars(tour.rating)}\n${tour.priceFrom}\n\nHighlights:\n${tour.highlights.map((h) => `• ${h}`).join("\n")}`
    );
  };

  return (
    <>
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
              {navItems.map((item) => (
                <li key={item.id}>
                  {item.path ? (
                    <Link 
                      className="link-button" 
                      to={item.path}
                      onClick={(e) => {
                        setNavOpen(false);
                        // Ensure navigation happens
                        window.scrollTo(0, 0);
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a className="link-button" href={`#${item.id}`} onClick={() => { scrollToSection(item.id); setNavOpen(false); }}>
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
              <li className="cta-nav">
                <a className="btn btn-primary" href="/tours" onClick={() => setNavOpen(false)}>
                  Book Now
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section id="home" className="hero" aria-labelledby="hero-heading">
          <div className="hero-bg-image"></div>
          <div className="hero-overlay"></div>
          <div className="container hero-inner hero-centered">
            <h1 id="hero-heading">
              <span className="hero-title-main">Discover Cape Town</span>
              <span className="hero-title-accent">In Premium Style</span>
            </h1>
            <p className="hero-subtitle">
              <span className="desktop-only">Private tours, airport transfers, and customized experiences with licensed guides.</span>
              <span className="mobile-only">Private tours, transfers & experiences</span>
            </p>
            <div className="hero-actions">
              <Link to="/tours" className="btn btn-primary" onClick={() => window.scrollTo(0, 0)}>
                Book Now
              </Link>
              <button className="btn btn-grey" onClick={() => scrollToSection("tours")}>
                Explore Tours
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-value">35+</span>
                <span className="stat-label">Years of service</span>
              </div>
              <div className="hero-stat">
                <span className="stat-value">Safe &amp; Reliable</span>
                <span className="stat-label">Fully licensed &amp; insured</span>
              </div>
              <div className="hero-stat">
                <span className="stat-value">24/7</span>
                <span className="stat-label">Operations &amp; dispatch</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation - What We Do */}
        <section className="quick-nav-section">
          <div className="container">
            <div className="quick-nav-grid">
              <Link to="/tours" className="quick-nav-card" onClick={() => window.scrollTo(0, 0)}>
                <div className="quick-nav-icon">🗺️</div>
                <h3>Tours</h3>
                <p className="mobile-only">Explore</p>
                <p className="desktop-only">Curated experiences</p>
              </Link>
              <Link to="/vehicles" className="quick-nav-card" onClick={() => window.scrollTo(0, 0)}>
                <div className="quick-nav-icon">🚗</div>
                <h3>Fleet</h3>
                <p className="mobile-only">Vehicles</p>
                <p className="desktop-only">Premium vehicles</p>
              </Link>
              <Link to="/drivers" className="quick-nav-card" onClick={() => window.scrollTo(0, 0)}>
                <div className="quick-nav-icon">👨‍✈️</div>
                <h3>Drivers</h3>
                <p className="mobile-only">Experts</p>
                <p className="desktop-only">Local knowledge</p>
              </Link>
              <a href="#contact" className="quick-nav-card" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>
                <div className="quick-nav-icon">📞</div>
                <h3>Book</h3>
                <p className="mobile-only">Now</p>
                <p className="desktop-only">Get started</p>
              </a>
            </div>
          </div>
        </section>

        <section className="section why-unicab">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Why UNICAB</p>
              <h2>Your Trusted Travel Partner</h2>
              <p className="section-intro max-720">
                <span className="desktop-only">Experience the difference of premium service with licensed guides, fully insured vehicles, and
                punctuality you can count on.</span>
                <span className="mobile-only">Premium service with licensed guides, fully insured vehicles, and punctuality.</span>
              </p>
            </header>
            <div className="why-grid">
              <div className="why-card">
                <div className="why-icon">✓</div>
                <h3>Licensed &amp; Insured</h3>
                <p>All our vehicles and drivers are fully licensed and comprehensively insured for your peace of mind.</p>
              </div>
              <div className="why-card">
                <div className="why-icon">👨‍🏫</div>
                <h3>Expert Guides</h3>
                <p>Our professional guides are knowledgeable, friendly, and passionate about sharing Cape Town's best.</p>
              </div>
              <div className="why-card">
                <div className="why-icon">⏰</div>
                <h3>Always On Time</h3>
                <p>We understand the value of your time. Punctuality and reliability are at the heart of our service.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="tours" className="section tours">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Signature Experiences</p>
              <h2>Curated Private Tours</h2>
              <p className="section-intro max-720">
                <span className="desktop-only">Scenic drives, iconic landmarks, and bespoke itineraries designed for families, couples, and corporate
                travellers.</span>
                <span className="mobile-only">Scenic drives, iconic landmarks, and bespoke itineraries.</span>
              </p>
            </header>
            <div className="cards-grid" aria-live="polite">
              {tours.slice(0, 3).map((tour) => (
                <article className="card tour-card soft" key={tour.id}>
                  {tour.image && (
                    <div className="tour-image-wrapper">
                      <img src={tour.image} alt={tour.name} className="tour-image" loading="lazy" />
                    </div>
                  )}
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{tour.name}</h3>
                      <p className="tour-duration">{tour.duration}</p>
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
                    {tour.promotion ? (
                      <span className="badge badge-gold" aria-label="Holiday promotion">
                        {tour.promotion}
                      </span>
                    ) : null}
                  </div>
                  <p className="card-meta">{tour.description}</p>
                  <ul className="tour-highlights">
                    {tour.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className="card-footer">
                    <div>
                      <div className="tour-price">{tour.priceFrom}</div>
                      <div className="rating">
                        <span className="stars" aria-hidden="true">
                          {formatStars(tour.rating)}
                        </span>
                        <span>Rated {tour.rating.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <Link to={`/tours/${tour.id}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link to="/tours" className="btn btn-primary">
                View All Tours
              </Link>
            </div>
          </div>
        </section>

        <section id="vehicles" className="section vehicles">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Fleet</p>
              <h2>Luxury Vehicles for Every Journey</h2>
            </header>
            <div className="cards-grid vehicles-grid" aria-live="polite">
              {vehicles.map((vehicle) => (
                <article className="card soft" key={vehicle.name}>
                  {vehicle.image && (
                    <div className="vehicle-image-wrapper">
                      <img src={vehicle.image} alt={vehicle.name} className="vehicle-image" loading="lazy" />
                    </div>
                  )}
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{vehicle.name}</h3>
                      <p className="card-meta">{vehicle.tag}</p>
                    </div>
                    <span className="badge badge-teal">Fleet</span>
                  </div>
                  <div className="card-body">
                    <div className="vehicle-capacity">
                      <span className="chip">Capacity: {vehicle.capacity}</span>
                      <span className="chip">Luggage: {vehicle.luggage}</span>
                    </div>
                    <ul className="vehicle-features">
                      {vehicle.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="drivers" className="section drivers">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Drivers</p>
              <h2>Professional, Experienced, and Personable</h2>
              <p className="section-intro max-720">
                Our drivers are more than chauffeurs—they're your local guides, ensuring a safe, comfortable, and
                informative journey.
              </p>
            </header>
            <div className="cards-grid" aria-live="polite">
              {[...drivers].sort((a, b) => (b.rating || 0) - (a.rating || 0)).map((driver) => (
                <article className="card soft" key={driver.name}>
                  <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexDirection: "row-reverse" }}>
                    {driver.image && (
                      <img
                        src={driver.image}
                        alt={driver.name}
                        style={{
                          width: "160px",
                          height: "160px",
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
                      {driver.rating && (
                        <div className="rating" style={{ marginTop: "0.5rem" }}>
                          <span className="stars" aria-hidden="true">
                            {formatStars(driver.rating)}
                          </span>
                          <span style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>{driver.rating.toFixed(1)}</span>
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
                        <strong>Expertise:</strong>
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
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="reviews" className="section reviews">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Client Reviews</p>
              <h2>What Our Guests Say</h2>
            </header>
            <div className="cards-grid" aria-live="polite">
              {reviews.map((review, index) => (
                <article className="card soft" key={review.id || index}>
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{review.name}</h3>
                      <p className="card-meta">{review.tourName}</p>
                    </div>
                    <div className="rating">
                      <span className="stars" aria-hidden="true">
                        {formatStars(review.rating)}
                      </span>
                    </div>
                  </div>
                  <p className="card-body">{review.text}</p>
                  <div className="review-footer">
                    <span className="chip">{review.tourName}</span>
                    <span className="chip">Verified UNICAB traveller</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* MEMBERSHIP SECTION HIDDEN - Customer-facing only, no member features */}

        <section id="safety" className="section safety-emphasis">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Your Safety is Our Priority</p>
              <h2>Safe Travels with UNICAB</h2>
              <div className="section-intro max-720">
                <p className="desktop-only" style={{ fontSize: "1.1rem", lineHeight: "1.8", marginBottom: "1rem" }}>
                  <strong>UNICAB ensures the safety of all clients</strong> with road-worthy vehicles that meet the highest standards of maintenance and inspection. Our entire fleet undergoes regular safety checks to guarantee reliability and peace of mind on every journey.
                </p>
                <p className="mobile-only" style={{ fontSize: "1rem", lineHeight: "1.7", marginBottom: "1rem" }}>
                  <strong>UNICAB ensures the safety of all clients</strong> with road-worthy vehicles and regular safety inspections.
                </p>
                <p className="desktop-only" style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
                  <strong>South Africa is a safe place to visit</strong> in the hands of our expert drivers who know the city inside and out. With years of local experience, our professional chauffeurs navigate Cape Town's routes with confidence, ensuring you reach your destination safely and comfortably.
                </p>
                <p className="mobile-only" style={{ fontSize: "1rem", lineHeight: "1.7" }}>
                  <strong>South Africa is a safe place to visit</strong> with our expert drivers who know Cape Town inside and out.
                </p>
              </div>
            </header>
            <div className="why-grid" style={{ marginTop: "2.5rem" }}>
              <div className="why-card">
                <div className="why-icon">🛡️</div>
                <h3>Road-Worthy Vehicles</h3>
                <p>All vehicles undergo rigorous safety inspections and maintenance to ensure they meet the highest road safety standards.</p>
              </div>
              <div className="why-card">
                <div className="why-icon">🚗</div>
                <h3>Expert Local Drivers</h3>
                <p>Our experienced drivers know Cape Town's streets, routes, and traffic patterns, ensuring safe and efficient travel.</p>
              </div>
              <div className="why-card">
                <div className="why-icon">✅</div>
                <h3>Fully Licensed & Insured</h3>
                <p>Complete peace of mind with comprehensive insurance coverage and all necessary licenses and certifications.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section about slim">
          <div className="container section-inner center">
            <p className="eyebrow">About Us</p>
            <h2>Quietly Moving Cape Town's Guests Since 1989</h2>
            <div className="section-intro max-720" style={{ textAlign: "left", maxWidth: "900px" }}>
              <p className="desktop-only">
                Since its launch in 1989, the company has grown into one of the most recognizable 'people mover' brands
                in and around Cape Town.
              </p>
              <p className="mobile-only">
                Since 1989, we've grown into one of Cape Town's most recognizable transport brands.
              </p>
              <p className="desktop-only">
                From initially servicing the iconic Mount Nelson Hotel with a fleet of chauffeur driven luxury vehicles,
                UNICAB also became the first external operator of The Mount Nelson's Travel Desk. To date, we have
                exclusive service level agreements with more than 90% of Cape Town's Hotel & Guest House infrastructure
                along the Atlantic Seaboard, Cape Town's Waterfront hub, the inner city & the southern suburbs.
              </p>
              <p className="mobile-only">
                We service over 90% of Cape Town's hotels and guest houses with our luxury fleet.
              </p>
              <p className="desktop-only">
                Our expanding clientele base as well as our service diversification necessitated a rapid increase in
                our fleet of vehicles.
              </p>
              <p className="desktop-only">
                Rapid expansion & diversification also necessitated increasing investments in our fleet management
                systems. To better serve our clients and streamline operations, UNICAB is developing its own mobile
                application, which will be available soon.
              </p>
              <p className="desktop-only">
                With our advanced Vehicle Management Systems and commitment to innovation, UNICAB has managed to remain
                a market leader in safe and reliable transport solutions to the tourist, leisure and corporate markets.
              </p>
              <p className="mobile-only">
                A market leader in safe and reliable transport solutions with advanced fleet management systems.
              </p>
              <p className="desktop-only" style={{ marginTop: "1.5rem", fontStyle: "italic", color: "var(--text-soft)" }}>
                We no longer rely on old contracts but have built new relationships and pride ourselves on professional
                conduct and service excellence.
              </p>
              <p className="mobile-only" style={{ marginTop: "1rem", fontStyle: "italic", color: "var(--text-soft)" }}>
                Professional conduct and service excellence.
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="section contact">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Contact Us</p>
              <h2>Get in Touch</h2>
              <p className="section-intro max-720">
                Ready to plan your Cape Town adventure? Contact us today and let us create a personalized experience for
                you.
              </p>
            </header>
            <div className="contact-grid">
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                {successMsg && (
                  <div className="form-success" role="alert">
                    {successMsg}
                  </div>
                )}
                {errors.submit && (
                  <div className="form-error" role="alert">
                    {errors.submit}
                  </div>
                )}
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="name">Full Name</label>
                    <input type="text" id="name" name="name" required aria-invalid={!!errors.name} />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                  </div>
                  <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" required aria-invalid={!!errors.email} />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="phone">Phone</label>
                  <input type="tel" id="phone" name="phone" required aria-invalid={!!errors.phone} />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
                <div className="form-field">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5" required aria-invalid={!!errors.message}></textarea>
                  {errors.message && <span className="field-error">{errors.message}</span>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
              <aside className="contact-aside">
                <div className="contact-card">
                  <h3>Contact Information</h3>
                  <ul className="contact-list">
                    <li>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${siteConfig.email}`} style={{ color: "var(--accent-gold)", textDecoration: "none" }}>
                        {siteConfig.email}
                      </a>
                    </li>
                    <li>
                      <strong>Phone:</strong>{" "}
                      <a
                        href={siteConfig.whatsapp.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--accent-gold)", textDecoration: "none" }}
                      >
                        {siteConfig.whatsapp.displayNumber}
                      </a>
                    </li>
                    <li>
                      <strong>Hours:</strong> 24/7 Operations &amp; Dispatch
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            &copy; <span>{year}</span> UNICAB Travel &amp; Tours. All rights reserved.
          </p>
          <p className="footer-meta">Premium private transfers &amp; tours in Cape Town and the Western Cape.</p>
          <div className="footer-contact" style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-soft)" }}>
            <p style={{ margin: "0.25rem 0" }}>
              <a href={`mailto:${siteConfig.email}`} style={{ color: "var(--accent-gold)", textDecoration: "none", marginRight: "1rem" }}>
                {siteConfig.email}
              </a>
              <a
                href={siteConfig.whatsapp.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-gold)", textDecoration: "none", marginRight: "1rem" }}
              >
                {siteConfig.whatsapp.displayNumber}
              </a>
              <a
                href={siteConfig.website}
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
        href={siteConfig.whatsapp.linkWithMessage}
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

      {/* Back to Top Button */}
      <button
        className={`back-to-top ${showBackToTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </>
  );
}

export default Home;

