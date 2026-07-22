import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMemberBookings } from '../lib/api';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';

function MemberDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Verify role is MEMBER
        if (payload.role !== 'MEMBER') {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }
        setUser({
          name: payload.name || payload.email?.split('@')[0] || 'Member',
          email: payload.email,
          role: payload.role
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('auth_token');
        navigate('/member/login');
      }
    } else {
      navigate('/member/login');
      return;
    }

    loadBookings();
  }, [navigate]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await getMemberBookings();
      if (error) {
        if (error.message?.includes('Authentication') || error.message?.includes('401')) {
          localStorage.removeItem('auth_token');
          navigate('/member/login');
          return;
        }
        console.error('Error loading bookings:', error);
      } else if (data) {
        setBookings(data);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    navigate('/');
  };

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date || b.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today && b.status !== 'cancelled';
  }).sort((a, b) => new Date(a.date || a.booking_date) - new Date(b.date || b.booking_date));

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date || b.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today || b.status === 'cancelled';
  }).sort((a, b) => new Date(b.date || b.booking_date) - new Date(a.date || a.booking_date));

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
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
              <h1 style={{ marginBottom: "0.5rem" }}>Member Dashboard</h1>
              <p style={{ color: "var(--text-soft)", marginBottom: "2rem", fontSize: "1.1rem" }}>
                Welcome back, {user?.name || 'Member'}!
              </p>

              {/* Subscription Status (Placeholder) */}
              <div style={{ 
                background: "white", 
                padding: "1.5rem", 
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                marginBottom: "2rem"
              }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.2rem" }}>Subscription Status</h2>
                <p style={{ color: "var(--text-soft)", margin: 0 }}>
                  Member benefits and subscription management coming soon.
                </p>
              </div>

              {/* Book a Tour Button */}
              <div style={{ marginBottom: "2rem" }}>
                <Link 
                  to="/tours" 
                  className="btn btn-primary"
                  style={{ 
                    textDecoration: "none",
                    display: "inline-block",
                    fontSize: "1rem",
                    padding: "1rem 2rem"
                  }}
                >
                  Book a Tour
                </Link>
              </div>

              {/* Upcoming Bookings */}
              <div style={{ 
                background: "white", 
                padding: "2rem", 
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                marginBottom: "2rem"
              }}>
                <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>My Bookings</h2>
                {upcomingBookings.length > 0 ? (
                  <div className="cards-grid">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="card soft">
                        <div className="card-header">
                          <h3 className="card-title">
                            {booking.tour_name || booking.tours?.name || 'Tour'}
                          </h3>
                          <p className="card-meta">
                            {new Date(booking.date || booking.booking_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                        <div className="card-body">
                          <p><strong>Group Size:</strong> {booking.group_size} {booking.group_size === 1 ? 'person' : 'people'}</p>
                          <p><strong>Status:</strong> <span style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            background: 
                              booking.status === 'confirmed' ? '#d4edda' :
                              booking.status === 'cancelled' ? '#f8d7da' : '#fff3cd',
                            color: 
                              booking.status === 'confirmed' ? '#155724' :
                              booking.status === 'cancelled' ? '#721c24' : '#856404'
                          }}>{booking.status?.toUpperCase() || 'PENDING'}</span></p>
                          <p><strong>Total:</strong> R{parseFloat(booking.total_price || booking.total_amount || 0).toLocaleString()}</p>
                          {booking.special_requests && (
                            <p><strong>Special Requests:</strong> {booking.special_requests}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: "2rem", 
                    textAlign: "center",
                    background: "var(--bg-soft)",
                    borderRadius: "8px"
                  }}>
                    <p style={{ color: "var(--text-soft)", marginBottom: "1rem" }}>
                      No upcoming bookings
                    </p>
                    <Link 
                      to="/tours" 
                      className="btn btn-primary"
                      style={{ textDecoration: "none" }}
                    >
                      Book Your First Tour
                    </Link>
                  </div>
                )}
              </div>

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <div style={{ 
                  background: "white", 
                  padding: "2rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Past Bookings</h2>
                  <div className="cards-grid">
                    {pastBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="card soft">
                        <div className="card-header">
                          <h3 className="card-title">
                            {booking.tour_name || booking.tours?.name || 'Tour'}
                          </h3>
                          <p className="card-meta">
                            {new Date(booking.date || booking.booking_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                        <div className="card-body">
                          <p><strong>Group Size:</strong> {booking.group_size}</p>
                          <p><strong>Status:</strong> {booking.status?.toUpperCase() || 'COMPLETED'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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

export default MemberDashboard;







