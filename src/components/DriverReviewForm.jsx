import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { verifyCustomerBooking, submitDriverReview } from "../lib/api";

function DriverReviewForm({ driverId, bookingId, onReviewSubmit }) {
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasBooking, setHasBooking] = useState(false);
  const [checkingBooking, setCheckingBooking] = useState(true);

  useEffect(() => {
    const checkBooking = async () => {
      if (!isAuthenticated || !user || !bookingId) {
        setCheckingBooking(false);
        setHasBooking(isAuthenticated);
        return;
      }

      try {
        const { data } = await verifyCustomerBooking(bookingId, user.id);
        setHasBooking(!!data?.completed || !!data?.exists);
      } catch (err) {
        console.error('Error checking booking:', err);
        setHasBooking(isAuthenticated);
      } finally {
        setCheckingBooking(false);
      }
    };

    checkBooking();
  }, [isAuthenticated, user, bookingId]);

  const validate = () => {
    const newErrors = {};
    if (rating === 0) newErrors.rating = "Please select a rating";
    if (!comment.trim() || comment.trim().length < 10) {
      newErrors.comment = "Review must be at least 10 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const { data, error } = await submitDriverReview({
        driverId,
        bookingId: bookingId || null,
        userId: user.id,
        rating,
        comment: comment.trim()
      });

      if (error) throw new Error(error.message || 'Failed to submit review');

      setSuccess(true);
      if (onReviewSubmit) onReviewSubmit(data);
    } catch (error) {
      setErrors({ submit: error.message || "Failed to submit review. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="card soft" style={{ padding: "1.5rem" }}>
        <p style={{ margin: 0 }}>
          <Link to="/login">Sign in</Link> to leave a driver review.
        </p>
      </div>
    );
  }

  if (checkingBooking) {
    return <p style={{ color: "var(--text-soft)" }}>Checking booking...</p>;
  }

  if (success) {
    return (
      <div className="card soft" style={{ padding: "1.5rem", background: "#d4edda", borderColor: "#c3e6cb" }}>
        <p style={{ margin: 0, color: "#155724" }}>
          Thank you! Your review was submitted and will appear after moderation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card soft" style={{ padding: "1.5rem" }}>
      <h3 style={{ marginTop: 0 }}>Review This Driver</h3>
      {!hasBooking && !bookingId && (
        <p style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>
          Reviews from completed bookings help other guests choose confidently.
        </p>
      )}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>Rating *</label>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.75rem",
                lineHeight: "1",
                color: (hoverRating || rating) >= star ? "var(--accent-gold)" : "var(--border-soft)"
              }}
              aria-label={`${star} stars`}
            >
              ★
            </button>
          ))}
        </div>
        {errors.rating && <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>{errors.rating}</p>}
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>Your review *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-soft)" }}
        />
        {errors.comment && <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>{errors.comment}</p>}
      </div>
      {errors.submit && <p style={{ color: "#e74c3c" }}>{errors.submit}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

export default DriverReviewForm;
