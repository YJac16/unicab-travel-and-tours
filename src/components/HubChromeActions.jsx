import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Compact Home + Sign out for hub headers (admin / driver / member).
 */
export default function HubChromeActions({ showSignOut = true }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="hub-chrome-actions">
      <Link to="/" className="btn btn-outline btn-compact hub-chrome-btn">
        Home
      </Link>
      {showSignOut && user && (
        <button
          type="button"
          className="btn btn-outline btn-compact hub-chrome-btn"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      )}
    </div>
  );
}
