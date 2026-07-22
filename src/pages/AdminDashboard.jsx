import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAdminBookings, 
  getAdminDrivers, 
  createDriver,
  updateBookingStatus,
  updateDriverStatus,
  getDriverUnavailabilityAdmin,
  blockDriverDateAdmin,
  unblockDriverDateAdmin
} from '../lib/api';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';

// Add Driver Form Component
function AddDriverForm({ onDriverAdded }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSuccessData(null);
    setLoading(true);

    try {
      // Prepare data
      const driverData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        license_number: formData.license_number.trim() || null
      };

      const { data: responseData, error: createError } = await createDriver(driverData);
      
      if (createError) {
        setError(createError.message || createError.error || 'Failed to create driver');
      } else {
        // Handle response structure
        const driverInfo = responseData?.data || responseData;
        const message = 'Driver record created successfully!';
        setSuccess(message);
        setSuccessData(driverInfo);
        setFormData({ name: '', email: '', phone: '', license_number: '' });
        // Don't close form immediately - let admin see success message
        setTimeout(() => {
          setShowForm(false);
          setSuccess('');
          setSuccessData(null);
          onDriverAdded();
        }, 3000);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error creating driver:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: "white", 
      padding: "2rem", 
      borderRadius: "12px",
      border: "1px solid var(--border-soft)",
      marginBottom: "2rem"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showForm ? "1.5rem" : 0 }}>
        <h2 style={{ margin: 0 }}>Drivers</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError('');
            setSuccess('');
          }}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Driver'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
          {error && (
            <div style={{
              padding: "1rem",
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              marginBottom: "1rem",
              color: "#c33"
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: "1rem",
              background: "#dfd",
              border: "1px solid #cfc",
              borderRadius: "8px",
              marginBottom: "1rem",
              color: "#3c3"
            }}>
                  <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>{success}</div>
              {successData && (
                <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  <div><strong>Driver Name:</strong> {successData.name}</div>
                  <div><strong>Email:</strong> {successData.email}</div>
                  {successData.phone && <div><strong>Phone:</strong> {successData.phone}</div>}
                  {successData.license_number && <div><strong>License:</strong> {successData.license_number}</div>}
                  <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "#d4edda", borderRadius: "4px", fontSize: "0.85rem", color: "#155724" }}>
                    ✅ Driver record created and linked to user account
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "1rem", 
            marginBottom: "1rem" 
          }}>
            <div>
              <label htmlFor="driver-name" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                Driver Name *
              </label>
              <input
                type="text"
                id="driver-name"
                name="driver-name"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "8px"
                }}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="driver-email" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                Email *
              </label>
              <input
                type="email"
                id="driver-email"
                name="driver-email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "8px"
                }}
                placeholder="driver@example.com"
              />
            </div>

            <div>
              <label htmlFor="driver-phone" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                Phone
              </label>
              <input
                type="tel"
                id="driver-phone"
                name="driver-phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "8px"
                }}
                placeholder="+27123456789"
              />
            </div>

            <div>
              <label htmlFor="driver-license" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                License Number
              </label>
              <input
                type="text"
                id="driver-license"
                name="driver-license"
                autoComplete="off"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "8px"
                }}
                placeholder="DL123456"
              />
            </div>
          </div>

          <div style={{ 
            marginBottom: "1rem", 
            padding: "1rem", 
            background: "#d1ecf1", 
            borderRadius: "8px",
            border: "1px solid #0c5460",
            fontSize: "0.9rem"
          }}>
            <div style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#0c5460" }}>
              ℹ️ How It Works
            </div>
            <div style={{ color: "#0c5460" }}>
              <strong>For New Drivers:</strong> Leave password field empty to send an email invite, or provide a password for immediate access.
              <br />
              <strong>For Existing Users:</strong> If the user already exists in the system, this form will automatically link them as a driver (no password needed).
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Driver'}
          </button>
        </form>
      )}
    </div>
  );
}

