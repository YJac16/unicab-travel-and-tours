import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { tours, vehicles, drivers, membershipPlans } from "../data";
import { siteConfig } from "../config";
import DocumentTitle from "../components/DocumentTitle";
import ProfileDropdown from "../components/ProfileDropdown";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";
import { getPublicReviewsFeed } from "../lib/reviewsFeed";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

const navItems = [
  { id: "tours", label: "Tours", path: "/tours" },
  { id: "packages", label: "Packages", path: "/packages" },
  { id: "vehicles", label: "Vehicles", path: "/vehicles" },
  { id: "drivers", label: "Drivers", path: "/drivers" },
  { id: "reviews", label: "Reviews", path: "/reviews" },
  { id: "membership", label: "Membership", path: "/membership" },
  { id: "about", label: "About", path: null },
  { id: "contact", label: "Contact", path: null }
];

function Home() {
  const location = useLocation();
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReviewsLoading(true);
      const feed = await getPublicReviewsFeed(12);
      if (!cancelled) {
        setReviews(feed);
        setReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  };

  useEffect(() => {
    const hash = location.hash?.replace(/^#/, "");
    if (!hash) return;
    const timer = window.setTimeout(() => scrollToSection(hash), 50);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

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

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (response.ok && result.ok !== false) {
        setSuccessMsg(result.message || "Thank you! We'll be in touch soon.");
        e.target.reset();
      } else {
        setErrors({
          submit: result.message || result.error || "Something went wrong. Please try again.",
        });
      }
    } catch (err) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DocumentTitle
        title="Home"
        description="Premium private transfers and guided tours across Cape Town and the Western Cape with UNICAB."
      />
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
              {navItems.map((item) => (
                <li key={item.id}>
                  {item.path ? (
                    <Link 
                      className="link-button" 
                      to={item.path}
                      onClick={() => {
                        window.scrollTo(0, 0);
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a className="link-button" href={`#${item.id}`} onClick={() => { scrollToSection(item.id); }}>
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
              <li className="cta-nav">
                <a className="btn btn-primary" href="/book">
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
              <span className="hero-brand">UNICAB</span>
              <span className="hero-title-main">Private luxury across the Cape</span>
            </h1>
            <p className="hero-subtitle">
              Chauffeured transfers and guided tours with discretion, polish, and local mastery.
            </p>
            <div className="hero-actions">
              <Link to="/book" className="btn btn-primary" onClick={() => window.scrollTo(0, 0)}>
                Book Now
              </Link>
              <button type="button" className="btn btn-grey" onClick={() => scrollToSection("tours")}>
                Explore Tours
              </button>
            </div>
          </div>
        </section>

        <section className="section why-unicab">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Why UNICAB</p>
              <h2>Quiet luxury. Exact timing.</h2>
              <p className="section-intro max-720">
                Licensed chauffeurs, fully insured fleet, and itineraries paced for travellers who expect more than a tour bus.
              </p>
            </header>
            <div className="why-grid">
              <div className="why-card">
                <h3>Licensed &amp; insured</h3>
                <p>Every vehicle and chauffeur is fully licensed and comprehensively insured.</p>
              </div>
              <div className="why-card">
                <h3>Local mastery</h3>
                <p>Guides who know Cape Town beyond the postcard stops.</p>
              </div>
              <div className="why-card">
                <h3>On the minute</h3>
                <p>Airport meets, hotel runs, and day tours that respect your schedule.</p>
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
                      <SafeImage src={tour.image} alt={tour.name} className="tour-image" fallbackLabel={tour.name} />
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
                      <SafeImage src={vehicle.image} alt={vehicle.name} className="vehicle-image" fallbackLabel={vehicle.name} />
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
                      <SafeImage
                        src={driver.image}
                        alt={driver.name}
                        fallbackLabel={driver.name}
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
              {reviewsLoading && <p style={{ textAlign: "center", gridColumn: "1 / -1" }}>Loading reviews…</p>}
              {!reviewsLoading && reviews.map((review, index) => (
                <article className="card soft" key={review.id || index}>
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{review.name}</h3>
                      <p className="card-meta">
                        {review.target_name || review.tourName || (review.review_type === "driver" ? "Driver" : "Tour")}
                      </p>
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
                      {review.review_type === "driver" ? "Driver review" : "Tour review"}
                    </span>
                    <span className="chip">UNICAB guest</span>
                  </div>
                </article>
              ))}
              {!reviewsLoading && !reviews.length && (
                <p style={{ textAlign: "center", gridColumn: "1 / -1", color: "var(--text-soft)" }}>
                  Be the first to leave a review after your tour.
                </p>
              )}
            </div>
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <Link to="/reviews" className="btn btn-outline">See all reviews</Link>
            </div>
          </div>
        </section>

        <section id="membership" className="section membership">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Membership</p>
              <h2>Exclusive Travel Benefits</h2>
              <p className="section-intro max-720">
                Join for priority booking, preferred rates, and exclusive access. Choose the plan that suits your travel.
              </p>
            </header>
            <div className="cards-grid" aria-live="polite">
              {membershipPlans.map((plan) => (
                <article className="card soft" key={plan.id}>
                  <div className="card-header">
                    <h3 className="card-title">{plan.name}</h3>
                    <span className="badge badge-gold">{plan.price}</span>
                  </div>
                  {plan.shortDescription && (
                    <p style={{ fontSize: "0.9rem", color: "var(--text-soft)", marginBottom: "1rem", lineHeight: 1.6 }}>
                      {plan.shortDescription}
                    </p>
                  )}
                  <ul className="card-body">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="card-footer">
                    <Link className="btn btn-primary" to={`/membership/transaction/${plan.id}`}>
                      Join Now
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <Link to="/membership/comparison" className="btn btn-outline">
                Compare plans
              </Link>
            </div>
          </div>
        </section>

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
                        href={`tel:${siteConfig.phone.tel}`}
                        style={{ color: "var(--accent-gold)", textDecoration: "none" }}
                      >
                        {siteConfig.phone.display}
                      </a>
                      {" · "}
                      <a
                        href={siteConfig.whatsapp.directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--accent-gold)", textDecoration: "none" }}
                      >
                        WhatsApp
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

      <SiteFooter />
    </>
  );
}

export default Home;

