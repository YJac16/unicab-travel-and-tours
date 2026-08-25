import React from 'react';
import { Link } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import DocumentTitle from '../components/DocumentTitle';

function CancellationPolicy() {
  return (
    <div>
      <DocumentTitle title="Cancellation Policy" description="UNICAB Travel & Tours cancellation and refund policy." />
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <img src="/logo-white.png" alt="UNICAB" className="logo-img" />
          </Link>
          <Link to="/" className="btn btn-outline btn-compact hub-chrome-btn" style={{ marginLeft: 'auto' }}>
            Home
          </Link>
        </div>
      </header>
      <main className="container" style={{ padding: '7rem 1rem 4rem', maxWidth: 760 }}>
        <h1>Cancellation &amp; Refund Policy</h1>
        <p style={{ color: 'var(--text-soft)' }}>Last updated: July 2026</p>
        <section style={{ display: 'grid', gap: '1rem', lineHeight: 1.7 }}>
          <p>
            We understand plans change. The following guidelines apply to standard private tours and transfers
            unless a written corporate agreement states otherwise.
          </p>
          <h2>Guest cancellations</h2>
          <ul>
            <li>
              <strong>More than 48 hours</strong> before pickup: full refund of the tour/transfer fee paid,
              less any non-refundable third-party tickets already purchased on your behalf.
            </li>
            <li>
              <strong>24–48 hours</strong> before pickup: 50% refund of the tour/transfer fee.
            </li>
            <li>
              <strong>Less than 24 hours</strong> or no-show: non-refundable.
            </li>
          </ul>
          <h2>Operator cancellations</h2>
          <p>
            If we must cancel due to safety, vehicle failure, or circumstances beyond our control, you will receive
            a full refund or the option to reschedule at no extra charge.
          </p>
          <h2>Memberships</h2>
          <p>
            Membership is prepaid for one calendar month via YOCO and does not auto-renew. You may
            end the plan early from your member hub; otherwise benefits last until the paid period
            ends. To continue after that date, pay again for another month. Refunds for unused
            membership days are not provided unless required by law.
          </p>
          <h2>How to cancel</h2>
          <p>
            Email info@unicabtravel.co.za with your booking reference, or message us on WhatsApp. Refunds are returned
            to the original payment method within 5–10 business days after approval.
          </p>
          <p>
            Related: <Link to="/terms">Terms of Service</Link>, <Link to="/privacy-policy">Privacy Policy</Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default CancellationPolicy;
