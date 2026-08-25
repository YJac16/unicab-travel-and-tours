import React from "react";
import { Link } from "react-router-dom";
import { vehicles } from "../data";
import DocumentTitle from "../components/DocumentTitle";
import PublicHeader from "../components/PublicHeader";
import SafeImage from "../components/SafeImage";
import SiteFooter from "../components/SiteFooter";

function Vehicles() {
  return (
    <>
      <DocumentTitle
        title="Fleet"
        description="UNICAB fleet for Cape Town transfers and tours — executive sedans, SUVs, minivans, and group shuttles."
      />
      <PublicHeader />

      <main>
        <section className="section vehicles page-section">
          <div className="container section-inner">
            <header className="section-header center">
              <p className="eyebrow">Our Fleet</p>
              <h1>Vehicles for every journey</h1>
              <p className="section-intro max-720">
                Comfortable, well-maintained vehicles for airport transfers, private tours, and corporate or staff transport.
              </p>
            </header>

            <div className="cards-grid vehicles-grid">
              {vehicles.map((vehicle) => (
                <article className="card soft" key={vehicle.name}>
                  {vehicle.image && (
                    <div className="vehicle-image-wrapper">
                      <SafeImage src={vehicle.image} alt={vehicle.name} className="vehicle-image" fallbackLabel={vehicle.name} />
                    </div>
                  )}
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">{vehicle.name}</h2>
                      <p className="card-meta">{vehicle.tag}</p>
                    </div>
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

            <div className="section-cta">
              <Link to="/book" className="btn btn-primary">
                Request a vehicle
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default Vehicles;