// Driver Availability Manager Component
function DriverAvailabilityManager({ driver, unavailability, onBlockDate, onUnblockDate, onRefresh }) {
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);

  const handleBlock = async (e) => {
    e.preventDefault();
    if (!blockDate) return;
    await onBlockDate(driver.id, blockDate, blockReason);
    setBlockDate('');
    setBlockReason('');
    setShowBlockForm(false);
    onRefresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Blocked Dates</h3>
        <button
          onClick={() => setShowBlockForm(!showBlockForm)}
          className="btn btn-outline"
        >
          {showBlockForm ? 'Cancel' : 'Block Date'}
        </button>
      </div>

      {showBlockForm && (
        <form onSubmit={handleBlock} style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-soft)", borderRadius: "8px" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor={`block-date-${driver.id}`} style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
              Date
            </label>
            <input
              type="date"
              id={`block-date-${driver.id}`}
              name={`block-date-${driver.id}`}
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
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
            <label htmlFor={`block-reason-${driver.id}`} style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
              Reason (optional)
            </label>
            <input
              type="text"
              id={`block-reason-${driver.id}`}
              name={`block-reason-${driver.id}`}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g., Vehicle maintenance, Vacation"
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

      {unavailability.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {unavailability.map((block) => (
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
                onClick={() => {
                  if (confirm('Unblock this date?')) {
                    onUnblockDate(driver.id, block.date);
                    onRefresh();
                  }
                }}
                className="btn btn-outline"
                style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--text-soft)" }}>No blocked dates</p>
      )}
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverUnavailability, setDriverUnavailability] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    driver_id: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, driversData] = await Promise.all([
        getAdminBookings(filters),
        getAdminDrivers(),
      ]);

      if (bookingsData.data) setBookings(bookingsData.data);
      if (driversData.data) setDrivers(driversData.data);
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

  const loadDriverUnavailability = async (driverId) => {
    try {
      const { data } = await getDriverUnavailabilityAdmin(driverId);
      if (data) {
        setDriverUnavailability(data);
      }
    } catch (error) {
      console.error('Error loading driver unavailability:', error);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    const { error } = await updateBookingStatus(bookingId, newStatus);
    if (!error) {
      loadData();
    } else {
      alert(error.message || 'Failed to update booking status');
    }
  };

  const handleBlockDriverDate = async (driverId, date, reason = '') => {
    const { error } = await blockDriverDateAdmin(driverId, date, reason);
    if (!error) {
      if (selectedDriver?.id === driverId) {
        loadDriverUnavailability(driverId);
      }
      loadData();
    } else {
      alert(error.message || 'Failed to block date');
    }
  };

  const handleUnblockDriverDate = async (driverId, date) => {
    const { error } = await unblockDriverDateAdmin(driverId, date);
    if (!error) {
      if (selectedDriver?.id === driverId) {
        loadDriverUnavailability(driverId);
      }
      loadData();
    } else {
      alert(error.message || 'Failed to unblock date');
    }
  };

  const handleToggleDriverStatus = async (driverId, currentStatus) => {
    const newStatus = !currentStatus;
    const { error } = await updateDriverStatus(driverId, newStatus);
    if (!error) {
      loadData();
    } else {
      alert(error.message || 'Failed to update driver status');
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

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
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
              <h1 style={{ marginBottom: "2rem" }}>Admin Dashboard</h1>

              {/* Stats */}
              <div style={{ 
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem"
              }}>
                <div style={{ 
                  background: "white", 
                  padding: "1.5rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-soft)" }}>Total Bookings</p>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "2rem", fontWeight: "700", color: "var(--accent-gold)" }}>
                    {stats.total}
                  </p>
                </div>
                <div style={{ 
                  background: "white", 
                  padding: "1.5rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-soft)" }}>Pending</p>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "2rem", fontWeight: "700", color: "#856404" }}>
                    {stats.pending}
                  </p>
                </div>
                <div style={{ 
                  background: "white", 
                  padding: "1.5rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-soft)" }}>Confirmed</p>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "2rem", fontWeight: "700", color: "#155724" }}>
                    {stats.confirmed}
                  </p>
                </div>
                <div style={{ 
                  background: "white", 
                  padding: "1.5rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-soft)" }}>Completed</p>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "2rem", fontWeight: "700", color: "#0c5460" }}>
                    {stats.completed}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ 
                display: "flex", 
                gap: "0.5rem", 
                marginBottom: "2rem",
                borderBottom: "2px solid var(--border-soft)"
              }}>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="btn"
                  style={{
                    border: "none",
                    borderRadius: "0",
                    borderBottom: activeTab === 'bookings' ? "2px solid var(--accent-gold)" : "2px solid transparent",
                    marginBottom: "-2px"
                  }}
                >
                  Bookings
                </button>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className="btn"
                  style={{
                    border: "none",
                    borderRadius: "0",
                    borderBottom: activeTab === 'drivers' ? "2px solid var(--accent-gold)" : "2px solid transparent",
                    marginBottom: "-2px"
                  }}
                >
                  Drivers
                </button>
              </div>

              {/* Filters */}
              {activeTab === 'bookings' && (
                <div style={{ 
                  background: "white", 
                  padding: "1.5rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)",
                  marginBottom: "2rem"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "8px"
                        }}
                      >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>From Date</label>
                      <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "8px"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>To Date</label>
                      <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "8px"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>Driver</label>
                      <select
                        value={filters.driver_id}
                        onChange={(e) => setFilters({ ...filters, driver_id: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "8px"
                        }}
                      >
                        <option value="">All Drivers</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>{driver.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div style={{ 
                  background: "white", 
                  padding: "2rem", 
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)"
                }}>
                  <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>All Bookings</h2>
                  {bookings.length > 0 ? (
                    <div className="cards-grid">
                      {bookings.map((booking) => (
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
                            <p><strong>Driver:</strong> {booking.drivers?.name || 'N/A'}</p>
                            <p><strong>Group Size:</strong> {booking.group_size}</p>
                            <p><strong>Customer:</strong> {booking.customer_name}</p>
                            <p><strong>Email:</strong> {booking.customer_email}</p>
                            <p><strong>Total:</strong> R{parseFloat(booking.total_price).toLocaleString()}</p>
                            <p><strong>Status:</strong> <span style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              background: 
                                booking.status === 'confirmed' ? '#d4edda' :
                                booking.status === 'completed' ? '#cce5ff' :
                                booking.status === 'cancelled' ? '#f8d7da' : '#fff3cd',
                              color: 
                                booking.status === 'confirmed' ? '#155724' :
                                booking.status === 'completed' ? '#004085' :
                                booking.status === 'cancelled' ? '#721c24' : '#856404'
                            }}>{booking.status}</span></p>
                          </div>
                          <div className="card-footer">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                  className="btn btn-primary"
                                  style={{ marginRight: "0.5rem" }}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                  className="btn btn-outline"
                                >
                                  Cancel
                                </button>
                              </>
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
                    <p style={{ color: "var(--text-soft)" }}>No bookings found</p>
                  )}
                </div>
              )}

              {/* Drivers Tab */}
              {activeTab === 'drivers' && (
                <div>
                  {/* Add Driver Form */}
                  <AddDriverForm onDriverAdded={loadData} />
                  
                  <div style={{ 
                    background: "white", 
                    padding: "2rem", 
                    borderRadius: "12px",
                    border: "1px solid var(--border-soft)",
                    marginBottom: "2rem"
                  }}>
                    <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>All Drivers</h2>
                    {drivers.length > 0 ? (
                      <div className="cards-grid">
                        {drivers.map((driver) => (
                          <div key={driver.id} className="card soft">
                            <div className="card-header">
                              <h3 className="card-title">{driver.name}</h3>
                              <p className="card-meta">{driver.email}</p>
                            </div>
                            <div className="card-body">
                              <p><strong>Status:</strong> <span style={{
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                background: driver.active ? '#d4edda' : '#f8d7da',
                                color: driver.active ? '#155724' : '#721c24'
                              }}>{driver.active ? 'Active' : 'Inactive'}</span></p>
                              {driver.vehicle_type && (
                                <p><strong>Vehicle:</strong> {driver.vehicle_type} ({driver.vehicle_capacity} pax)</p>
                              )}
                              {driver.experience && (
                                <p><strong>Experience:</strong> {driver.experience}</p>
                              )}
                            </div>
                            <div className="card-footer" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <button
                                onClick={() => handleToggleDriverStatus(driver.id, driver.active)}
                                className={`btn ${driver.active ? 'btn-outline' : 'btn-primary'}`}
                                style={{ fontSize: "0.85rem" }}
                              >
                                {driver.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDriver(driver);
                                  loadDriverUnavailability(driver.id);
                                }}
                                className="btn btn-outline"
                                style={{ fontSize: "0.85rem" }}
                              >
                                View Availability
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "var(--text-soft)" }}>No drivers found</p>
                    )}
                  </div>

                  {/* Driver Availability Viewer */}
                  {selectedDriver && (
                    <div style={{ 
                      background: "white", 
                      padding: "2rem", 
                      borderRadius: "12px",
                      border: "1px solid var(--border-soft)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2 style={{ margin: 0 }}>Availability: {selectedDriver.name}</h2>
                        <button
                          onClick={() => setSelectedDriver(null)}
                          className="btn btn-outline"
                        >
                          Close
                        </button>
                      </div>

                      <DriverAvailabilityManager
                        driver={selectedDriver}
                        unavailability={driverUnavailability}
                        onBlockDate={handleBlockDriverDate}
                        onUnblockDate={handleUnblockDriverDate}
                        onRefresh={() => loadDriverUnavailability(selectedDriver.id)}
                      />
                    </div>
                  )}
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

export default AdminDashboard;



