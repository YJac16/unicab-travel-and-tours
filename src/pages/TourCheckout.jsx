import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { createBooking, calculateTourPrice, createYocoPayment, formatTourPrice, getMemberSubscriptions } from "../lib/api";
import { applyMembershipDiscount, getMembershipDiscountLabel } from "../lib/pricing";

function TourCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    pickupAddress: "",
    acceptLegal: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [memberTier, setMemberTier] = useState(null);

  const { pax, date, time, tour, drivers, driver, packageId } = location.state || {};
  const selectedDrivers = Array.isArray(drivers) && drivers.length
    ? drivers
    : driver
      ? [driver]
      : [];
  const selectedDriver = selectedDrivers[0] || null;

  useEffect(() => {
    if (!pax || !date || !tour) {
      navigate(`/tours/${id}/booking`);
    }
  }, [pax, date, tour, id, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMemberSubscriptions();
        const now = Date.now();
        const active = (data || []).find(
          (s) =>
            s.status === "active" &&
            (!s.current_period_end || new Date(s.current_period_end).getTime() > now)
        );
        setMemberTier(active?.tier || null);
      } catch {
        setMemberTier(null);
      }
    })();
  }, []);

  if (!pax || !date || !tour) return null;

  const basePerPerson = calculateTourPrice(tour, pax);
  const pricePerPerson = memberTier
    ? applyMembershipDiscount(basePerPerson, memberTier)
    : basePerPerson;
  const totalPrice = pricePerPerson * pax;
  const discountLabel = getMembershipDiscountLabel(memberTier);

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
    if (!formData.pickupAddress.trim()) newErrors.pickupAddress = "Pickup address is required";
    if (!formData.acceptLegal) {
      newErrors.acceptLegal = "Please accept the Terms and Cancellation Policy to continue";
    }
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

      const secondDriver = selectedDrivers[1];
      const secondDriverNote = secondDriver
        ? `Second driver/guide: ${secondDriver.name || "Unnamed"} (${secondDriver.id || secondDriver.driver_id || "n/a"})`
        : null;

      const bookingData = {
        tour_id: tour.dbId || tour.id,
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
        status: "reserved",
        pickup_address: formData.pickupAddress.trim(),
        package_id: packageId || null,
        special_requests: secondDriverNote,
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
        <section className="section checkout-page">
          <div className="container">
            <div className="checkout-shell">
              <Link to={`/tours/${id}/booking`} className="btn btn-outline checkout-back">
                ← Back
              </Link>

              <p className="checkout-eyebrow">Checkout</p>
              <h1 className="checkout-title">Review &amp; pay</h1>
              <p className="checkout-lead">Confirm your journey details, then continue to secure YOCO payment.</p>

              <div className="checkout-panel">
                <h2>Review booking</h2>
                <div className="checkout-rows">
                  <div className="checkout-row">
                    <span>Tour</span>
                    <strong>{tour.name}</strong>
                  </div>
                  <div className="checkout-row">
                    <span>Date</span>
                    <strong>{new Date(date).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</strong>
                  </div>
                  {time && (
                    <div className="checkout-row">
                      <span>Start time</span>
                      <strong>{time}</strong>
                    </div>
                  )}
                  <div className="checkout-row">
                    <span>Guests</span>
                    <strong>{pax}</strong>
                  </div>
                  {selectedDrivers.length > 0 && (
                    <div className="checkout-row">
                      <span>Driver{selectedDrivers.length > 1 ? "s" : ""}</span>
                      <strong>{selectedDrivers.map((d) => d.name || "Driver").join(", ")}</strong>
                    </div>
                  )}
                  <div className="checkout-row">
                    <span>Price per person</span>
                    <strong>
                      {formatTourPrice(pricePerPerson)}
                      {discountLabel && basePerPerson !== pricePerPerson && (
                        <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" }}>
                          {discountLabel} (was {formatTourPrice(basePerPerson)})
                        </span>
                      )}
                    </strong>
                  </div>
                  <div className="checkout-row checkout-row-total">
                    <span>Total</span>
                    <span>{formatTourPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePayWithYoco}>
                <div className="checkout-panel">
                  <h3>Your details</h3>
                  <div className="checkout-name-grid">
                    <div className="checkout-field">
                      <label htmlFor="checkout-first-name">First name *</label>
                      <input
                        id="checkout-first-name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                      {errors.firstName && <p className="checkout-field-error">{errors.firstName}</p>}
                    </div>
                    <div className="checkout-field">
                      <label htmlFor="checkout-last-name">Last name *</label>
                      <input
                        id="checkout-last-name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                      {errors.lastName && <p className="checkout-field-error">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="checkout-email">Email *</label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <p className="checkout-field-error">{errors.email}</p>}
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="checkout-phone">Phone *</label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    {errors.phone && <p className="checkout-field-error">{errors.phone}</p>}
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="checkout-pickup">Pickup address *</label>
                    <input
                      id="checkout-pickup"
                      value={formData.pickupAddress}
                      onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                      placeholder="Hotel / address for pickup"
                    />
                    {errors.pickupAddress && <p className="checkout-field-error">{errors.pickupAddress}</p>}
                  </div>
                </div>

                <label className="checkout-legal">
                  <input
                    type="checkbox"
                    checked={formData.acceptLegal}
                    onChange={(e) =>
                      setFormData({ ...formData, acceptLegal: e.target.checked })
                    }
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" target="_blank" rel="noopener noreferrer">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/cancellation" target="_blank" rel="noopener noreferrer">
                      Cancellation Policy
                    </Link>
                    .
                  </span>
                </label>
                {errors.acceptLegal && (
                  <p className="checkout-field-error">{errors.acceptLegal}</p>
                )}

                <p className="checkout-note">
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
    </div>
  );
}

export default TourCheckout;
