import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../config';

const ESSENTIAL_ONLY = {
  essential: true,
  analytics: false,
};

function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
          setShowBanner(true);
        } else {
          const savedPrefs = JSON.parse(consent);
          if (savedPrefs && typeof savedPrefs === 'object') {
            setPreferences(savedPrefs);
            if (savedPrefs.analytics) {
              loadAnalytics();
            }
          } else {
            setShowBanner(true);
          }
        }
      } catch (error) {
        console.error('Error reading cookie consent:', error);
        setShowBanner(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const loadAnalytics = () => {
    const measurementId = siteConfig.analytics?.gaMeasurementId;
    if (!measurementId || typeof window === 'undefined') return;
    if (window.gtag) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { anonymize_ip: true });
  };

  const persistAndClose = (nextPrefs) => {
    setPreferences(nextPrefs);
    localStorage.setItem('cookie_consent', JSON.stringify(nextPrefs));
    setShowBanner(false);
    setShowSettings(false);
    if (nextPrefs.analytics) {
      loadAnalytics();
    }
  };

  const handleAccept = () => {
    persistAndClose({
      essential: true,
      analytics: true,
    });
  };

  const handleReject = () => {
    persistAndClose(ESSENTIAL_ONLY);
  };

  const handleSaveSettings = () => {
    persistAndClose(preferences);
  };

  // Close records essential-only consent so optional analytics stay off.
  const handleDismiss = () => {
    persistAndClose(ESSENTIAL_ONLY);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className="cookie-consent-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
    >
      <div className="cookie-consent-inner">
        <button
          type="button"
          className="cookie-consent-close"
          onClick={handleDismiss}
          aria-label="Dismiss cookie notice. Essential cookies only will be used."
        >
          <span aria-hidden="true">×</span>
        </button>

        {!showSettings ? (
          <>
            <div className="cookie-consent-copy">
              <p id="cookie-consent-title" className="cookie-consent-lead">
                Essential cookies keep the site working. Optional analytics stay off until you accept.{' '}
                <Link to="/cookie-policy">Cookie Policy</Link>
                {' · '}
                <Link to="/privacy-policy">Privacy Policy</Link>
              </p>
            </div>
            <div className="cookie-consent-actions">
              <button type="button" onClick={handleAccept} className="btn btn-primary btn-compact">
                Accept
              </button>
              <button type="button" onClick={handleReject} className="btn btn-outline btn-compact">
                Reject
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="cookie-consent-settings-link"
              >
                Settings
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cookie-consent-copy">
              <h3 id="cookie-consent-title" className="cookie-consent-settings-title">
                Cookie settings
              </h3>
              <div className="cookie-consent-pref">
                <div>
                  <strong>Essential cookies</strong>
                  <p>Required for the website to function properly</p>
                </div>
                <input type="checkbox" checked={preferences.essential} disabled />
              </div>
              <div className="cookie-consent-pref">
                <div>
                  <strong>Analytics cookies</strong>
                  <p>Help us understand how visitors use the site</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                />
              </div>
            </div>
            <div className="cookie-consent-actions">
              <button type="button" onClick={handleSaveSettings} className="btn btn-primary btn-compact">
                Save preferences
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="btn btn-outline btn-compact"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CookieConsent;
