import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import {
  getAdminInvoices,
  createAdminInvoice,
  updateAdminInvoice,
  downloadAdminInvoicePdf,
  getAdminBookings,
} from '../lib/api';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const [inv, books] = await Promise.all([getAdminInvoices(), getAdminBookings()]);
    if (!inv.error) setInvoices(inv.data || []);
    if (!books.error) setBookings(books.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createFromBooking = async (e) => {
    e.preventDefault();
    setMessage('');
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setMessage('Select a booking');
      return;
    }
    const { error } = await createAdminInvoice({
      booking_id: booking.id,
      user_id: booking.user_id || null,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      amount_zar: booking.total_price || 0,
      line_items: [
        {
          description: `${booking.tour?.name || 'Tour'} — ${booking.booking_date}`,
          amount_zar: Number(booking.total_price || 0),
        },
      ],
      status: booking.payment_status === 'paid' ? 'paid' : 'sent',
    });
    if (error) {
      setMessage(error.message || 'Failed to create invoice');
      return;
    }
    setMessage('Invoice created');
    setBookingId('');
    load();
  };

  const markPaid = async (id) => {
    await updateAdminInvoice(id, { status: 'paid' });
    load();
  };

  const download = async (id, number) => {
    await downloadAdminInvoicePdf(id, number);
  };

  return (
    <div>
      <AdminNav />
      <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
        <h1>Invoices</h1>
        <form onSubmit={createFromBooking} className="card" style={{ padding: '1rem', margin: '1rem 0', display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
          <h3>Create from booking</h3>
          <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} required>
            <option value="">Select booking…</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.booking_date} · {b.customer_name} · R{b.total_price || 0}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">Create invoice</button>
          {message && <p>{message}</p>}
        </form>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {invoices.map((inv) => (
              <div key={inv.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{inv.number}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                    {inv.customer_name} · R{Number(inv.amount_zar || 0).toFixed(2)} · {inv.status}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => download(inv.id, inv.number)}>PDF</button>
                  {inv.status !== 'paid' && (
                    <button type="button" className="btn btn-primary" onClick={() => markPaid(inv.id)}>Mark paid</button>
                  )}
                </div>
              </div>
            ))}
            {!invoices.length && <p>No invoices yet.</p>}
          </div>
        )}
      </main>    </div>
  );
}
