import React from 'react';
import { Link } from 'react-router-dom';
import DocumentTitle from '../components/DocumentTitle';
import PublicHeader from '../components/PublicHeader';
import SiteFooter from '../components/SiteFooter';

export default function NotFound() {
  return (
    <>
      <DocumentTitle
        title="Page not found"
        description="The page you requested could not be found on the UNICAB Travel & Tours website."
      />
      <PublicHeader />
      <main className="section" style={{ paddingTop: '8rem', minHeight: '60vh' }}>
        <div className="container section-inner center">
          <p className="eyebrow">404</p>
          <h1>Page not found</h1>
          <p className="section-intro max-720">
            This page does not exist or may have moved. Return home or contact us to arrange a transfer or tour.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link to="/" className="btn btn-primary">
              Back to home
            </Link>
            <Link to="/book" className="btn btn-grey">
              Book a service
            </Link>
            <Link to="/#contact" className="btn btn-outline">
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
