import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DocumentTitle from '../components/DocumentTitle';
import SiteFooter from '../components/SiteFooter';
import BackToTop from '../components/BackToTop';
import { getPackages, submitLeadEnquiry, formatTourPrice } from '../lib/api';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enquiry, setEnquiry] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      const { data } = await getPackages();
      setPackages(data || []);
      setLoading(false);
      const preselect = searchParams.get('package');
      if (preselect) {
        const match = (data || []).find((p) => p.id === preselect);
        if (match) setEnquiry(match);
      }
    })();
  }, [searchParams]);

  const submitEnquire = async (e) => {
    e.preventDefault();
    setStatus('Sending…');
    const { error } = await submitLeadEnquiry({
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message || `Interested in package: ${enquiry?.name || enquiry?.id}`,
      package_id: enquiry?.id,
    });
    if (error) {
      setStatus(error.message || 'Could not send enquiry');
      return;
    }
    setStatus('Thank you — we will follow up shortly.');
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div>
      <DocumentTitle
        title="Packages"
        description="Curated multi-stop private tour packages with UNICAB chauffeurs in Cape Town."
      />
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <img src="/logo-white.png" alt="UNICAB" className="logo-img" />
          </Link>
          <Link to="/book" className="btn btn-primary btn-compact" style={{ marginLeft: 'auto' }}>
            Book Now
          </Link>
        </div>
      </header>
      <main className="container" style={{ padding: '7rem 1rem 4rem' }}>
        <p className="eyebrow">Packages</p>
        <h1>Curated experiences</h1>
        <p style={{ color: 'var(--text-soft)', maxWidth: 640 }}>
          Bookable packages go straight to the tour booking flow. Quote-only packages create a lead for our team.
        </p>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="cards-grid" style={{ marginTop: '2rem' }}>
            {packages.map((pkg) => {
              const fromLabel =
                pkg.from_price_zar != null
                  ? `From ${formatTourPrice(pkg.from_price_zar)}`
                  : 'Custom quote';
              return (
                <article className="card soft" key={pkg.id}>
                  <h2 className="card-title">{pkg.name}</h2>
                  <p style={{ color: 'var(--text-soft)' }}>{pkg.summary}</p>
                  <p style={{ fontWeight: 600 }}>{fromLabel}</p>
                  {pkg.bookable && pkg.tour_id ? (
                    <Link className="btn btn-primary" to={`/tours/${pkg.tour_id}/booking?package=${pkg.id}`}>
                      Book package
                    </Link>
                  ) : pkg.bookable ? (
                    <Link className="btn btn-primary" to={`/book?package=${pkg.id}`}>
                      Book package
                    </Link>
                  ) : (
                    <button type="button" className="btn btn-outline" onClick={() => setEnquiry(pkg)}>
                      Request quote
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {enquiry && (
          <section className="card soft" style={{ marginTop: '2rem', padding: '1.5rem', maxWidth: 520 }}>
            <h2>Enquire: {enquiry.name}</h2>
            <form onSubmit={submitEnquire} style={{ display: 'grid', gap: '0.75rem' }}>
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ padding: '0.65rem', borderRadius: 8, border: '1px solid var(--border-soft)' }}
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ padding: '0.65rem', borderRadius: 8, border: '1px solid var(--border-soft)' }}
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ padding: '0.65rem', borderRadius: 8, border: '1px solid var(--border-soft)' }}
              />
              <textarea
                required
                minLength={10}
                placeholder="Dates, group size, preferences…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                style={{ padding: '0.65rem', borderRadius: 8, border: '1px solid var(--border-soft)' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  Send enquiry
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setEnquiry(null)}>
                  Cancel
                </button>
              </div>
              {status && <p style={{ color: 'var(--accent-gold)' }}>{status}</p>}
            </form>
          </section>
        )}
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
