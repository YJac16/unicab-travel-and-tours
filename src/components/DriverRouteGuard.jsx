import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * DriverRouteGuard — driver hub (owners allowed when viewing as driver).
 */
export const DriverRouteGuard = ({ children }) => {
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
  const allowed = isOwner ? role === 'driver' : role === 'driver';

  if (!allowed) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'customer' || role === 'member') return <Navigate to="/member/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
