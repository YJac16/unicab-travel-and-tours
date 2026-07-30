import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import { getAdminTours, createAdminTour, updateAdminTour } from '../lib/api';

export default function AdminTours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    duration: '',
    price_from: '',
    price_zar: '',
    pricing: '',
    description: '',
    active: true,
  });
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await getAdminTours();
    if (!error) setTours(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (tour) => {
    setEditing(tour.id);
    setForm({
      name: tour.name || '',
      duration: tour.duration || '',
      price_from: tour.price_from || '',
      price_zar: tour.price_zar ?? '',
      pricing: tour.pricing ? JSON.stringify(tour.pricing, null, 2) : '',
      description: tour.description || '',
      active: tour.active !== false,
    });
  };

  const startNew = () => {
    setEditing('new');
    setForm({
      name: '',
      duration: 'Full Day',
      price_from: '',
      price_zar: '',
      pricing: '{\n  "1": 4500,\n  "2": 2500\n}',
      description: '',
      active: true,
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setMessage('');
    let pricing = null;
    if (form.pricing.trim()) {
      try {
        pricing = JSON.parse(form.pricing);
      } catch {
        setMessage('Pricing must be valid JSON');
        return;
      }
    }
    const payload = {
      name: form.name,
      duration: form.duration,
      price_from: form.price_from || null,
      price_zar: form.price_zar !== '' ? Number(form.price_zar) : null,
      pricing,
      description: form.description,
      active: form.active,
    };
    const result =
      editing === 'new'
        ? await createAdminTour(payload)
        : await updateAdminTour(editing, payload);
    if (result.error) {
      setMessage(result.error.message || 'Save failed');
      return;
    }
    setEditing(null);
    setMessage('Saved');
    load();
  };

  return (
    <div>
      <AdminNav />
      <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h1>Tours & Pricing</h1>
          <button type="button" className="btn btn-primary" onClick={startNew}>
            Add tour
          </button>
        </div>
        {message && <p style={{ color: 'var(--accent-gold)' }}>{message}</p>}
        {editing && (
          <form onSubmit={save} className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3>{editing === 'new' ? 'New tour' : 'Edit tour'}</h3>
            <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Duration<input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></label>
            <label>Price from (display)<input value={form.price_from} onChange={(e) => setForm({ ...form, price_from: e.target.value })} /></label>
            <label>Base price ZAR<input type="number" value={form.price_zar} onChange={(e) => setForm({ ...form, price_zar: e.target.value })} /></label>
            <label>Pricing JSON (progressive)<textarea rows={6} value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value })} /></label>
            <label>Description<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Active
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tours.map((tour) => (
              <div key={tour.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <strong>{tour.name}</strong>
                    <div style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>
                      {tour.duration} · {tour.price_from || (tour.price_zar != null ? `R${tour.price_zar}` : 'No price')}
                      {!tour.active && ' · Inactive'}
                    </div>
                  </div>
                  <button type="button" className="btn btn-outline" onClick={() => startEdit(tour)}>Edit</button>
                </div>
              </div>
            ))}
            {!tours.length && <p>No tours in database yet. Add one or seed from static data.</p>}
          </div>
        )}
      </main>    </div>
  );
}
