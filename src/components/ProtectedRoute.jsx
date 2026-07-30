import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, effectiveRole, userRole, isOwner, loading } = useAuth();
  const roleForGuard = effectiveRole || userRole;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const normalizedRequired = requiredRole.toLowerCase();
    const normalizedUserRole = roleForGuard?.toLowerCase();

    const roleMatches =
      isOwner ||
      (normalizedRequired === 'member'
        ? normalizedUserRole === 'member' || normalizedUserRole === 'customer'
        : normalizedUserRole === normalizedRequired);

    if (!roleMatches) {
      if (normalizedUserRole === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (normalizedUserRole === 'driver') {
        return <Navigate to="/driver/dashboard" replace />;
      }
      if (normalizedUserRole === 'member' || normalizedUserRole === 'customer') {
        return <Navigate to="/member/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};
