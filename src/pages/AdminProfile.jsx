import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function AdminProfile() {
  const navigate = useNavigate();
  const { user: authUser, userRole } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser) {
        navigate('/login');
        return;
      }

      if (userRole !== 'admin') {
        navigate('/admin/dashboard');
        return;
      }

      try {
        // Get user profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        const name = profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Admin';
        const email = authUser.email || '';
        const avatarUrl = profile?.avatar_url || authUser.user_metadata?.avatar_url;

        setUser({
          id: authUser.id,
          name,
          email,
          role: userRole,
          avatarUrl
        });

        setFormData({
          name,
          email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        if (avatarUrl) {
          setProfilePictureUrl(avatarUrl);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [authUser, userRole, navigate]);

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ picture: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ picture: 'Image size must be less than 5MB' });
      return;
    }

    setUploadingPicture(true);
    setErrors({ ...errors, picture: null });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', authUser.id);

      if (updateError) {
        throw updateError;
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setProfilePictureUrl(publicUrl);
      setUser({ ...user, avatarUrl: publicUrl });
      setSuccess('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading picture:', error);
      setErrors({ picture: 'Failed to upload picture. Please try again.' });
    } finally {
      setUploadingPicture(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    // Only validate password if user is trying to change it
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
      // Update password if provided
      if (formData.newPassword) {
        // First verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: formData.currentPassword
        });

        if (signInError) {
          setErrors({ currentPassword: 'Current password is incorrect' });
          setSaving(false);
          return;
        }

        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (passwordError) {
          throw passwordError;
        }
      }

      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          email: formData.email
        })
        .eq('id', authUser.id);

      if (profileError) {
        throw profileError;
      }

      // Update user metadata
      await supabase.auth.updateUser({
        email: formData.email,
        data: {
          full_name: formData.name,
          name: formData.name
        }
      });

      setSuccess('Profile updated successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Update user state
      setUser({
        ...user,
        name: formData.name,
        email: formData.email
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: error.message || 'Failed to update profile. Please try again.' });
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
                  to="/admin/dashboard" 
                  className="btn btn-outline"
                  style={{ textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}
                >
                  ← Back to Dashboard
                </Link>
                <h1 style={{ marginTop: 0 }}>Admin Profile</h1>
                <p style={{ color: "var(--text-soft)" }}>
                  Manage your admin account settings and preferences
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

              {/* Profile Picture Section */}
              <div style={{
                background: "white",
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                marginBottom: "2rem"
              }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Profile Picture</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1rem" }}>
                  <div style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "var(--bg-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--border-soft)"
                  }}>
                    {profilePictureUrl ? (
                      <img 
                        src={profilePictureUrl} 
                        alt="Profile" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      disabled={uploadingPicture}
                      style={{ display: "none" }}
                      id="profile-picture-input"
                    />
                    <label
                      htmlFor="profile-picture-input"
                      className="btn btn-outline"
                      style={{
                        display: "inline-block",
                        cursor: uploadingPicture ? "not-allowed" : "pointer",
                        opacity: uploadingPicture ? 0.6 : 1
                      }}
                    >
                      {uploadingPicture ? "Uploading..." : "Change Picture"}
                    </label>
                    {errors.picture && (
                      <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                        {errors.picture}
                      </p>
                    )}
                    <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", marginTop: "0.5rem" }}>
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: "white",
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid var(--border-soft)"
              }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="admin-name" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="admin-name"
                      name="admin-name"
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
                    <label htmlFor="admin-email" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="admin-email"
                      name="admin-email"
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
                      <label htmlFor="admin-current-password" style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500"
                      }}>
                        Current Password
                      </label>
                      <PasswordInput
                        id="admin-current-password"
                        name="admin-current-password"
                        autoComplete="current-password"
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
                      <label htmlFor="admin-new-password" style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500"
                      }}>
                        New Password
                      </label>
                      <PasswordInput
                        id="admin-new-password"
                        name="admin-new-password"
                        autoComplete="new-password"
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
                      <label htmlFor="admin-confirm-password" style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500"
                      }}>
                        Confirm New Password
                      </label>
                      <PasswordInput
                        id="admin-confirm-password"
                        name="admin-confirm-password"
                        autoComplete="new-password"
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
                      to="/admin/dashboard"
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
                  <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
                    For security reasons, some account changes may require verification.
                  </p>
                </div>
              </div>

              {/* Payments Section for Admin */}
              <div style={{
                background: "white",
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid var(--border-soft)",
                marginTop: "2rem"
              }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Payments</h2>
                <p style={{ color: "var(--text-soft)", marginBottom: "1rem" }}>
                  Customer payments are processed with YOCO Checkout. Booking payment status is managed in the Admin Dashboard.
                </p>
                <div style={{
                  padding: "2rem",
                  background: "var(--bg-soft)",
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "var(--text-soft)"
                }}>
                  <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                    YOCO is the only payment gateway
                  </p>
                  <p style={{ fontSize: "0.85rem" }}>
                    View booking payment status under Admin → Bookings.
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

export default AdminProfile;

