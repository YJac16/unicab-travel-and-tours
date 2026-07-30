import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import HubChromeActions from '../components/HubChromeActions';
import {
  getDriverBooking,
  updateDriverTripStatus,
  postDriverLocation,
} from '../lib/api';

function mapsUrl(booking) {
  if (booking.pickup_lat != null && booking.pickup_lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_lat},${booking.pickup_lng}`;
  }
  if (booking.pickup_address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.pickup_address)}`;
  }
  return null;
}

export default function DriverTrip() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const watchRef = useRef(null);

  const load = async () => {
    const { data, error: err } = await getDriverBooking(id);
    if (err) {
      setError(err.message || 'Failed to load trip');
      return;
    }
    setBooking(data);
  };

  useEffect(() => {
    load();
  }, [id]);

  // Live GPS while en route / on tour
  useEffect(() => {
    if (!booking) return undefined;
    const active = ['en_route_pickup', 'on_tour'].includes(booking.trip_status);
    if (!active || !navigator.geolocation) {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return undefined;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        postDriverLocation(id, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
        });
      },
      (err) => console.warn('Geolocation error', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, [booking?.trip_status, id]);

  const setStatus = async (trip_status) => {
    setUpdating(true);
    const { data, error: err } = await updateDriverTripStatus(id, trip_status);
    setUpdating(false);
    if (err) {
      alert(err.message || 'Update failed');
      return;
    }
    setBooking(data);
  };

  if (error) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <p>{error}</p>
        <Link to="/driver/dashboard">Back</Link>
      </div>
    );
  }

  if (!booking) {
    return <div className="container" style={{ padding: '2rem' }}>Loading trip…</div>;
  }

  const client = booking.customer || {};
  const mapLink = mapsUrl(booking);
  const avatar = client.avatar_url;

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/driver/dashboard" className="logo">
            <img src="/logo-white.png" alt="UNICAB" className="logo-img" />
          </Link>
          <div className="hub-header-actions" style={{ marginLeft: 'auto' }}>
            <HubChromeActions />
            <ProfileDropdown />
          </div>
        </div>
      </header>
      <main className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: 720 }}>
        <Link to="/driver/dashboard" style={{ fontSize: '0.9rem' }}>← Schedule</Link>
        <h1 style={{ marginTop: '0.75rem' }}>{booking.tour?.name || 'Trip'}</h1>
        <p style={{ color: 'var(--text-soft)' }}>
          {booking.booking_date} {booking.booking_time || ''} · Status: {booking.trip_status || booking.status}
        </p>

        <section className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
          <h3>Client</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {avatar ? (
              <img src={avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-soft)', display: 'grid', placeItems: 'center' }}>
                {(booking.customer_name || '?')[0]}
              </div>
            )}
            <div>
              <strong>{booking.customer_name || client.full_name || 'Guest'}</strong>
              <div>{booking.customer_phone || 'No phone'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>{booking.customer_email || client.email}</div>
            </div>
          </div>
          {booking.pickup_address && (
            <p style={{ marginTop: '1rem' }}><strong>Pickup:</strong> {booking.pickup_address}</p>
          )}
          {mapLink && (
            <a className="btn btn-primary" href={mapLink} target="_blank" rel="noreferrer" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
              Open maps to pickup
            </a>
          )}
        </section>

        <section className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
          <h3>Trip controls</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
            Live tracking runs while this page is open and status is en route or on tour.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-outline" disabled={updating} onClick={() => setStatus('en_route_pickup')}>
              En route to pickup
            </button>
            <button type="button" className="btn btn-outline" disabled={updating} onClick={() => setStatus('on_tour')}>
              On tour
            </button>
            <button type="button" className="btn btn-primary" disabled={updating} onClick={() => setStatus('completed')}>
              Complete trip
            </button>
            <button type="button" className="btn btn-outline" disabled={updating} onClick={() => setStatus('cancelled')}>
              Cancel
            </button>
          </div>
        </section>
      </main>    </div>
  );
}
