import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getMemberSubscriptions,
  createYocoPayment,
  cancelMemberSubscription,
} from '../lib/api';
import { membershipPlans } from '../data';
import ProfileDropdown from '../components/ProfileDropdown';
import BackToTop from '../components/BackToTop';

const TIER_STYLES = {
  explorer: { border: '#5b8c5a', bg: '#f3faf4', badge: '#5b8c5a' },
  frequent: { border: '#c9a227', bg: '#fffaf0', badge: '#c9a227' },
  elite: { border: '#1a1a2e', bg: '#f4f1ea', badge: '#1a1a2e' },
};

const TIER_CENTS = {
  explorer: 29900,
  frequent: 89900,
  elite: 250000,
};

export default function MemberSubscriptions() {
  const { user } = useAuth();
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await getMemberSubscriptions();
    setActive((data || []).find((s) => s.status === 'active') || null);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const activate = async (tier) => {
    if (!user?.id) {
      setMessage('Please sign in first');
      return;
    }
    setBusy(true);
    setMessage('');
    const plan = membershipPlans.find((p) => p.id === tier);
    const { data, error } = await createYocoPayment(TIER_CENTS[tier], null, {
      kind: 'subscription',
      tier,
      userId: user.id,
      description: `UNICAB ${plan?.name || tier} membership`,
    });
    setBusy(false);
    if (error || !data?.redirectUrl) {
      setMessage(error?.message || 'Could not start YOCO checkout');
      return;
    }
    window.location.href = data.redirectUrl;
  };

  const cancel = async () => {
    if (!active || !window.confirm('Cancel your membership?')) return;
    setBusy(true);
    await cancelMemberSubscription(active.id);
    setBusy(false);
    load();
  };

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <img src="/logo-white.png" alt="UNICAB" className="logo-img" />
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/member/dashboard" className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Dashboard</Link>
            <ProfileDropdown />
          </div>
        </div>
      </header>
      <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
        <h1>Membership</h1>
        <p style={{ color: 'var(--text-soft)' }}>
          Choose a plan with clear benefits. You will pay securely with YOCO. Discounts apply at tour checkout when active.
        </p>
        {message && <p style={{ color: 'var(--accent-gold)' }}>{message}</p>}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: '1.5rem' }}>
            {membershipPlans.map((plan) => {
              const style = TIER_STYLES[plan.id] || TIER_STYLES.explorer;
              const isActive = active?.tier === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`tier-card tier-${plan.id}`}
                  style={{
                    padding: '1.5rem',
                    borderRadius: 16,
                    border: `2px solid ${style.border}`,
                    background: style.bg,
                    position: 'relative',
                  }}
                >
                  {plan.popular && (
                    <span style={{ position: 'absolute', top: 12, right: 12, background: style.badge, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 999 }}>
                      Popular
                    </span>
                  )}
                  <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem' }}>{plan.name}</h2>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{plan.price}</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>{plan.shortDescription}</p>
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.9rem' }}>
                    {plan.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {isActive ? (
                    <button type="button" className="btn btn-outline" disabled={busy} onClick={cancel} style={{ marginTop: '1rem' }}>
                      Cancel plan
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" disabled={busy} onClick={() => activate(plan.id)} style={{ marginTop: '1rem' }}>
                      {active ? 'Switch via YOCO' : 'Pay with YOCO'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BackToTop />
    </div>
  );
}
