import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDriverBookings, getDriverUnavailability, blockDriverDate, unblockDriverDate } from '../lib/api';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';

function DriverDashboard() {
  const { user, driverProfile } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, unavailabilityData] = await Promise.all([
        getDriverBookings(),
        getDriverUnavailability(),
      ]);

      if (bookingsData.data) {
        setBookings(bookingsData.data);
      }
      if (unavailabilityData.data) {
        setBlockedDates(unavailabilityData.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // If unauthorized, redirect to login
      if (error?.error?.message?.includes('Authentication') || error?.error?.message?.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDate = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    const { error } = await blockDriverDate(selectedDate, blockReason);
    if (!error) {
      setSelectedDate('');
      setBlockReason('');
      setShowBlockForm(false);
      loadData();
    } else {
      alert(error.message || 'Failed to block date');
    }
  };

  const handleUnblockDate = async (date) => {
    if (!confirm('Are you sure you want to unblock this date?')) {
      return;
    }

    const { error } = await unblockDriverDate(date);
    if (!error) {
      loadData();
    } else {
      alert(error.message || 'Failed to unblock date');
    }
  };

  // Filter only CONFIRMED bookings (as per requirements)
  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date || b.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today && b.status === 'confirmed';
  }).sort((a, b) => new Date(a.date || a.booking_date) - new Date(b.date || b.booking_date));

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date || b.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today || b.status === 'completed';
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
              <h1 style={{ marginBottom: "2rem" }}>Driver Dashboard</h1>

              {/* Upcoming Bookings */}
              <div style={{ 
                background: "white", 
                padding: "2rem", 
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                marginBottom: "2rem"
              }}>
                <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Upcoming Bookings</h2>
                {upcomingBookings.length > 0 ? (
                  <div className="cards-grid">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="card soft">
                        <div className="card-header">
                          <h3 className="card-title">
                            {booking.tours?.name || 'Tour'}
                          </h3>
                          <p className="card-meta">
                            {new Date(booking.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                        <div className="card-body">
                          <p><strong>Group Size:</strong> {booking.group_size} {booking.group_size === 1 ? 'person' : 'people'}</p>
                          <p><strong>Customer:</strong> {booking.customer_name}</p>
                          <p><strong>Email:</strong> {booking.customer_email}</p>
                          {booking.customer_phone && (
                            <p><strong>Phone:</strong> {booking.customer_phone}</p>
                          )}
                          <p><strong>Total:</strong> R{parseFloat(booking.total_price).toLocaleString()}</p>
                          <p><strong>Status:</strong> <span style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            background: booking.status === 'confirmed' ? '#d4edda' : '#fff3cd',
                            color: booking.status === 'confirmed' ? '#155724' : '#856404'
                          }}>{booking.status}</span></p>
                          {booking.special_requests && (
                            <p><strong>Special Requests:</strong> {booking.special_requests}</p>
                          )}
                        </div>
                        <div className="card-footer">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                              className="btn btn-primary"
                              style={{ marginRight: "0.5rem" }}
                            >
                              Confirm
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                              className="btn btn-primary"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-soft)" }}>No upcoming bookings</p>
                )}
              </div>

              {/* Block Dates */}
              <div style={{ 
                background: "white", 
                padding: "2rem", 
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                marginBottom: "2rem"
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0 }}>Block Unavailable Dates</h2>
                  <button
                    onClick={() => setShowBlockForm(!showBlockForm)}
                    className="btn btn-outline"
                  >
                    {showBlockForm ? 'Cancel' : 'Block Date'}
                  </button>
                </div>

                {showBlockForm && (
                  <form onSubmit={handleBlockDate} style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-soft)", borderRadius: "8px" }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "8px"
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                        Reason (optional)
                      </label>
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="e.g., Vacation, Maintenance"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "8px"
                        }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Block Date
                    </button>
                  </form>
                )}

                {blockedDates.length > 0 ? (
                  <div>
                    <h3 style={{ marginBottom: "1rem" }}>Blocked Dates</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                      {blockedDates.map((block) => (
                        <div key={block.id} style={{
                          padding: "1rem",
                          background: "var(--bg-soft)",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: "600" }}>
                              {new Date(block.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </p>
                            {block.reason && (
                              <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-soft)" }}>
                                {block.reason}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleUnblockDate(block.date)}
                            className="btn btn-outline"
                            style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "var(--text-soft)" }}>No blocked dates</p>
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
                            {booking.tours?.name || 'Tour'}
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
                          <p><strong>Customer:</strong> {booking.customer_name}</p>
                          <p><strong>Status:</strong> {booking.status || 'completed'}</p>
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

export default DriverDashboard;










