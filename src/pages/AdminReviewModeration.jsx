import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPendingReviews, approveReview, rejectReview } from '../lib/api';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function AdminReviewModeration() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'tour', 'driver'
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadReviews();
    }
  }, [isAdmin, filter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await getPendingReviews(filter === 'all' ? null : filter);
      if (error) {
        console.error('Error loading reviews:', error);
      } else {
        setReviews(data || []);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId, reviewType) => {
    setProcessing({ ...processing, [reviewId]: 'approving' });
    try {
      const { error } = await approveReview(reviewId, reviewType);
      if (error) {
        alert('Failed to approve review: ' + (error.message || 'Unknown error'));
      } else {
        // Remove from list
        setReviews(reviews.filter(r => r.id !== reviewId));
      }
    } catch (err) {
      alert('Error approving review: ' + err.message);
    } finally {
      setProcessing({ ...processing, [reviewId]: null });
    }
  };

  const handleReject = async (reviewId, reviewType) => {
    if (!confirm('Are you sure you want to reject and delete this review?')) {
      return;
    }
    
    setProcessing({ ...processing, [reviewId]: 'rejecting' });
    try {
      const { error } = await rejectReview(reviewId, reviewType);
      if (error) {
        alert('Failed to reject review: ' + (error.message || 'Unknown error'));
      } else {
        // Remove from list
        setReviews(reviews.filter(r => r.id !== reviewId));
      }
    } catch (err) {
      alert('Error rejecting review: ' + err.message);
    } finally {
      setProcessing({ ...processing, [reviewId]: null });
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main>
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
          <div className="container">
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <div style={{ marginBottom: "2rem" }}>
                <Link 
                  to="/admin/dashboard" 
                  className="btn btn-outline"
                  style={{ textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}
                >
                  ← Back to Dashboard
                </Link>
                <h1 style={{ marginTop: 0 }}>Review Moderation</h1>
                <p style={{ color: "var(--text-soft)" }}>
                  Review and approve or reject submitted reviews
                </p>
              </div>

              {/* Filter */}
              <div style={{ 
                marginBottom: "2rem", 
                display: "flex", 
                gap: "1rem", 
                flexWrap: "wrap",
                alignItems: "center"
              }}>
                <label style={{ fontWeight: "500" }}>Filter:</label>
                <button
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'btn btn-primary btn-compact' : 'btn btn-outline btn-compact'}
                >
                  All Reviews
                </button>
                <button
                  onClick={() => setFilter('tour')}
                  className={filter === 'tour' ? 'btn btn-primary btn-compact' : 'btn btn-outline btn-compact'}
                >
                  Tour Reviews
                </button>
                <button
                  onClick={() => setFilter('driver')}
                  className={filter === 'driver' ? 'btn btn-primary btn-compact' : 'btn btn-outline btn-compact'}
                >
                  Driver Reviews
                </button>
                <span style={{ marginLeft: "auto", color: "var(--text-soft)" }}>
                  {reviews.length} pending review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div style={{ 
                  padding: "3rem", 
                  textAlign: "center", 
                  background: "var(--bg-soft)", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <p style={{ color: "var(--text-soft)", fontSize: "1.1rem" }}>
                    No pending reviews to moderate.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      style={{
                        background: "white",
                        padding: "2rem",
                        borderRadius: "12px",
                        border: "1px solid var(--border-soft)",
                        boxShadow: "var(--shadow-soft)"
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "flex-start",
                        marginBottom: "1rem",
                        flexWrap: "wrap",
                        gap: "1rem"
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "1rem",
                            marginBottom: "0.5rem"
                          }}>
                            <span className="chip" style={{ 
                              backgroundColor: review.review_type === 'tour' 
                                ? "var(--accent-gold-soft)" 
                                : "var(--bg-soft)",
                              color: review.review_type === 'tour' 
                                ? "var(--accent-gold)" 
                                : "var(--text-main)"
                            }}>
                              {review.review_type === 'tour' ? 'Tour Review' : 'Driver Review'}
                            </span>
                            <div className="rating">
                              <span className="stars" aria-hidden="true">
                                {formatStars(review.rating)}
                              </span>
                              <span style={{ marginLeft: "0.5rem" }}>
                                {review.rating}/5
                              </span>
                            </div>
                          </div>
                          
                          {review.review_type === 'tour' && review.tours && (
                            <p style={{ margin: "0.25rem 0", fontWeight: "500" }}>
                              Tour: {review.tours.name || 'Unknown Tour'}
                            </p>
                          )}
                          
                          {review.review_type === 'driver' && review.drivers && (
                            <p style={{ margin: "0.25rem 0", fontWeight: "500" }}>
                              Driver: {review.drivers.name || 'Unknown Driver'}
                            </p>
                          )}
                          
                          {review.bookings && (
                            <p style={{ 
                              margin: "0.25rem 0", 
                              fontSize: "0.9rem", 
                              color: "var(--text-soft)" 
                            }}>
                              Booking: {review.bookings.customer_name} ({review.bookings.customer_email}) - {review.bookings.date}
                            </p>
                          )}
                          
                          <p style={{ 
                            margin: "0.5rem 0 0 0", 
                            fontSize: "0.9rem", 
                            color: "var(--text-soft)" 
                          }}>
                            Submitted: {new Date(review.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ 
                        marginBottom: "1.5rem",
                        padding: "1rem",
                        background: "var(--bg-soft)",
                        borderRadius: "8px"
                      }}>
                        <p style={{ margin: 0, lineHeight: "1.6" }}>{review.comment}</p>
                      </div>
                      
                      <div style={{ 
                        display: "flex", 
                        gap: "1rem", 
                        flexWrap: "wrap"
                      }}>
                        <button
                          onClick={() => handleApprove(review.id, review.review_type)}
                          disabled={processing[review.id]}
                          className="btn btn-primary btn-compact"
                        >
                          {processing[review.id] === 'approving' ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(review.id, review.review_type)}
                          disabled={processing[review.id]}
                          className="btn btn-outline btn-compact"
                          style={{ color: "#e74c3c", borderColor: "#e74c3c" }}
                        >
                          {processing[review.id] === 'rejecting' ? 'Rejecting...' : 'Reject & Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
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

export default AdminReviewModeration;

