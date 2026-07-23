import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminLeads, updateAdminLead, getAdminStats, refundAdminBooking } from '../lib/api';
import AdminNav from '../components/AdminNav';
import BackToTop from '../components/BackToTop';

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [refundId, setRefundId] = useState('');

  const load = async () => {
    const [leadsRes, statsRes] = await Promise.all([getAdminLeads(), getAdminStats()]);
    if (leadsRes.error) setError(leadsRes.error.message || 'Failed to load leads');
    else setLeads(leadsRes.data || []);
    if (!statsRes.error) setStats(statsRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    setBusy(id);
    await updateAdminLead(id, status);
    setBusy(null);
    load();
  };

  const doRefund = async () => {
    if (!refundId.trim()) return;
    if (!window.confirm(`Refund paid booking ${refundId}?`)) return;
    setBusy('refund');
    const { error: err } = await refundAdminBooking(refundId.trim());
    setBusy(null);
    if (err) alert(err.message || err.error || 'Refund failed');
    else {
      alert('Refund processed');
      setRefundId('');
    }
  };

  return (
    <div>
      <AdminNav />
      <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
        <h1>Leads & KPIs</h1>
        {error && <p style={{ color: '#c0392b' }}>{error}</p>}

        {stats && (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              margin: '1.5rem 0',
            }}
          >
            <div className="card soft" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>Bookings (30d)</div>
              <strong style={{ fontSize: '1.4rem' }}>{stats.bookingsTotal}</strong>
            </div>
            <div className="card soft" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>Paid</div>
              <strong style={{ fontSize: '1.4rem' }}>{stats.bookingsPaid}</strong>
            </div>
            <div className="card soft" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>Revenue (30d)</div>
              <strong style={{ fontSize: '1.4rem' }}>R{Number(stats.revenueZar || 0).toLocaleString()}</strong>
            </div>
            <div className="card soft" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>New leads</div>
              <strong style={{ fontSize: '1.4rem' }}>{stats.leadsNew}</strong>
            </div>
          </section>
        )}

        <section style={{ marginBottom: '2rem' }}>
          <h2>Admin refund</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              value={refundId}
              onChange={(e) => setRefundId(e.target.value)}
              placeholder="Booking UUID"
              style={{ flex: 1, minWidth: 220, padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-soft)' }}
            />
            <button type="button" className="btn btn-outline" disabled={busy === 'refund'} onClick={doRefund}>
              Refund via YOCO
            </button>
          </div>
        </section>

        <h2>Leads</h2>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          {leads.length === 0 && <p style={{ color: 'var(--text-soft)' }}>No leads yet.</p>}
          {leads.map((lead) => (
            <article key={lead.id} className="card soft" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{lead.name}</strong> · {lead.email}
                  {lead.phone ? ` · ${lead.phone}` : ''}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                    {lead.source}
                    {lead.package_id ? ` · package ${lead.package_id}` : ''} · {lead.status}
                  </div>
                  {lead.message && <p style={{ margin: '0.5rem 0 0' }}>{lead.message}</p>}
                </div>
                <select
                  value={lead.status}
                  disabled={busy === lead.id}
                  onChange={(e) => setStatus(lead.id, e.target.value)}
                >
                  {['new', 'contacted', 'qualified', 'won', 'lost'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
        <p style={{ marginTop: '1.5rem' }}>
          <Link to="/admin/dashboard">← Admin dashboard</Link>
        </p>
      </main>
      <BackToTop />
    </div>
  );
}
