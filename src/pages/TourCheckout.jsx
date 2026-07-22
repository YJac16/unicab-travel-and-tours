import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { createBooking, calculateTourPrice, createYocoPayment, formatTourPrice } from "../lib/api";
import BackToTop from "../components/BackToTop";

function TourCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { pax, date, time, tour, drivers, driver } = location.state || {};
  const selectedDriver = drivers?.[0] || driver || null;

  useEffect(() => {
    if (!pax || !date || !tour) {
      navigate(`/tours/${id}/booking`);
    }
  }, [pax, date, tour, id, navigate]);

  if (!pax || !date || !tour) return null;

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayWithYoco = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!totalPrice || totalPrice <= 0) {
      alert("Unable to calculate price for this group size. Please contact us.");
      return;
    }

    setSubmitting(true);

    try {
      let userId = null;
      try {
        const { supabase } = await import("../lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      } catch {
        // guest checkout
      }

      const bookingData = {
        tour_id: tour.id,
        driver_id: selectedDriver?.id || selectedDriver?.driver_id || null,
        user_id: userId,
        customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
        customer_email: formData.email,
        customer_phone: formData.phone,
        date,
        time: time || null,
        group_size: pax,
        price_per_person: pricePerPerson,
        total_price: totalPrice,
        status: "reserved"
      };

      const { data: booking, error } = await createBooking(bookingData);
      if (error || !booking?.id) {
        alert(
          error?.message ||
            error?.error ||
            "Failed to create booking. Please try again."
        );
        setSubmitting(false);
        return;
      }

      // Require a real server booking (UUID) before charging with YOCO
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(booking.id))) {
        alert("Booking could not be saved on the server. Please try again or contact us.");
        setSubmitting(false);
        return;
      }

      const amountInCents = Math.round(Number(totalPrice) * 100);
      const { data: payment, error: paymentError } = await createYocoPayment(
        amountInCents,
        booking.id,
        { description: `${tour.name} — ${pax} guest(s)` }
      );

      const redirectUrl = payment?.redirectUrl || payment?.data?.redirectUrl;
      if (paymentError || !redirectUrl) {
        alert(
          paymentError?.message ||
            paymentError?.error ||
            "Failed to start YOCO checkout. Please check payment configuration and try again."
        );
        setSubmitting(false);
        return;
      }

      // Hand off to YOCO hosted payment page
      window.location.assign(redirectUrl);
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>
        </div>
      </header>

      <main>
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
          <div className="container">
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <Link to={`/tours/${id}/booking`} className="btn btn-outline" style={{ marginBottom: "2rem", textDecoration: "none" }}>
                ← Back
              </Link>

              <div style={{
                background: "var(--bg-soft)",
                padding: "2rem",
                borderRadius: "12px",
                marginBottom: "2rem",
                border: "1px solid var(--border-soft)"
              }}>
                <h2 style={{ marginTop: 0 }}>Review Booking</h2>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-soft)" }}>Tour</span>
                    <strong>{tour.name}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-soft)" }}>Date</span>
                    <strong>{new Date(date).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</strong>
                  </div>
                  {time && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-soft)" }}>Start time</span>
                      <strong>{time}</strong>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-soft)" }}>Guests</span>
                    <strong>{pax}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-soft)" }}>Price per person</span>
                    <strong>{formatTourPrice(pricePerPerson)}</strong>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "0.75rem",
                    borderTop: "2px solid var(--border-soft)",
                    color: "var(--accent-gold)",
                    fontSize: "1.2rem",
                    fontWeight: 700
                  }}>
                    <span>Total</span>
                    <span>{formatTourPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePayWithYoco}>
                <div style={{
                  background: "white",
                  padding: "2rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)",
                  marginBottom: "1.5rem"
                }}>
                  <h3 style={{ marginTop: 0 }}>Your Details</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label>First name *</label>
                      <input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        style={{ width: "100%", padding: "0.75rem", marginTop: "0.35rem", borderRadius: "8px", border: "1px solid var(--border-soft)" }}
                      />
                      {errors.firstName && <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>{errors.firstName}</p>}
                    </div>
                    <div>
                      <label>Last name *</label>
                      <input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        style={{ width: "100%", padding: "0.75rem", marginTop: "0.35rem", borderRadius: "8px", border: "1px solid var(--border-soft)" }}
                      />
                      {errors.lastName && <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>{errors.lastName}</p>}
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: "100%", padding: "0.75rem", marginTop: "0.35rem", borderRadius: "8px", border: "1px solid var(--border-soft)" }}
                    />
                    {errors.email && <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>{errors.email}</p>}
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <label>Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: "100%", padding: "0.75rem", marginTop: "0.35rem", borderRadius: "8px", border: "1px solid var(--border-soft)" }}
                    />
                    {errors.phone && <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>{errors.phone}</p>}
                  </div>
                </div>

                <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                  You will be redirected to YOCO Checkout to pay securely. Your booking is confirmed after payment succeeds.
                </p>

                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%", padding: "1rem", fontSize: "1.05rem" }}>
                  {submitting ? "Redirecting to YOCO..." : `Pay ${formatTourPrice(totalPrice)} with YOCO`}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <BackToTop />
    </div>
  );
}

export default TourCheckout;
