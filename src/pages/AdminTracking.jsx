import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import BackToTop from '../components/BackToTop';
import LiveMap from '../components/LiveMap';
import { getAdminTracking } from '../lib/api';

export default function AdminTracking() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await getAdminTracking();
    if (!error) setTrips(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <AdminNav />
      <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
        <h1>Live tracking</h1>
        <p style={{ color: 'var(--text-soft)' }}>
          Active trips (en route to pickup or on tour). Updates every few seconds.
        </p>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {trips.map((trip) => (
              <div key={trip.id} className="card" style={{ padding: '1rem' }}>
                <strong>{trip.tour?.name || 'Tour'}</strong>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-soft)', marginBottom: '0.75rem' }}>
                  {trip.driver?.name || 'Driver'} · {trip.customer_name} · {trip.trip_status}
                  {trip.pickup_address ? ` · Pickup: ${trip.pickup_address}` : ''}
                </div>
                <LiveMap
                  lat={trip.location?.lat != null ? Number(trip.location.lat) : null}
                  lng={trip.location?.lng != null ? Number(trip.location.lng) : null}
                  label={trip.driver?.name || 'Driver'}
                />
              </div>
            ))}
            {!trips.length && <p>No drivers currently on active trips.</p>}
          </div>
        )}
      </main>
      <BackToTop />
    </div>
  );
}
