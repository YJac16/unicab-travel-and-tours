import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMemberBooking } from '../lib/api';
import { supabase } from '../lib/supabase';
import ProfileDropdown from '../components/ProfileDropdown';
import HubChromeActions from '../components/HubChromeActions';
import LiveMap from '../components/LiveMap';
import BackToTop from '../components/BackToTop';
import TourReviewForm from '../components/TourReviewForm';
import DriverReviewForm from '../components/DriverReviewForm';

export default function MemberBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await getMemberBooking(id);
      if (err) {
        setError(err.message || 'Failed to load');
        return;
      }
      setBooking(data);
      setLocation(data?.location || null);
    })();
  }, [id]);

  useEffect(() => {
    if (!booking || !['en_route_pickup', 'on_tour'].includes(booking.trip_status)) return undefined;
    const channel = supabase
      .channel(`driver-loc-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations', filter: `booking_id=eq.${id}` },
        (payload) => setLocation(payload.new || payload.record || null)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.trip_status, id]);

  if (error) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <p>{error}</p>
        <Link to="/member/dashboard">Back</Link>
      </div>
    );
  }

  if (!booking) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  const driver = booking.driver;
  const profile = booking.driver_profile;

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/member/dashboard" className="logo">
            <img src="/logo-white.png" alt="UNICAB" className="logo-img" />
          </Link>
          <div className="hub-header-actions" style={{ marginLeft: 'auto' }}>
            <HubChromeActions />
            <ProfileDropdown />
          </div>
        </div>
      </header>
      <main className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: 720 }}>
        <Link to="/member/dashboard">← My bookings</Link>
        <h1 style={{ marginTop: '0.75rem' }}>{booking.tour?.name || 'Booking'}</h1>
        <p style={{ color: 'var(--text-soft)' }}>
          {booking.booking_date} {booking.booking_time || ''} · {booking.status}
          {booking.trip_status ? ` · ${booking.trip_status}` : ''}
        </p>

        <section className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
          <h3>Your driver</h3>
          {driver ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-soft)', display: 'grid', placeItems: 'center' }}>
                  {(driver.name || '?')[0]}
                </div>
              )}
              <div>
                <strong>{driver.name}</strong>
                <div>{driver.phone || 'Phone on request'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>{driver.email}</div>
              </div>
            </div>
          ) : (
            <p>Driver will be assigned soon.</p>
          )}
        </section>

        {booking.pickup_address && (
          <p style={{ marginTop: '1rem' }}><strong>Pickup:</strong> {booking.pickup_address}</p>
        )}

        {['en_route_pickup', 'on_tour'].includes(booking.trip_status) && (
          <section style={{ marginTop: '1.25rem' }}>
            <h3>Live tracking</h3>
            <LiveMap
              lat={location?.lat != null ? Number(location.lat) : null}
              lng={location?.lng != null ? Number(location.lng) : null}
              label={driver?.name || 'Driver'}
            />
          </section>
        )}

        {(booking.status === 'completed' || booking.trip_status === 'completed') && (
          <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
            <h3>Leave a review</h3>
            {booking.tour_id && (
              <TourReviewForm
                tourId={booking.tour_id || booking.tour?.id}
                bookingId={booking.id}
              />
            )}
            {(booking.driver_id || booking.driver?.id) && (
              <DriverReviewForm
                driverId={booking.driver_id || booking.driver?.id}
                bookingId={booking.id}
              />
            )}
          </section>
        )}
      </main>
      <BackToTop />
    </div>
  );
}
