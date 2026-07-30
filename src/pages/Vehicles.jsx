import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { vehicles } from "../data";
import SafeImage from "../components/SafeImage";
import { siteConfig } from "../config";

function Vehicles() {
  
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
        <section className="section vehicles" style={{ paddingTop: "8rem" }}>
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Fleet</p>
              <h2>Luxury Vehicles for Every Journey</h2>
              <p className="section-intro max-720">
                From executive sedans to spacious minivans, our premium fleet is maintained to the highest standards
                for your comfort and safety.
              </p>
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
                href={siteConfig.whatsapp.directLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-gold)", textDecoration: "none", marginRight: "1rem" }}
              >
                {siteConfig.whatsapp.displayNumber}
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

export default Vehicles;

