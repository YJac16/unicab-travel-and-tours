import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { tours, vehicles } from "../data";
import { siteConfig, whatsappEnquiryUrl } from "../config";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";

const SERVICES = [
  {
    title: "Private transfers",
    text: "Point-to-point chauffeur travel across Cape Town and the Western Cape — hotel, city, and Winelands routes."
  },
  {
    title: "Airport transfers",
    text: "Meet-and-greet arrivals and departures at Cape Town International — calm, coordinated, on time."
  },
  {
    title: "Staff & corporate transport",
    text: "Scheduled staff shuttles and discreet executive chauffeur cover for teams, visitors, and events."
  },
  {
    title: "Private tours",
    text: "City highlights, peninsula days, Winelands tastings, and multi-day itineraries at your pace."
  }
];

const TRUST_POINTS = [
  {
    title: "Local knowledge",
    text: "Professional understanding of Cape Town routes, neighbourhoods, and Western Cape destinations."
  },
  {
    title: "Premium fleet",
    text: "Well-maintained sedans, MPVs, and group vehicles suited to private travel and touring."
  },
  {
    title: "Private experience",
    text: "Discreet, calm, and professionally operated — never crowded or rushed."
  },
  {
    title: "Flexible journeys",
    text: "Airport runs, corporate cover, private tours, and custom itineraries shaped around you."
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
              Private journeys. Professional drivers. Your itinerary — transfers, airport meets, corporate cover, and guided tours.
            </p>
            <p className="hero-contact">
              <a
                href={siteConfig.whatsapp.linkWithMessage}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp us
              </a>
              <span aria-hidden="true"> · </span>
              <span>{siteConfig.whatsapp.displayNumber}</span>
            </p>
            <div className="hero-actions">
              <a
                className="btn btn-primary"
                href={siteConfig.whatsapp.linkWithMessage}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <button type="button" className="btn btn-grey" onClick={() => scrollToSection("contact")}>
                Enquire
              </button>
            </div>
          </div>
        </section>

        <section id="services" className="section services" aria-labelledby="services-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">What we provide</p>
              <h2 id="services-heading">Chauffeur &amp; touring services</h2>
              <p className="section-intro max-720">
                Ways to move through Cape Town and the Western Cape — private journeys at your pace.
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

        <section id="vehicles" className="section vehicles" aria-labelledby="fleet-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our fleet</p>
              <h2 id="fleet-heading">Vehicles for every journey</h2>
              <p className="section-intro max-720">
                From executive sedans to premium group travel — we recommend the right vehicle when you enquire.
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
                City highlights, peninsula routes, Winelands days, and multi-day journeys — privately guided around your interests.
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
                    <span className="tour-price">Quote on request</span>
                    <div className="card-actions">
                      <a
                        className="btn btn-primary btn-compact"
                        href={whatsappEnquiryUrl(`Hello, I'd like a quote for the UNICAB tour: ${tour.name}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                      <Link to={`/tours/${tour.id}`} className="btn btn-outline btn-compact">
                        View details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="section-cta">
              <Link to="/tours" className="btn btn-outline">
                View all tours
              </Link>
            </div>
          </div>
        </section>

        <section className="section why-unicab trust-section" aria-labelledby="trust-heading">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Why UNICAB</p>
              <h2 id="trust-heading">Premium private travel, Cape Town first</h2>
              <p className="section-intro max-720">
                A trusted chauffeur and touring partner across Cape Town and the Western Cape.
              </p>
            </header>
            <div className="why-grid">
              {TRUST_POINTS.map((point) => (
                <div className="why-card" key={point.title}>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </div>
              ))}
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

        <section id="about" className="section about slim" aria-labelledby="about-heading">
          <div className="container section-inner center">
            <p className="eyebrow">About UNICAB</p>
            <h2 id="about-heading">Cape Town travel, handled with care</h2>
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
            <h2 id="cta-heading">Where will you travel next?</h2>
            <p className="section-intro max-720">
              Tell us where you&apos;re going, who&apos;s travelling, and how you&apos;d like to experience the Cape. We&apos;ll recommend the right journey and vehicle.
            </p>
            <p className="hero-contact cta-band-contact">
              <a
                href={siteConfig.whatsapp.linkWithMessage}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp us
              </a>
              <span aria-hidden="true"> · </span>
              <span>{siteConfig.whatsapp.displayNumber}</span>
            </p>
            <div className="hero-actions" style={{ justifyContent: "center" }}>
              <a
                className="btn btn-primary"
                href={siteConfig.whatsapp.linkWithMessage}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <button type="button" className="btn btn-grey" onClick={() => scrollToSection("contact")}>
                Enquire
              </button>
              <a className="btn btn-outline" href={`mailto:${siteConfig.email}`}>
                Email us
              </a>
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
                  {submitting ? "Sending..." : "Send enquiry"}
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
                      <a href={siteConfig.whatsapp.linkWithMessage} target="_blank" rel="noopener noreferrer">
                        {siteConfig.whatsapp.displayNumber}
                      </a>
                    </li>
                    <li>
                      <strong>Service area:</strong> Cape Town &amp; the Western Cape
                    </li>
                  </ul>
                  <div className="contact-card-actions">
                    <a
                      className="btn btn-primary btn-compact"
                      href={siteConfig.whatsapp.linkWithMessage}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
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
