import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { membershipPlans } from "../data";
import BackToTop from "../components/BackToTop";

function MembershipTransaction() {
  const { planId } = useParams();
  const navigate = useNavigate();
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
  const [success, setSuccess] = useState(false);

  const plan = membershipPlans.find(p => p.id === planId);

  useEffect(() => {
    if (!plan) {
      navigate("/membership/comparison");
    }
  }, [plan, navigate]);

  if (!plan) {
    return null;
  }

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
    } else if (!/^\d{13,19}$/.test(formData.cardNumber.replace(/\s/g, ""))) {
      newErrors.cardNumber = "Invalid card number";
    }
    if (!formData.expiryDate.trim()) {
      newErrors.expiryDate = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = "Format: MM/YY";
    }
    if (!formData.cvv.trim()) {
      newErrors.cvv = "CVV is required";
    } else if (!/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = "Invalid CVV";
    }
    if (!formData.cardName.trim()) newErrors.cardName = "Cardholder name is required";
    if (!formData.billingAddress.trim()) newErrors.billingAddress = "Billing address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    // Simulate payment processing
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      
      // Store transaction in localStorage (in real app, this would go to backend)
      const transaction = {
        id: Date.now().toString(),
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        date: new Date().toISOString(),
        status: "completed"
      };

      const transactions = JSON.parse(localStorage.getItem("unicab_transactions") || "[]");
      transactions.push(transaction);
      localStorage.setItem("unicab_transactions", JSON.stringify(transactions));

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/membership/success", { state: { transaction } });
      }, 3000);
    }, 2000);
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
                <Link className="link-button" to="/membership" onClick={() => setNavOpen(false)}>
                  Membership
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
          <div className="container">
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <Link 
                to="/membership/comparison" 
                className="btn btn-outline" 
                style={{ marginBottom: "2rem", textDecoration: "none" }}
              >
                ← Back to Plans
              </Link>

              <div style={{ 
                background: "var(--bg-soft)", 
                padding: "2rem", 
                borderRadius: "12px",
                marginBottom: "2rem",
                border: "1px solid var(--border-soft)"
              }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Complete Your Membership</h2>
                <p style={{ color: "var(--text-soft)", margin: 0 }}>
                  You're signing up for: <strong>{plan.name}</strong> - {plan.price}
                </p>
              </div>

              {success ? (
                <div style={{
                  textAlign: "center",
                  padding: "3rem",
                  background: "var(--accent-teal)",
                  color: "white",
                  borderRadius: "12px"
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
                  <h2 style={{ marginBottom: "1rem" }}>Payment Successful!</h2>
                  <p>Redirecting to confirmation page...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ 
                    background: "white", 
                    padding: "2rem", 
                    borderRadius: "12px",
                    border: "1px solid var(--border-soft)",
                    marginBottom: "2rem"
                  }}>
                    <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Personal Information</h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
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
                        {errors.firstName && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.firstName}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
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
                        {errors.lastName && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.lastName}</p>}
                      </div>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                        Email Address *
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
                      {errors.email && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.email}</p>}
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+27 82 123 4567"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${errors.phone ? "#e74c3c" : "var(--border-soft)"}`,
                          borderRadius: "8px",
                          fontSize: "0.9rem"
                        }}
                      />
                      {errors.phone && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.phone}</p>}
                    </div>
                  </div>

                  <div style={{ 
                    background: "white", 
                    padding: "2rem", 
                    borderRadius: "12px",
                    border: "1px solid var(--border-soft)",
                    marginBottom: "2rem"
                  }}>
                    <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Payment Information</h3>
                    
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
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
                      {errors.cardNumber && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.cardNumber}</p>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
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
                        {errors.cardName && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.cardName}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                          Expiry (MM/YY) *
                        </label>
                        <input
                          type="text"
                          value={formData.expiryDate}
                          onChange={handleExpiryChange}
                          placeholder="12/25"
                          maxLength="5"
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: `1px solid ${errors.expiryDate ? "#e74c3c" : "var(--border-soft)"}`,
                            borderRadius: "8px",
                            fontSize: "0.9rem"
                          }}
                        />
                        {errors.expiryDate && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.expiryDate}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
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
                        {errors.cvv && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.cvv}</p>}
                      </div>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                        Billing Address *
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
                      {errors.billingAddress && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.billingAddress}</p>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
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
                        {errors.city && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.city}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
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
                        {errors.postalCode && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.postalCode}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                          Country *
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            background: "var(--bg-soft)"
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    background: "var(--bg-soft)", 
                    padding: "1.5rem", 
                    borderRadius: "12px",
                    border: "1px solid var(--border-soft)",
                    marginBottom: "2rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>Total Amount:</span>
                      <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--accent-gold)" }}>
                        {plan.price}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", margin: 0 }}>
                      Your membership will be activated immediately after payment confirmation.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ width: "100%", fontSize: "1.1rem", padding: "1rem" }}
                  >
                    {submitting ? "Processing Payment..." : `Complete Payment - ${plan.price}`}
                  </button>

                  <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-soft)", marginTop: "1rem" }}>
                    🔒 Your payment information is secure and encrypted
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default MembershipTransaction;










