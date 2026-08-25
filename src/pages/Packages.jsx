import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DocumentTitle from '../components/DocumentTitle';
import PublicHeader from '../components/PublicHeader';
import SiteFooter from '../components/SiteFooter';
import { getPackages, submitLeadEnquiry, getPublicPriceLabel } from '../lib/api';

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
    <>
      <DocumentTitle
        title="Packages"
        description="Curated private tour packages with UNICAB chauffeurs in Cape Town and the Western Cape."
      />
      <PublicHeader />
      <main className="section page-section">
        <div className="container section-inner">
          <header className="section-header center">
            <p className="eyebrow">Packages</p>
            <h1>Curated experiences</h1>
            <p className="section-intro max-720">
              Bookable packages continue to the tour booking flow. Quote-only packages create a lead for our team.
            </p>
          </header>

          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading…</p>
          ) : (
            <div className="cards-grid">
              {packages.map((pkg) => (
                <article className="card soft" key={pkg.id}>
                  <h2 className="card-title">{pkg.name}</h2>
                  <p className="card-meta">{pkg.summary}</p>
                  <p className="tour-price">{getPublicPriceLabel(pkg)}</p>
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
              ))}
            </div>
          )}

          {enquiry && (
            <section className="card soft enquiry-panel" aria-labelledby="enquiry-heading">
              <h2 id="enquiry-heading">Enquire: {enquiry.name}</h2>
              <form className="contact-form" onSubmit={submitEnquire}>
                <div className="form-field">
                  <label htmlFor="pkg-name">Full name</label>
                  <input
                    id="pkg-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pkg-email">Email</label>
                  <input
                    id="pkg-email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pkg-phone">Phone</label>
                  <input
                    id="pkg-phone"
                    required
                    minLength={7}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pkg-message">Message</label>
                  <textarea
                    id="pkg-message"
                    required
                    minLength={10}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    placeholder="Dates, group size, preferences…"
                  />
                </div>
                <div className="card-actions">
                  <button type="submit" className="btn btn-primary">
                    Send enquiry
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setEnquiry(null)}>
                    Cancel
                  </button>
                </div>
                {status && <p role="status">{status}</p>}
              </form>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
