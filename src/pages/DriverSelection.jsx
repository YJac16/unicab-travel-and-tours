import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { drivers } from "../data";
import BackToTop from "../components/BackToTop";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function DriverSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverBookings, setDriverBookings] = useState({});

  const { pax, date, tour } = location.state || {};

  useEffect(() => {
    // Check if we have the required booking data
    if (!pax || !date || !tour) {
      console.log("Missing booking data, redirecting to booking page:", { pax, date, tour });
      // Try to preserve tour ID if available
      if (id) {
        navigate(`/tours/${id}/booking`, { replace: true });
      } else {
        navigate("/tours", { replace: true });
      }
      return;
    }
    
    console.log("Driver selection page loaded with:", { pax, date, tour: tour.name });

    // Load existing bookings from localStorage
    const bookings = JSON.parse(localStorage.getItem("unicab_bookings") || "[]");
    const bookingsByDriver = {};

    // Normalize dates for comparison (YYYY-MM-DD format)
    const normalizeDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return d.toISOString().split("T")[0];
    };

    const selectedDateNormalized = normalizeDate(date);

    bookings.forEach((booking) => {
      const bookingDateNormalized = normalizeDate(booking.date);
      if (bookingDateNormalized === selectedDateNormalized && booking.status !== "cancelled") {
        if (!bookingsByDriver[booking.driverName]) {
          bookingsByDriver[booking.driverName] = [];
        }
        bookingsByDriver[booking.driverName].push(booking);
      }
    });

    setDriverBookings(bookingsByDriver);
  }, [pax, date, tour, id, navigate]);

  if (!pax || !date || !tour) return null;

  const isDriverAvailable = (driverName) => {
    // Check if driver has bookings on this date
    const bookings = driverBookings[driverName] || [];
    return bookings.length === 0;
  };

  const availableDrivers = drivers.filter(driver => isDriverAvailable(driver.name));
  const unavailableDrivers = drivers.filter(driver => !isDriverAvailable(driver.name));

  const handleContinue = () => {
    if (!selectedDriver) {
      alert("Please select a driver");
      return;
    }

    const plainTour = tour
      ? JSON.parse(JSON.stringify({ ...tour, getPrice: undefined }))
      : null;
    const plainDriver = selectedDriver
      ? JSON.parse(JSON.stringify({ ...selectedDriver }))
      : null;

    navigate(`/tours/${id}/checkout`, {
      state: { pax, date, tour: plainTour, driver: plainDriver, drivers: plainDriver ? [plainDriver] : [] }
    });
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
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="section" style={{ paddingTop: "clamp(6rem, 12vw, 8rem)", paddingBottom: "clamp(2rem, 6vw, 4rem)" }}>
          <div className="container">
            <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 clamp(0.5rem, 2vw, 1rem)" }}>
              <Link 
                to={`/tours/${id}/booking`}
                state={{ pax, date, tour }}
                className="btn btn-outline" 
                style={{ marginBottom: "2rem", textDecoration: "none", display: "inline-block" }}
              >
                ← Back
              </Link>

              <div style={{ 
                background: "var(--bg-soft)", 
                padding: "clamp(1rem, 3vw, 1.5rem)",
                borderRadius: "12px",
                marginBottom: "2rem",
                border: "1px solid var(--border-soft)"
              }}>
                <h1 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "clamp(1.3rem, 4vw, 2rem)" }}>Select Your Driver</h1>
                <div style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.95rem)", color: "var(--text-soft)" }}>
                  <p style={{ margin: "0.25rem 0", wordWrap: "break-word" }}><strong>Tour:</strong> {tour.name}</p>
                  <p style={{ margin: "0.25rem 0", wordWrap: "break-word" }}><strong>Date:</strong> {new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Group Size:</strong> {pax} {pax === 1 ? "person" : "people"}</p>
                </div>
              </div>

              {availableDrivers.length > 0 ? (
                <>
                  <h2 style={{ marginBottom: "1.5rem", fontSize: "clamp(1.2rem, 3.5vw, 1.5rem)" }}>Select an Available Driver</h2>
                  <p style={{ fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)", color: "var(--text-soft)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                    The following drivers are available on {new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. Click on a driver to select them.
                  </p>
                  <div className="cards-grid" style={{ marginBottom: "3rem" }}>
                    {availableDrivers.map((driver) => (
                      <article 
                        key={driver.name}
                        className="card soft driver-selection-card"
                        style={{
                          border: selectedDriver?.name === driver.name ? "2px solid var(--accent-gold)" : "1px solid var(--border-soft)",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          width: "100%",
                          maxWidth: "100%"
                        }}
                        onClick={() => setSelectedDriver(driver)}
                      >
                        <div className="card-header driver-selection-header" style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "1rem",
                          flexDirection: "row-reverse",
                          flexWrap: "wrap"
                        }}>
                          {driver.image && (
                            <img
                              src={driver.image}
                              alt={driver.name}
                              className="driver-selection-image"
                              style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid var(--border-gold)",
                                flexShrink: 0
                              }}
                            />
                          )}
                          <div className="driver-selection-info" style={{ 
                            flex: "1 1 200px", 
                            minWidth: 0
                          }}>
                            <h3 className="card-title" style={{ 
                              wordWrap: "break-word"
                            }}>{driver.name}</h3>
                            <p className="card-meta" style={{ 
                              wordWrap: "break-word"
                            }}>{driver.experience}</p>
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
                              {driver.skills.slice(0, 2).map((skill, idx) => (
                                <li key={idx} style={{ marginBottom: "0.3rem" }}>
                                  {skill}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedDriver?.name === driver.name && (
                          <div style={{
                            marginTop: "1rem",
                            padding: "0.75rem",
                            background: "var(--accent-gold)",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            fontWeight: "600"
                          }}>
                            ✓ Selected
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{
                  padding: "2rem",
                  background: "var(--bg-soft)",
                  borderRadius: "12px",
                  textAlign: "center",
                  marginBottom: "2rem"
                }}>
                  <p style={{ fontSize: "1.1rem", color: "var(--text-soft)" }}>
                    No drivers available on this date. Please select a different date.
                  </p>
                  <Link 
                    to={`/tours/${id}/booking`}
                    state={{ pax, date, tour }}
                    className="btn btn-primary"
                    style={{ marginTop: "1rem", textDecoration: "none" }}
                  >
                    Change Date
                  </Link>
                </div>
              )}

              {unavailableDrivers.length > 0 && (
                <div style={{ 
                  marginTop: "2rem", 
                  padding: "1rem",
                  background: "var(--bg-soft)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", margin: 0, textAlign: "center" }}>
                    <strong>{unavailableDrivers.length}</strong> driver{unavailableDrivers.length !== 1 ? "s are" : " is"} already booked on this date and not available for selection.
                  </p>
                </div>
              )}

              {availableDrivers.length > 0 && (
                <div style={{ marginTop: "3rem", padding: "0 0.5rem" }}>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!selectedDriver}
                    className="btn btn-primary"
                    style={{ 
                      width: "100%", 
                      fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", 
                      padding: "clamp(0.75rem, 2vw, 1rem)",
                      opacity: selectedDriver ? 1 : 0.5,
                      cursor: selectedDriver ? "pointer" : "not-allowed"
                    }}
                  >
                    {selectedDriver ? "Continue to Checkout" : "Please Select a Driver"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default DriverSelection;

