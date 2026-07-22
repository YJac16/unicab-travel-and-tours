import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import BackToTop from "../components/BackToTop";
import { calculateTourPrice } from "../lib/api";

function TourTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    billingAddress: "",
    city: "",
    postalCode: "",
    country: "South Africa"
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { pax, date, time, tour, drivers } = location.state || {};
  const driver = drivers?.[0] || location.state?.driver;

  useEffect(() => {
    if (!pax || !date || !tour || !driver) {
      navigate(`/tours/${id}/booking`);
      return;
    }
  }, [pax, date, tour, driver, id, navigate]);

  if (!pax || !date || !tour || !driver) return null;

  const pricePerPerson = calculateTourPrice(tour, pax);
  const totalPrice = pricePerPerson * pax;

  const validate = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = "Card number is required";
    } else if (formData.cardNumber.replace(/\s/g, "").length < 13) {
      newErrors.cardNumber = "Invalid card number";
    }
    if (!formData.expiryDate.trim()) {
      newErrors.expiryDate = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = "Invalid format (MM/YY)";
    }
    if (!formData.cvv.trim()) {
      newErrors.cvv = "CVV is required";
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = "Invalid CVV";
    }
    if (!formData.cardName.trim()) newErrors.cardName = "Cardholder name is required";
    if (!formData.billingAddress.trim()) newErrors.billingAddress = "Billing address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendConfirmationEmail = async (booking) => {
    // In a real app, this would call your backend API to send an email
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, you would call your email API here
      // await fetch('/api/send-booking-confirmation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ booking, email: formData.email })
      // });
      
      return true;
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (!validationErrors) {
      setErrors(validate());
      return;
    }

    setSubmitting(true);
    setErrors({});

    // Process payment and create booking
    try {
      const driverId = driver.id || driver.driver_id;
      const tourId = tour.id;

      const { time } = location.state || {};
      
      const bookingData = {
        tour_id: tourId,
        driver_id: driverId,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone || null,
        date: date,
        time: time || null,
        group_size: pax,
        price_per_person: pricePerPerson,
        total_price: totalPrice,
        status: 'pending',
        special_requests: null
      };

      const { data: booking, error } = await createBooking(bookingData);

      if (error) {
        console.error('Error creating booking:', error);
        alert('Failed to process payment. Please try again.');
        setSubmitting(false);
        return;
      }

      // Send confirmation email
      const emailSent = await sendConfirmationEmail({
        ...booking,
        tourName: tour.name,
        driverName: driver.name || driver.driver_name,
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        }
      });

      // Navigate to confirmation
      setTimeout(() => {
        navigate(`/tours/${id}/confirmation`, {
          state: { 
            booking: {
              ...booking,
              tourName: tour.name,
              driverName: driver.name || driver.driver_name,
              pax,
              date,
              pricePerPerson,
              totalPrice,
              customer: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone
              }
            }, 
            emailSent 
          }
        });
      }, 500);
    } catch (error) {
      console.error('Error in payment processing:', error);
      alert('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData({ ...formData, cardNumber: formatted });
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    setFormData({ ...formData, expiryDate: value });
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
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
          <div className="container">
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
              <Link 
                to={`/tours/${id}/booking`}
                state={{ pax, date, tour, drivers: drivers || [driver] }}
                className="btn btn-outline" 
                style={{ marginBottom: "2rem", textDecoration: "none" }}
              >
                ← Back to Booking
              </Link>

              <div style={{ 
                background: "var(--bg-soft)", 
                padding: "2rem", 
                borderRadius: "12px",
                marginBottom: "2rem",
                border: "1px solid var(--border-soft)"
              }}>
                <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Complete Your Booking</h1>
                <h2 style={{ fontSize: "1.3rem", color: "var(--text-soft)", margin: 0 }}>
                  {tour.name}
                </h2>
              </div>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
                marginBottom: "2rem"
              }}>
                {/* Booking Summary */}
                <div style={{ 
                  background: "white", 
                  padding: "2rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)",
                  height: "fit-content"
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Booking Summary</h3>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "var(--text-soft)" }}>
                      <strong>Tour:</strong> {tour.name}
                    </p>
                    <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "var(--text-soft)" }}>
                      <strong>Date:</strong> {new Date(date).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "numeric" 
                      })}
                    </p>
                    <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "var(--text-soft)" }}>
                      <strong>Group Size:</strong> {pax} {pax === 1 ? "person" : "people"}
                    </p>
                    <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "var(--text-soft)" }}>
                      <strong>Driver{drivers?.length > 1 ? 's' : ''}:</strong>{" "}
                      {drivers?.map(d => d.name || d.driver_name).join(", ") || driver?.name || driver?.driver_name || "TBD"}
                    </p>
                  </div>

                  <div style={{ 
                    paddingTop: "1rem",
                    borderTop: "2px solid var(--border-soft)",
                    marginTop: "1rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: "var(--text-soft)" }}>Price per person:</span>
                      <strong>R{pricePerPerson.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: "var(--text-soft)" }}>Number of people:</span>
                      <strong>{pax}</strong>
                    </div>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      paddingTop: "1rem",
                      borderTop: "2px solid var(--border-soft)",
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      color: "var(--accent-gold)"
                    }}>
                      <span>Total:</span>
                      <span>R{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Form */}
                <div style={{ 
                  background: "white", 
                  padding: "2rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Payment Information</h3>

                  <form onSubmit={handleSubmit}>
                    {/* Personal Information */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Contact Details</h4>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: `1px solid ${errors.firstName ? "#e74c3c" : "var(--border-soft)"}`,
                              borderRadius: "8px",
                              fontSize: "0.9rem"
                            }}
                          />
                          {errors.firstName && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.firstName}</p>}
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: `1px solid ${errors.lastName ? "#e74c3c" : "var(--border-soft)"}`,
                              borderRadius: "8px",
                              fontSize: "0.9rem"
                            }}
                          />
                          {errors.lastName && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.lastName}</p>}
                        </div>
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: `1px solid ${errors.email ? "#e74c3c" : "var(--border-soft)"}`,
                            borderRadius: "8px",
                            fontSize: "0.9rem"
                          }}
                        />
                        {errors.email && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.email}</p>}
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: `1px solid ${errors.phone ? "#e74c3c" : "var(--border-soft)"}`,
                            borderRadius: "8px",
                            fontSize: "0.9rem"
                          }}
                        />
                        {errors.phone && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.phone}</p>}
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Card Details</h4>
                      
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                          Card Number *
                        </label>
                        <input
                          type="text"
                          value={formData.cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: `1px solid ${errors.cardNumber ? "#e74c3c" : "var(--border-soft)"}`,
                            borderRadius: "8px",
                            fontSize: "0.9rem"
                          }}
                        />
                        {errors.cardNumber && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.cardNumber}</p>}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                            Expiry Date (MM/YY) *
                          </label>
                          <input
                            type="text"
                            value={formData.expiryDate}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            maxLength="5"
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: `1px solid ${errors.expiryDate ? "#e74c3c" : "var(--border-soft)"}`,
                              borderRadius: "8px",
                              fontSize: "0.9rem"
                            }}
                          />
                          {errors.expiryDate && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.expiryDate}</p>}
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                            CVV *
                          </label>
                          <input
                            type="text"
                            value={formData.cvv}
                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, "").substring(0, 4) })}
                            placeholder="123"
                            maxLength="4"
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: `1px solid ${errors.cvv ? "#e74c3c" : "var(--border-soft)"}`,
                              borderRadius: "8px",
                              fontSize: "0.9rem"
                            }}
                          />
                          {errors.cvv && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.cvv}</p>}
                        </div>
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          value={formData.cardName}
                          onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: `1px solid ${errors.cardName ? "#e74c3c" : "var(--border-soft)"}`,
                            borderRadius: "8px",
                            fontSize: "0.9rem"
                          }}
                        />
                        {errors.cardName && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.cardName}</p>}
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Billing Address</h4>
                      
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                          Address *
                        </label>
                        <input
                          type="text"
                          value={formData.billingAddress}
                          onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: `1px solid ${errors.billingAddress ? "#e74c3c" : "var(--border-soft)"}`,
                            borderRadius: "8px",
                            fontSize: "0.9rem"
                          }}
                        />
                        {errors.billingAddress && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.billingAddress}</p>}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                            City *
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: `1px solid ${errors.city ? "#e74c3c" : "var(--border-soft)"}`,
                              borderRadius: "8px",
                              fontSize: "0.9rem"
                            }}
                          />
                          {errors.city && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.city}</p>}
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: `1px solid ${errors.postalCode ? "#e74c3c" : "var(--border-soft)"}`,
                              borderRadius: "8px",
                              fontSize: "0.9rem"
                            }}
                          />
                          {errors.postalCode && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.postalCode}</p>}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "8px",
                            fontSize: "0.9rem"
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                      style={{ 
                        width: "100%", 
                        fontSize: "1.1rem", 
                        padding: "1rem 2rem",
                        marginTop: "1rem"
                      }}
                    >
                      {submitting ? "Processing..." : `Pay R${totalPrice.toLocaleString()}`}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default TourTransaction;

