import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { tours, vehicles } from "../data";
import { siteConfig } from "../config";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";
import { getPublicPriceLabel } from "../lib/pricing";

const SERVICES = [
  {
    title: "Private transfers",
    text: "Point-to-point chauffeur transfers across Cape Town and the Western Cape."
  },
  {
    title: "Airport transfers",
    text: "Reliable meet-and-greet transfers to and from Cape Town International Airport."
  },
  {
    title: "Staff & corporate transport",
    text: "Scheduled staff transport and discreet corporate chauffeur cover for teams and visitors."
  },
  {
    title: "Private tours",
    text: "Guided day tours and multi-day itineraries paced around your interests and schedule."
  }
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Tell us what you need",
    text: "Share dates, passengers, pickup points, and whether you need a transfer or a private tour."
  },
  {
    step: "2",
    title: "We confirm the details",
    text: "Our team confirms vehicle, timing, and itinerary so you know exactly what to expect."
  },
  {
    step: "3",
    title: "Travel with UNICAB",
    text: "A professional driver meets you on time in a comfortable, well-maintained vehicle."
  }
];

function Home() {
  const location = useLocation();
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (!data.phone || String(data.phone).trim().length < 7) {
      nextErrors.phone = "Please provide a valid contact number.";
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
          submit: result.message || result.error || "Something went wrong. Please try again."
        });
      }
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DocumentTitle
        title="Home"
        description="Private transfers, airport transfers, corporate transport, and private tours across Cape Town and the Western Cape with UNICAB."
      />
      <PublicHeader />

      <main>
        <section id="home" className="hero" aria-labelledby="hero-heading">
          <div className="hero-bg-image" />
          <div className="hero-overlay" />
          <div className="container hero-inner hero-centered">
            <h1 id="hero-heading">
              <span className="hero-brand">UNICAB</span>
              <span className="hero-title-main">Private travel across the Cape</span>
            </h1>
            <p className="hero-subtitle">
              Private transfers, airport meets, corporate transport, and guided tours with professional drivers and comfortable vehicles.
            </p>
            <div className="hero-actions">
              <Link to="/book" className="btn btn-primary" onClick={() => window.scrollTo(0, 0)}>
                Book Now
              </Link>
              <button type="button" className="btn btn-grey" onClick={() => scrollToSection("contact")}>
                Contact us
              </button>
            </div>
          </div>
        </section>

        <section id="services" className="section services" aria-labelledby="services-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">What we provide</p>
              <h2 id="services-heading">Core services</h2>
              <p className="section-intro max-720">
                UNICAB supports leisure and corporate travellers across Cape Town and the Western Cape.
              </p>
            </header>
            <div className="why-grid">
              {SERVICES.map((service) => (
                <div className="why-card" key={service.title}>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section why-unicab" aria-labelledby="why-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Why UNICAB</p>
              <h2 id="why-heading">Professional. Reliable. Local.</h2>
              <p className="section-intro max-720">
                Clear communication, punctual pickups, and drivers who know Cape Town routes beyond the postcard stops.
              </p>
            </header>
            <div className="why-grid">
              <div className="why-card">
                <h3>Professional drivers</h3>
                <p>Chauffeurs who focus on safety, discretion, and a calm guest experience.</p>
              </div>
              <div className="why-card">
                <h3>Comfortable vehicles</h3>
                <p>A maintained fleet suited to airport runs, hotel transfers, and full-day touring.</p>
              </div>
              <div className="why-card">
                <h3>On your schedule</h3>
                <p>Airport meets, staff transport, and private tours planned around your timing.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="vehicles" className="section vehicles" aria-labelledby="fleet-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Fleet</p>
              <h2 id="fleet-heading">Vehicles for every journey</h2>
              <p className="section-intro max-720">
                From executive sedans to group shuttles — choose the vehicle that fits your party and luggage.
              </p>
            </header>
            <div className="cards-grid vehicles-grid">
              {vehicles.slice(0, 4).map((vehicle) => (
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
                  </div>
                  <div className="card-body">
                    <div className="vehicle-capacity">
                      <span className="chip">Capacity: {vehicle.capacity}</span>
                      <span className="chip">Luggage: {vehicle.luggage}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="section-cta">
              <Link to="/vehicles" className="btn btn-outline">
                View full fleet
              </Link>
            </div>
          </div>
        </section>

        <section id="tours" className="section tours" aria-labelledby="tours-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Private tours</p>
              <h2 id="tours-heading">Cape Town &amp; the Western Cape</h2>
              <p className="section-intro max-720">
                City highlights, peninsula routes, winelands days, and multi-day journeys — privately guided around your interests.
              </p>
            </header>
            <div className="cards-grid">
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
                    </div>
                  </div>
                  <p className="card-meta">{tour.description}</p>
                  <div className="card-footer">
                    <div className="tour-price">{getPublicPriceLabel(tour)}</div>
                    <Link to={`/tours/${tour.id}`} className="btn btn-outline">
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="section-cta">
              <Link to="/tours" className="btn btn-primary">
                View all tours
              </Link>
            </div>
          </div>
        </section>

        <section className="section how-it-works" aria-labelledby="how-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Simple process</p>
              <h2 id="how-heading">How it works</h2>
            </header>
            <div className="why-grid">
              {HOW_IT_WORKS.map((item) => (
                <div className="why-card" key={item.step}>
                  <p className="step-number" aria-hidden="true">
                    {item.step}
                  </p>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="section about slim trust-section" aria-labelledby="trust-heading">
          <div className="container section-inner center">
            <p className="eyebrow">About UNICAB</p>
            <h2 id="trust-heading">Cape Town travel, handled with care</h2>
            <div className="section-intro max-720" style={{ textAlign: "left" }}>
              <p>
                UNICAB Travel &amp; Tours provides private transfers, airport transfers, staff and corporate transport, and private tours across Cape Town and the Western Cape.
              </p>
              <p>
                We focus on clear communication, comfortable vehicles, and professional drivers so your journey feels organised from first contact to final drop-off.
              </p>
            </div>
          </div>
        </section>

        <section className="section cta-band" aria-labelledby="cta-heading">
          <div className="container section-inner center">
            <h2 id="cta-heading">Ready to arrange your transfer or tour?</h2>
            <p className="section-intro max-720">
              Request a booking online or message us on WhatsApp with your dates and requirements.
            </p>
            <div className="hero-actions" style={{ justifyContent: "center" }}>
              <Link to="/book" className="btn btn-primary">
                Book Now
              </Link>
              <a
                className="btn btn-grey"
                href={siteConfig.whatsapp.linkWithMessage}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <button type="button" className="btn btn-outline" onClick={() => scrollToSection("contact")}>
                Send a message
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="section contact" aria-labelledby="contact-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Contact</p>
              <h2 id="contact-heading">Get in touch</h2>
              <p className="section-intro max-720">
                Tell us about your transfer, tour, or corporate transport needs and we will respond with next steps.
              </p>
            </header>
            <div className="contact-grid">
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                {successMsg && (
                  <div className="form-success" role="status">
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
                    <input type="text" id="name" name="name" required autoComplete="name" aria-invalid={!!errors.name} />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                  </div>
                  <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" required autoComplete="email" aria-invalid={!!errors.email} />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="phone">Phone</label>
                  <input type="tel" id="phone" name="phone" required autoComplete="tel" aria-invalid={!!errors.phone} />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
                <div className="form-field">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5" required aria-invalid={!!errors.message} />
                  {errors.message && <span className="field-error">{errors.message}</span>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
              <aside className="contact-aside">
                <div className="contact-card">
                  <h3>Contact information</h3>
                  <ul className="contact-list">
                    <li>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
                    </li>
                    <li>
                      <strong>Phone:</strong>{" "}
                      <a href={`tel:${siteConfig.phone.tel}`}>{siteConfig.phone.display}</a>
                    </li>
                    <li>
                      <strong>WhatsApp:</strong>{" "}
                      <a href={siteConfig.whatsapp.directLink} target="_blank" rel="noopener noreferrer">
                        {siteConfig.whatsapp.displayNumber}
                      </a>
                    </li>
                    <li>
                      <strong>Service area:</strong> Cape Town &amp; the Western Cape
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
