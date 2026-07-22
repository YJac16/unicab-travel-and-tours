import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { tours as localTours, drivers as localDrivers } from "../data";
import { getTour, getAvailableDrivers, calculateTourPrice, formatTourPrice } from "../lib/api";
import BackToTop from "../components/BackToTop";

const formatStars = (rating) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

function TourBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [pax, setPax] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDriverSelection, setShowDriverSelection] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [driverBookings, setDriverBookings] = useState({});
  const [tour, setTour] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cutoff time (8 PM = 20:00) - tours cannot end after this time
  const CUTOFF_HOUR = 20;
  const CUTOFF_MINUTE = 0;

  useEffect(() => {
    loadTour();
    // Set minimum date to today
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, [id]);

  const loadTour = async () => {
    setLoading(true);
    const { data, error } = await getTour(id);
    if (error || !data) {
      // Fallback to local data
      const localTour = localTours.find((t) => t.id === id);
      if (!localTour) {
        navigate("/tours");
        return;
      }
      setTour(localTour);
    } else {
      setTour(data);
    }
    setLoading(false);
  };

  // Load available drivers when date and group size change
  useEffect(() => {
    if (!selectedDate || !pax || pax < 1) {
      setAvailableDrivers([]);
      setSelectedDrivers([]);
      return;
    }

    loadAvailableDrivers();
  }, [selectedDate, pax]);

  const loadAvailableDrivers = async () => {
    const { data, error } = await getAvailableDrivers(selectedDate, pax);
    if (error) {
      console.warn('Using local drivers (Supabase unavailable)');
      setAvailableDrivers(localDrivers);
    } else {
      setAvailableDrivers(data?.length ? data : localDrivers);
    }
    // Reset selected drivers when drivers change
    setSelectedDrivers([]);
  };

  if (!tour) return null;

  // availableDrivers is now loaded from API

  // Calculate tour end time and validate against cutoff
  const calculateEndTime = (startTime, durationHours) => {
    if (!startTime || !durationHours) return null;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes || 0, 0, 0);
    
    const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000));
    return endDate;
  };

  const validateDateAndPax = () => {
    const newErrors = {};
    if (pax < 1 || pax > 22) {
      newErrors.pax = "Group size must be between 1 and 22";
    }
    if (!selectedDate) {
      newErrors.date = "Please select a date";
    } else {
      const selected = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        newErrors.date = "Date cannot be in the past";
      }
    }
    
    // Validate time selection
    if (!selectedTime) {
      newErrors.time = "Please select a start time";
    } else if (tour) {
      // Get tour duration in hours (from duration_hours field or parse from duration text)
      const durationHours = tour.duration_hours || parseDurationHours(tour.duration) || 8;
      
      // Calculate end time
      const endTime = calculateEndTime(selectedTime, durationHours);
      
      if (endTime) {
        const cutoffTime = new Date();
        cutoffTime.setHours(CUTOFF_HOUR, CUTOFF_MINUTE, 0, 0);
        
        if (endTime > cutoffTime) {
          const endTimeStr = endTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          newErrors.time = `This tour would end at ${endTimeStr}, which is after our ${CUTOFF_HOUR}:${CUTOFF_MINUTE.toString().padStart(2, '0')} cutoff time. Please select an earlier start time.`;
        }
      }
    }
    
    return newErrors;
  };

  // Parse duration hours from duration text (e.g., "Full Day (8–9 hours)" -> 8.5)
  const parseDurationHours = (durationText) => {
    if (!durationText) return null;
    
    // Match patterns like "8-9 hours", "8.5 hours", "Full Day (8–9 hours)"
    const rangeMatch = durationText.match(/(\d+\.?\d*)\s*-?\s*(\d+\.?\d*)\s*hours?/i);
    if (rangeMatch) {
      const start = parseFloat(rangeMatch[1]);
      const end = parseFloat(rangeMatch[2]);
      return (start + end) / 2; // Average
    }
    
    const singleMatch = durationText.match(/(\d+\.?\d*)\s*hours?/i);
    if (singleMatch) {
      return parseFloat(singleMatch[1]);
    }
    
    // Check for "full day" or "half day"
    if (durationText.toLowerCase().includes('full day')) return 8.0;
    if (durationText.toLowerCase().includes('half day')) return 4.0;
    
    return null;
  };

  const validateForm = () => {
    const newErrors = validateDateAndPax();
    if (selectedDrivers.length < 1) {
      newErrors.driver = "Please select at least 1 driver/guide";
    } else if (selectedDrivers.length > 2) {
      newErrors.driver = "You can select a maximum of 2 drivers/guides";
    }
    return newErrors;
  };

  const handleSelectDriver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newErrors = validateDateAndPax();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        const errorElement = document.querySelector(`input[type="${firstErrorField === 'date' ? 'date' : 'number'}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          errorElement.focus();
        }
      }, 100);
      return;
    }

    // If validation passes, show driver selection
    setShowDriverSelection(true);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        if (firstErrorField === 'driver') {
          const driverSection = document.querySelector('[data-driver-section]');
          if (driverSection) {
            driverSection.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else {
          const errorElement = document.querySelector(`input[type="${firstErrorField === 'date' ? 'date' : 'number'}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
            errorElement.focus();
          }
        }
      }, 100);
      return;
    }

    // If validation passes, confirm the selection
    setIsConfirmed(true);
  };

  const handleEdit = () => {
    setIsConfirmed(false);
    setShowDriverSelection(false);
    setSelectedDrivers([]);
  };

  const handleContinue = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        if (firstErrorField === 'driver') {
          const driverSection = document.querySelector('[data-driver-section]');
          if (driverSection) {
            driverSection.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else {
          const errorElement = document.querySelector(`input[type="${firstErrorField === 'date' ? 'date' : 'number'}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
            errorElement.focus();
          }
        }
      }, 100);
      return;
    }
    
    // Ensure we have all required data
    if (!id || !selectedDate || !tour || selectedDrivers.length < 1) {
      console.error("Missing required data for navigation:", { id, selectedDate, tour, selectedDrivers });
      alert("Please fill in all required fields");
      return;
    }
    
    // Navigate to checkout (YOCO payment)
    // History state must be cloneable — never pass functions (e.g. tour.getPrice)
    const plainTour = tour
      ? JSON.parse(JSON.stringify({ ...tour, getPrice: undefined }))
      : null;
    const plainDrivers = selectedDrivers.map((d) =>
      JSON.parse(JSON.stringify({ ...d }))
    );

    const bookingState = {
      pax: parseInt(pax, 10),
      date: selectedDate,
      time: selectedTime,
      tour: plainTour,
      drivers: plainDrivers,
      driver: plainDrivers[0] || null,
    };

    navigate(`/tours/${id}/checkout`, {
      state: bookingState,
      replace: false,
    });
  };

  const pricePerPerson = calculateTourPrice(tour, pax);
  const totalPrice = pricePerPerson * pax;

  if (loading || !tour) {
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
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <Link 
                to={`/tours/${id}`} 
                className="btn btn-outline" 
                style={{ marginBottom: "2rem", textDecoration: "none" }}
              >
                ← Back to Tour Details
              </Link>

              <div style={{ 
                background: "var(--bg-soft)", 
                padding: "2rem", 
                borderRadius: "12px",
                marginBottom: "2rem",
                border: "1px solid var(--border-soft)"
              }}>
                <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Book Your Tour</h1>
                <h2 style={{ fontSize: "1.3rem", color: "var(--text-soft)", margin: 0 }}>
                  {tour.name}
                </h2>
              </div>

              {!showDriverSelection && !isConfirmed ? (
                <>
                  <div style={{ 
                    background: "white", 
                    padding: "2rem", 
                    borderRadius: "12px",
                    border: "1px solid var(--border-soft)",
                    marginBottom: "2rem"
                  }}>
                    <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Group Size & Date</h3>
                    
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", fontWeight: "500" }}>
                        Number of People (1-22) *
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button
                          type="button"
                          onClick={() => setPax(Math.max(1, pax - 1))}
                          className="btn btn-outline"
                          style={{ minWidth: "50px", padding: "0.5rem" }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="22"
                          value={pax}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setPax(Math.max(1, Math.min(22, value)));
                          }}
                          style={{
                            width: "100px",
                            padding: "0.75rem",
                            textAlign: "center",
                            border: `1px solid ${errors.pax ? "#e74c3c" : "var(--border-soft)"}`,
                            borderRadius: "8px",
                            fontSize: "1.1rem",
                            fontWeight: "600"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setPax(Math.min(22, pax + 1))}
                          className="btn btn-outline"
                          style={{ minWidth: "50px", padding: "0.5rem" }}
                        >
                          +
                        </button>
                      </div>
                      {errors.pax && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.pax}</p>}
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", fontWeight: "500" }}>
                        Tour Date *
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setErrors({ ...errors, date: null });
                        }}
                        min={new Date().toISOString().split("T")[0]}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${errors.date ? "#e74c3c" : "var(--border-soft)"}`,
                          borderRadius: "8px",
                          fontSize: "0.9rem"
                        }}
                      />
                      {errors.date && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.date}</p>}
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", fontWeight: "500" }}>
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => {
                          setSelectedTime(e.target.value);
                          setErrors({ ...errors, time: null });
                        }}
                        min="06:00"
                        max="20:00"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${errors.time ? "#e74c3c" : "var(--border-soft)"}`,
                          borderRadius: "8px",
                          fontSize: "0.9rem"
                        }}
                      />
                      {errors.time && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.time}</p>}
                      {tour && selectedTime && !errors.time && (() => {
                        const durationHours = tour.duration_hours || parseDurationHours(tour.duration) || 8;
                        const endTime = calculateEndTime(selectedTime, durationHours);
                        if (endTime) {
                          const endTimeStr = endTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          });
                          return (
                            <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                              Tour will end approximately at {endTimeStr}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Pricing Display */}
                    <div style={{ 
                      background: "var(--bg-soft)", 
                      padding: "1.5rem", 
                      borderRadius: "8px",
                      marginTop: "2rem"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ color: "var(--text-soft)" }}>Price per person:</span>
                        <strong>{formatTourPrice(pricePerPerson)}</strong>
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
                        <span>{formatTourPrice(totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "2rem" }}>
                    <button
                      type="button"
                      onClick={handleSelectDriver}
                      className="btn btn-primary"
                      style={{ 
                        width: "100%", 
                        fontSize: "1.1rem", 
                        padding: "1rem 2rem",
                        cursor: "pointer",
                        position: "relative",
                        zIndex: 10,
                        border: "none",
                        fontWeight: "600"
                      }}
                    >
                      Select Driver →
                    </button>
                  </div>
                </>
              ) : showDriverSelection && !isConfirmed ? (
                <>
                  {/* Driver Selection Section */}
                  <div 
                    data-driver-section
                    style={{ 
                      background: "white", 
                      padding: "2rem", 
                      borderRadius: "12px",
                      border: `1px solid ${errors.driver ? "#e74c3c" : "var(--border-soft)"}`,
                      marginBottom: "2rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Select Your Driver</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDriverSelection(false);
                          setSelectedDrivers([]);
                        }}
                        className="btn btn-outline"
                        style={{ 
                          padding: "0.5rem 1rem",
                          fontSize: "0.85rem",
                          whiteSpace: "nowrap"
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                    <p style={{ 
                      fontSize: "0.9rem", 
                      color: "var(--text-soft)", 
                      marginBottom: "0.5rem",
                      lineHeight: "1.6"
                    }}>
                      Choose from available drivers for {new Date(selectedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
                    </p>
                    <p style={{ 
                      fontSize: "0.85rem", 
                      color: "var(--accent-gold)", 
                      marginBottom: "1.5rem",
                      fontWeight: "600"
                    }}>
                      Select 1-2 drivers/guides ({selectedDrivers.length}/2 selected)
                    </p>
                    {errors.driver && (
                      <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginBottom: "1rem" }}>
                        {errors.driver}
                      </p>
                    )}

                    {availableDrivers.length > 0 ? (
                      <div className="cards-grid" style={{ marginBottom: "1.5rem" }}>
                        {availableDrivers.map((driver, index) => {
                          const driverId = driver.driver_id || driver.id;
                          const driverName = driver.driver_name || driver.name;
                          // Create a stable unique identifier - use index to ensure uniqueness even if IDs are missing
                          const uniqueId = driverId ? `id-${driverId}` : `idx-${index}`;
                          
                          const driverData = {
                            id: driverId,
                            driver_id: driverId,
                            name: driverName,
                            uniqueId: uniqueId,
                            _mapIndex: index, // Store map index for reliable comparison
                            ...driver
                          };
                          
                          // Check if this specific driver is selected - compare by uniqueId or map index
                          const isSelected = selectedDrivers.some(d => {
                            if (d.uniqueId === uniqueId) return true;
                            if (d._mapIndex === index) return true;
                            if (driverId && (d.driver_id === driverId || d.id === driverId)) return true;
                            return false;
                          });
                          
                          const canSelect = selectedDrivers.length < 2 || isSelected;
                          
                          const handleDriverToggle = (e) => {
                            e.stopPropagation();
                            setSelectedDrivers(prev => {
                              // Check if this specific driver is already selected
                              const isCurrentlySelected = prev.some(d => {
                                if (d.uniqueId === uniqueId) return true;
                                if (d._mapIndex === index) return true;
                                if (driverId && (d.driver_id === driverId || d.id === driverId)) return true;
                                return false;
                              });
                              
                              if (isCurrentlySelected) {
                                // Deselect: remove only this specific driver
                                return prev.filter(d => {
                                  if (d.uniqueId === uniqueId) return false;
                                  if (d._mapIndex === index) return false;
                                  if (driverId && (d.driver_id === driverId || d.id === driverId)) return false;
                                  return true;
                                });
                              } else {
                                // Select: add this driver if under limit
                                if (prev.length < 2) {
                                  return [...prev, driverData];
                                }
                              }
                              return prev;
                            });
                          };

                          return (
                          <article 
                            key={uniqueId}
                            className="card soft"
                            style={{
                              border: isSelected ? "2px solid var(--accent-gold)" : canSelect ? "1px solid var(--border-soft)" : "1px solid var(--border-soft)",
                              cursor: canSelect ? "pointer" : "not-allowed",
                              opacity: canSelect ? 1 : 0.6,
                              transition: "all 0.3s ease",
                              width: "100%",
                              maxWidth: "100%"
                            }}
                            onClick={handleDriverToggle}
                          >
                            <div className="card-header" style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "1rem",
                              flexWrap: "wrap"
                            }}>
                              {driver.image && (
                                <img
                                  src={driver.image}
                                  alt={driverName}
                                  style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "2px solid var(--border-gold)",
                                    flexShrink: 0
                                  }}
                                />
                              )}
                              <div style={{ flex: "1", minWidth: 0 }}>
                                <h3 className="card-title" style={{ wordWrap: "break-word", margin: 0 }}>
                                  {driverName}
                                </h3>
                                {driver.vehicle_type && (
                                  <p className="card-meta" style={{ wordWrap: "break-word", margin: "0.25rem 0" }}>
                                    {driver.vehicle_type} ({driver.vehicle_capacity} pax)
                                  </p>
                                )}
                                {driver.rating !== undefined && (
                                  <div className="rating" style={{ marginTop: "0.5rem" }}>
                                    <span className="stars" aria-hidden="true">
                                      {formatStars(parseFloat(driver.rating) || 0)}
                                    </span>
                                    <span style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                                      {parseFloat(driver.rating || 0).toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between",
                              marginTop: "1rem"
                            }}>
                              {isSelected && (() => {
                                const selectedIndex = selectedDrivers.findIndex(d => {
                                  if (d.uniqueId === uniqueId) return true;
                                  if (d._mapIndex === index) return true;
                                  if (driverId && (d.driver_id === driverId || d.id === driverId)) return true;
                                  return false;
                                });
                                return (
                                  <div style={{
                                    padding: "0.5rem 1rem",
                                    background: "var(--accent-gold)",
                                    color: "white",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                    fontSize: "0.9rem"
                                  }}>
                                    ✓ Selected ({selectedIndex + 1})
                                  </div>
                                );
                              })()}
                              {!canSelect && !isSelected && (
                                <div style={{
                                  padding: "0.5rem 1rem",
                                  background: "var(--bg-soft)",
                                  color: "var(--text-soft)",
                                  borderRadius: "8px",
                                  fontSize: "0.85rem"
                                }}>
                                  Maximum 2 drivers
                                </div>
                              )}
                            </div>
                          </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{
                        padding: "2rem",
                        background: "var(--bg-soft)",
                        borderRadius: "8px",
                        textAlign: "center"
                      }}>
                        <p style={{ color: "var(--text-soft)", margin: 0 }}>
                          No drivers available for this date. Please select a different date.
                        </p>
                      </div>
                    )}

                    {selectedDrivers.length > 0 && (
                      <div style={{ marginTop: "2rem" }}>
                        <button
                          type="button"
                          onClick={handleConfirm}
                          className="btn btn-primary"
                          style={{ 
                            width: "100%", 
                            fontSize: "1.1rem", 
                            padding: "1rem 2rem",
                            cursor: "pointer",
                            position: "relative",
                            zIndex: 10,
                            border: "none",
                            fontWeight: "600"
                          }}
                        >
                          Confirm Details ({selectedDrivers.length} {selectedDrivers.length === 1 ? 'driver' : 'drivers'} selected) →
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Confirmation Section */}
                  <div style={{ 
                    background: "white", 
                    padding: "2rem", 
                    borderRadius: "12px",
                    border: "2px solid var(--accent-gold)",
                    marginBottom: "2rem",
                    boxShadow: "0 4px 20px rgba(201, 169, 97, 0.15)"
                  }}>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "flex-start",
                      marginBottom: "1.5rem"
                    }}>
                      <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "var(--accent-gold)" }}>
                        ✓ Booking Details Confirmed
                      </h3>
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="btn btn-outline"
                        style={{ 
                          padding: "0.5rem 1rem",
                          fontSize: "0.85rem",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Edit
                      </button>
                    </div>

                    <div style={{ 
                      background: "var(--bg-soft)", 
                      padding: "1.5rem", 
                      borderRadius: "8px",
                      marginBottom: "1.5rem"
                    }}>
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1.5rem",
                        marginBottom: "1.5rem"
                      }}>
                        <div>
                          <p style={{ 
                            margin: "0 0 0.5rem", 
                            fontSize: "0.85rem", 
                            color: "var(--text-soft)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                          }}>
                            Group Size
                          </p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: "1.3rem", 
                            fontWeight: "700",
                            color: "var(--text-main)"
                          }}>
                            {pax} {pax === 1 ? "Person" : "People"}
                          </p>
                        </div>
                        <div>
                          <p style={{ 
                            margin: "0 0 0.5rem", 
                            fontSize: "0.85rem", 
                            color: "var(--text-soft)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                          }}>
                            Tour Date
                          </p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: "1.3rem", 
                            fontWeight: "700",
                            color: "var(--text-main)"
                          }}>
                            {new Date(selectedDate).toLocaleDateString("en-US", { 
                              year: "numeric", 
                              month: "long", 
                              day: "numeric" 
                            })}
                          </p>
                        </div>
                        <div>
                          <p style={{ 
                            margin: "0 0 0.5rem", 
                            fontSize: "0.85rem", 
                            color: "var(--text-soft)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                          }}>
                            Driver{selectedDrivers.length > 1 ? 's' : ''} / Guide{selectedDrivers.length > 1 ? 's' : ''}
                          </p>
                          <div style={{ margin: 0 }}>
                            {selectedDrivers.length > 0 ? (
                              selectedDrivers.map((driver, index) => (
                                <p key={driver.id || driver.driver_id || index} style={{ 
                                  margin: index > 0 ? "0.5rem 0 0" : "0", 
                                  fontSize: "1.1rem", 
                                  fontWeight: "700",
                                  color: "var(--text-main)"
                                }}>
                                  {index + 1}. {driver.name || driver.driver_name}
                                </p>
                              ))
                            ) : (
                              <p style={{ 
                                margin: 0, 
                                fontSize: "1.3rem", 
                                fontWeight: "700",
                                color: "var(--text-main)"
                              }}>
                                Not selected
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p style={{ 
                            margin: "0 0 0.5rem", 
                            fontSize: "0.85rem", 
                            color: "var(--text-soft)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                          }}>
                            Total Price
                          </p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: "1.3rem", 
                            fontWeight: "700",
                            color: "var(--accent-gold)"
                          }}>
                            {formatTourPrice(totalPrice)}
                          </p>
                        </div>
                      </div>
                      <div style={{ 
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--border-soft)",
                        fontSize: "0.9rem",
                        color: "var(--text-soft)"
                      }}>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Price per person:</strong> {formatTourPrice(pricePerPerson)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "2rem" }}>
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="btn btn-primary"
                      style={{ 
                        width: "100%", 
                        fontSize: "1.1rem", 
                        padding: "1rem 2rem",
                        cursor: "pointer",
                        position: "relative",
                        zIndex: 10,
                        border: "none",
                        fontWeight: "600"
                      }}
                    >
                      Proceed to Checkout →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default TourBooking;

