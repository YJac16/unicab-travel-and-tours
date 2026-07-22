import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../lib/api';
import BackToTop from '../components/BackToTop';
import PasswordInput from '../components/PasswordInput';

function MemberRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error: registerError } = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'MEMBER'
      });

      if (registerError) {
        setErrors({ submit: registerError.message || registerError.error || 'Registration failed' });
      } else if (data && data.token) {
        // Store token
        localStorage.setItem('auth_token', data.token);
        
        // Redirect to member dashboard
        navigate('/member/dashboard', { replace: true });
      } else {
        setErrors({ submit: 'Registration successful, but login required' });
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/member/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
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
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <div style={{ 
                background: "white", 
                padding: "2rem", 
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                boxShadow: "var(--shadow-soft)"
              }}>
                <h1 style={{ marginTop: 0, marginBottom: "1rem" }}>Create Account</h1>
                <p style={{ color: "var(--text-soft)", marginBottom: "2rem" }}>
                  Join UNICAB Travel & Tours to book tours and manage your reservations
                </p>

                {errors.submit && (
                  <div style={{
                    padding: "1rem",
                    background: errors.submit.includes('successful') ? "#d4edda" : "#fee",
                    border: `1px solid ${errors.submit.includes('successful') ? "#c3e6cb" : "#fcc"}`,
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    color: errors.submit.includes('successful') ? "#155724" : "#c33"
                  }}>
                    {errors.submit}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "0.5rem", 
                      fontSize: "0.9rem", 
                      fontWeight: "500" 
                    }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
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
                    <label style={{ 
                      display: "block", 
                      marginBottom: "0.5rem", 
                      fontSize: "0.9rem", 
                      fontWeight: "500" 
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
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
                    <label style={{ 
                      display: "block", 
                      marginBottom: "0.5rem", 
                      fontSize: "0.9rem", 
                      fontWeight: "500" 
                    }}>
                      Password *
                    </label>
                    <PasswordInput
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setErrors({ ...errors, password: null });
                      }}
                      required
                      minLength={6}
                      error={errors.password}
                    />
                    {errors.password && (
                      <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {errors.password}
                      </p>
                    )}
                    <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      Must be at least 6 characters
                    </p>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "0.5rem", 
                      fontSize: "0.9rem", 
                      fontWeight: "500" 
                    }}>
                      Confirm Password *
                    </label>
                    <PasswordInput
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        setErrors({ ...errors, confirmPassword: null });
                      }}
                      required
                      error={errors.confirmPassword}
                    />
                    {errors.confirmPassword && (
                      <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ 
                      width: "100%", 
                      fontSize: "1rem", 
                      padding: "1rem",
                      marginBottom: "1rem"
                    }}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

                <div style={{ 
                  textAlign: "center", 
                  paddingTop: "1.5rem",
                  borderTop: "1px solid var(--border-soft)"
                }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-soft)" }}>
                    Already have an account?{' '}
                    <Link to="/member/login" style={{ color: "var(--accent-gold)" }}>
                      Sign In
                    </Link>
                  </p>
                </div>

                <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-soft)", marginTop: "1.5rem" }}>
                  <Link to="/" style={{ color: "var(--accent-gold)" }}>
                    ← Back to Home
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BackToTop />
    </div>
  );
}

export default MemberRegister;







