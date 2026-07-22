import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMemberBookings, getMemberSubscriptions, getMemberInvoices } from '../lib/api';
import { membershipPlans } from '../data';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';
import LiveMap from '../components/LiveMap';

export default function MemberDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    (async () => {
      setLoading(true);
      const [b, s, inv] = await Promise.all([
        getMemberBookings(),
        getMemberSubscriptions(),
        getMemberInvoices(),
      ]);
      if (b.data) setBookings(Array.isArray(b.data) ? b.data : []);
      const active = (s.data || []).find((x) => x.status === 'active');
      setSubscription(active || null);
      if (inv.data) setInvoices(Array.isArray(inv.data) ? inv.data : []);
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading…</div>;
  }

  const plan = membershipPlans.find((p) => p.id === subscription?.tier);
  const upcoming = bookings.filter((b) => {
    const d = new Date(b.booking_date || b.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today && b.status !== 'cancelled';
  });

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <img src="/logo-white.png" alt="UNICAB" className="logo-img" />
          </Link>
          <nav style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto', alignItems: 'center' }}>
            <Link to="/member/subscriptions" className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Subscriptions</Link>
            <ProfileDropdown />
          </nav>
        </div>
      </header>

      <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
        <h1>My bookings</h1>
        <p style={{ color: 'var(--text-soft)' }}>
          Welcome{user?.email ? `, ${user.email}` : ''}
          {userRole ? ` · ${userRole}` : ''}
        </p>

        {plan && (
          <div
            className={`tier-card tier-${plan.id}`}
            style={{
              margin: '1rem 0',
              padding: '1rem 1.25rem',
              borderRadius: 12,
              border: '2px solid',
              borderColor: plan.id === 'elite' ? '#1a1a2e' : plan.id === 'frequent' ? '#c9a227' : '#5b8c5a',
              background: plan.id === 'elite' ? '#f4f1ea' : plan.id === 'frequent' ? '#fffaf0' : '#f3faf4',
            }}
          >
            <strong>{plan.name}</strong> membership active
            <div style={{ fontSize: '0.85rem' }}>{plan.benefits[0]}</div>
            <Link to="/member/subscriptions">Manage</Link>
          </div>
        )}

        <div style={{ margin: '1.5rem 0' }}>
          <Link to="/tours" className="btn btn-primary">Book a tour</Link>
        </div>

        <h2>Upcoming</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {upcoming.map((b) => (
            <div key={b.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{b.tour?.name || 'Tour'}</strong>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>
                    {b.booking_date} {b.booking_time || ''} · {b.status}
                    {b.trip_status ? ` · ${b.trip_status}` : ''}
                  </div>
                  {b.driver && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {b.driver_profile?.avatar_url && (
                        <img src={b.driver_profile.avatar_url} alt="" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                      )}
                      <div>
                        <div><strong>Driver:</strong> {b.driver.name}</div>
                        <div style={{ fontSize: '0.85rem' }}>{b.driver.phone}</div>
                      </div>
                    </div>
                  )}
                </div>
                <Link to={`/member/bookings/${b.id}`} className="btn btn-outline">Details</Link>
              </div>
              {['en_route_pickup', 'on_tour'].includes(b.trip_status) && (
                <div style={{ marginTop: '0.75rem' }}>
                  <LiveMap
                    lat={b.location?.lat != null ? Number(b.location.lat) : null}
                    lng={b.location?.lng != null ? Number(b.location.lng) : null}
                    height={200}
                    label={b.driver?.name || 'Driver'}
                  />
                </div>
              )}
            </div>
          ))}
          {!upcoming.length && <p>No upcoming bookings.</p>}
        </div>

        <h2 style={{ marginTop: '2rem' }}>Invoices</h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {invoices.slice(0, 5).map((inv) => (
            <div key={inv.id} className="card" style={{ padding: '0.75rem 1rem' }}>
              {inv.number} · R{Number(inv.amount_zar || 0).toFixed(2)} · {inv.status}
            </div>
          ))}
          {!invoices.length && <p style={{ color: 'var(--text-soft)' }}>No invoices yet.</p>}
        </div>

        <button type="button" className="btn btn-outline" style={{ marginTop: '2rem' }} onClick={() => signOut()}>
          Sign out
        </button>
      </main>
      <BackToTop />
    </div>
  );
}
