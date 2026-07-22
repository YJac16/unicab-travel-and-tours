import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';
import PasswordInput from '../components/PasswordInput';

function MemberProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/member/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'MEMBER') {
        navigate('/member/dashboard');
        return;
      }
      
      setUser({
        name: payload.name || payload.email?.split('@')[0] || 'Member',
        email: payload.email,
        role: payload.role
      });
      
      setFormData({
        name: payload.name || payload.email?.split('@')[0] || 'Member',
        email: payload.email,
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('auth_token');
      navigate('/member/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setErrors({});

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      // TODO: Call API to update profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Profile updated successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setUser({
        ...user,
        name: formData.name,
        email: formData.email
      });
    } catch (error) {
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
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
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div style={{ marginBottom: "2rem" }}>
                <Link 
                  to="/member/dashboard" 
                  className="btn btn-outline"
                  style={{ textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}
                >
                  ← Back to Dashboard
                </Link>
                <h1 style={{ marginTop: 0 }}>My Profile</h1>
                <p style={{ color: "var(--text-soft)" }}>
                  Manage your account information and preferences
                </p>
              </div>

              {success && (
                <div style={{
                  padding: "1rem",
                  background: "#d4edda",
                  border: "1px solid #c3e6cb",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  color: "#155724"
                }}>
                  {success}
                </div>
              )}

              {errors.submit && (
                <div style={{
                  padding: "1rem",
                  background: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  color: "#c33"
                }}>
                  {errors.submit}
                </div>
              )}

              <div style={{
                background: "white",
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid var(--border-soft)"
              }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="member-name" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="member-name"
                      name="member-name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setErrors({ ...errors, name: null });
                      }}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${errors.name ? "#e74c3c" : "var(--border-soft)"}`,
                        borderRadius: "8px",
                        fontSize: "0.9rem"
                      }}
                    />
                    {errors.name && (
                      <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="member-email" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="member-email"
                      name="member-email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setErrors({ ...errors, email: null });
                      }}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${errors.email ? "#e74c3c" : "var(--border-soft)"}`,
                        borderRadius: "8px",
                        fontSize: "0.9rem"
                      }}
                    />
                    {errors.email && (
                      <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="member-phone" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="member-phone"
                      name="member-phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        setErrors({ ...errors, phone: null });
                      }}
                      placeholder="+27 XX XXX XXXX"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${errors.phone ? "#e74c3c" : "var(--border-soft)"}`,
                        borderRadius: "8px",
                        fontSize: "0.9rem"
                      }}
                    />
                    {errors.phone && (
                      <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div style={{
                    marginTop: "2rem",
                    paddingTop: "2rem",
                    borderTop: "1px solid var(--border-soft)"
                  }}>
                    <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Change Password</h2>
                    <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                      Leave blank if you don't want to change your password
                    </p>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500"
                      }}>
                        Current Password
                      </label>
                      <PasswordInput
                        value={formData.currentPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, currentPassword: e.target.value });
                          setErrors({ ...errors, currentPassword: null });
                        }}
                        error={errors.currentPassword}
                      />
                      {errors.currentPassword && (
                        <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500"
                      }}>
                        New Password
                      </label>
                      <PasswordInput
                        value={formData.newPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, newPassword: e.target.value });
                          setErrors({ ...errors, newPassword: null });
                        }}
                        error={errors.newPassword}
                      />
                      {errors.newPassword && (
                        <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          {errors.newPassword}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500"
                      }}>
                        Confirm New Password
                      </label>
                      <PasswordInput
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          setErrors({ ...errors, confirmPassword: null });
                        }}
                        error={errors.confirmPassword}
                      />
                      {errors.confirmPassword && (
                        <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                      style={{ padding: "1rem 2rem" }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <Link
                      to="/member/dashboard"
                      className="btn btn-outline"
                      style={{ textDecoration: "none", padding: "1rem 2rem" }}
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>

              <div style={{
                background: "white",
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                marginTop: "2rem"
              }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Account Information</h2>
                <div style={{ color: "var(--text-soft)" }}>
                  <p><strong>Role:</strong> {user?.role}</p>
                  <p><strong>Account Status:</strong> Active</p>
                  <p><strong>Member Since:</strong> {new Date().toLocaleDateString()}</p>
                  <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
                    Update your profile information to ensure we can contact you about your bookings.
                  </p>
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

export default MemberProfile;







