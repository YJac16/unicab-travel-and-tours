import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminRouteGuard — admin hub only (owners allowed when viewing as admin).
 */
export const AdminRouteGuard = ({ children }) => {
  const { user, effectiveRole, isOwner, loading: authLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'var(--bg-main)',
          gap: '1rem',
        }}
      >
        <p style={{ color: 'var(--text-soft)', margin: 0 }}>Verifying access...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = effectiveRole?.toLowerCase();
  const allowed = isOwner ? role === 'admin' : role === 'admin';

  if (!allowed) {
    if (role === 'driver') return <Navigate to="/driver/dashboard" replace />;
    if (role === 'customer' || role === 'member') return <Navigate to="/member/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
