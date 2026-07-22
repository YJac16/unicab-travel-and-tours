import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always on
    analytics: false,
  });

  useEffect(() => {
    // Small delay to ensure DOM is ready and avoid flash
    const timer = setTimeout(() => {
      try {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
          setShowBanner(true);
        } else {
          const savedPrefs = JSON.parse(consent);
          if (savedPrefs && typeof savedPrefs === 'object') {
            setPreferences(savedPrefs);
            // Load analytics if opted in
            if (savedPrefs.analytics) {
              loadAnalytics();
            }
          } else {
            // Invalid consent data, show banner again
            setShowBanner(true);
          }
        }
      } catch (error) {
        // If parsing fails, show banner again
        console.error('Error reading cookie consent:', error);
        setShowBanner(true);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const loadAnalytics = () => {
    // Only load analytics if user has opted in
    // Add your analytics script here (e.g., Google Analytics)
    if (typeof window !== 'undefined' && window.gtag) {
      // Analytics already loaded
      return;
    }
    
    // Example: Load Google Analytics
    // You can add your actual analytics code here
    console.log('Analytics cookies enabled');
  };

  const handleAccept = () => {
    const newPrefs = {
      essential: true,
      analytics: true,
    };
    setPreferences(newPrefs);
    localStorage.setItem('cookie_consent', JSON.stringify(newPrefs));
    setShowBanner(false);
    setShowSettings(false);
    loadAnalytics();
  };

  const handleReject = () => {
    const newPrefs = {
      essential: true,
      analytics: false,
    };
    setPreferences(newPrefs);
    localStorage.setItem('cookie_consent', JSON.stringify(newPrefs));
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('cookie_consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
    if (preferences.analytics) {
      loadAnalytics();
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className="cookie-consent-banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: '2px solid var(--accent-gold)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        zIndex: 10000,
        padding: '1.5rem',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {!showSettings ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                We use essential cookies to make our website function and optional analytics cookies to improve our services.
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                By continuing to use this site, you consent to our use of cookies.{' '}
                <Link to="/cookie-policy" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                  Cookie Policy
                </Link>
                {' • '}
                <Link to="/privacy-policy" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <button
                onClick={handleAccept}
                className="btn btn-primary"
                style={{ 
                  minWidth: '100px',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.85rem'
                }}
              >
                Accept All
              </button>
              <button
                onClick={handleReject}
                className="btn btn-outline"
                style={{ 
                  minWidth: '100px',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.85rem'
                }}
              >
                Reject All
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="btn btn-outline"
                style={{ 
                  minWidth: '100px',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.85rem'
                }}
              >
                Settings
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>
              Cookie Settings
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                marginBottom: '1rem',
                padding: '1rem',
                background: 'var(--bg-soft)',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <strong>Essential Cookies</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                      Required for the website to function properly
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.essential}
                    disabled
                    style={{ cursor: 'not-allowed' }}
                  />
                </div>
              </div>
              
              <div style={{ 
                padding: '1rem',
                background: 'var(--bg-soft)',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>Analytics Cookies</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                      Help us understand how visitors interact with our website
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleSaveSettings}
                className="btn btn-primary btn-compact"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-outline btn-compact"
              >
                Cancel
              </button>
            </div>
            
            <p style={{ 
              marginTop: '1rem', 
              fontSize: '0.85rem', 
              color: 'var(--text-soft)' 
            }}>
              <Link to="/cookie-policy" style={{ color: 'var(--accent-gold)' }}>
                Read our Cookie Policy
              </Link>
              {' • '}
              <Link to="/privacy-policy" style={{ color: 'var(--accent-gold)' }}>
                Privacy Policy
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default CookieConsent;






