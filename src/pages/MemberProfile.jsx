import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateMemberProfile } from '../lib/api';
import { supabase } from '../lib/supabase';
import ProfileDropdown from '../components/ProfileDropdown';
import HubChromeActions from '../components/HubChromeActions';
import ThemeToggle from '../components/ThemeToggle';

function MemberProfile() {
  const { user, signOut } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      setFormData({
        name: data?.full_name || user.user_metadata?.full_name || '',
        email: data?.email || user.email || '',
        phone: '',
      });
    })();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSuccess('');
    const { error } = await updateMemberProfile({
      full_name: formData.name.trim(),
    });
    setSaving(false);
    if (error) {
      setErrors({ submit: error.message || 'Save failed' });
      return;
    }
    setSuccess('Profile updated');
  };

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <img src="/logo-white.png" alt="UNICAB" className="logo-img" />
          </Link>
          <div className="hub-header-actions" style={{ marginLeft: 'auto' }}>
            <HubChromeActions />
            <ProfileDropdown />
          </div>
        </div>
      </header>
      <main className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: 560 }}>
        <h1>My profile</h1>
        <div className="settings-panel" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Appearance</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>Light by default. Your choice is saved.</p>
          <ThemeToggle />
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label>
            Full name
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.35rem' }}
            />
          </label>
          <label>
            Email
            <input value={formData.email} disabled style={{ width: '100%', padding: '0.75rem', marginTop: '0.35rem' }} />
          </label>
          {success && <p style={{ color: '#1a7f4e' }}>{success}</p>}
          {errors.submit && <p style={{ color: '#c0392b' }}>{errors.submit}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
        <button type="button" className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => signOut()}>
          Sign out
        </button>
      </main>
    </div>
  );
}

export default MemberProfile;
