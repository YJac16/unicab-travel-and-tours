import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import BackToTop from '../components/BackToTop';
import { getAdminVehicles, createAdminVehicles, updateAdminVehicle, deleteAdminVehicle } from '../lib/api';

export default function AdminFleet() {
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState({ total: 0, available: 0, dispatched: 0, out: 0 });
  const [label, setLabel] = useState('Fleet vehicle');
  const [type, setType] = useState('Sedan');
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, summary: s, error } = await getAdminVehicles();
    if (!error) {
      setVehicles(data || []);
      if (s) setSummary(s);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    await createAdminVehicles({ label, type, count: Number(count) || 1 });
    setCount(1);
    load();
  };

  const setStatus = async (id, status) => {
    await updateAdminVehicle(id, { status });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this vehicle from the fleet?')) return;
    await deleteAdminVehicle(id);
    load();
  };

  return (
    <div>
      <AdminNav />
      <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
        <h1>Fleet</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
          {[
            ['Available', summary.available, '#1a7f4e'],
            ['Dispatched', summary.dispatched, '#b8860b'],
            ['Out', summary.out, '#8b3a3a'],
            ['Total', summary.total, '#333'],
          ].map(([labelText, value, color]) => (
            <div key={labelText} className="card" style={{ padding: '1rem', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>{labelText}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        <form onSubmit={add} className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'grid', gap: '0.75rem', maxWidth: 480 }}>
          <h3>Add vehicles</h3>
          <label>Label<input value={label} onChange={(e) => setLabel(e.target.value)} /></label>
          <label>Type<input value={type} onChange={(e) => setType(e.target.value)} /></label>
          <label>How many<input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} /></label>
          <button type="submit" className="btn btn-primary">Add to fleet</button>
        </form>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {vehicles.map((v) => (
              <div key={v.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{v.label}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>{v.type || '—'} · {v.status}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['available', 'dispatched', 'out'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={v.status === s ? 'btn btn-primary' : 'btn btn-outline'}
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setStatus(v.id, s)}
                    >
                      {s}
                    </button>
                  ))}
                  <button type="button" className="btn btn-outline" style={{ fontSize: '0.75rem', color: '#c0392b' }} onClick={() => remove(v.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!vehicles.length && <p>No vehicles yet. Add how many you have in the fleet above.</p>}
          </div>
        )}
      </main>
      <BackToTop />
    </div>
  );
}
