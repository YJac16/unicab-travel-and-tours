import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * AdminRouteGuard - Secure route guard for admin-only routes
 * 
 * Features:
 * - Prevents non-admin users from accessing admin routes
 * - Prevents unauthenticated users from accessing admin routes
 * - Waits for auth session to load before checking role
 * - Prevents UI flashing and redirect loops
 * - Caches role after first fetch
 */
export const AdminRouteGuard = ({ children }) => {
  const { user, userRole, loading: authLoading, isAuthenticated } = useAuth();
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const roleFetchedRef = useRef(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (checkingRef.current) return;
    
    const checkAdminAccess = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If not authenticated, we'll redirect (handled below)
      if (!isAuthenticated || !user) {
        setRoleLoading(false);
        setRoleChecked(true);
        setIsAdmin(false);
        return;
      }

      // If we've already fetched the role from AuthContext, use it
      if (userRole !== null && !roleFetchedRef.current) {
        const normalizedRole = userRole?.toLowerCase();
        const admin = normalizedRole === 'admin';
        setIsAdmin(admin);
        setRoleChecked(true);
        setRoleLoading(false);
        roleFetchedRef.current = true;
        return;
      }

      // If role is already checked and cached, use cached value
      if (roleChecked && roleFetchedRef.current) {
        return;
      }

      // Fetch role directly from profiles table as additional verification
      checkingRef.current = true;
      setRoleLoading(true);

      try {
        // Try profiles table first
        let role = null;
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profileError && profileData?.role) {
          role = profileData.role.toLowerCase();
        } else {
          // Fallback to user_roles table
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (!roleError && roleData?.role) {
            role = roleData.role.toLowerCase();
          }
        }

        const admin = role === 'admin';
        setIsAdmin(admin);
        setRoleChecked(true);
        roleFetchedRef.current = true;

        console.log('AdminRouteGuard: Role check complete', { 
          userId: user.id, 
          role, 
          isAdmin: admin 
        });
      } catch (error) {
        console.error('AdminRouteGuard: Error checking role', error);
        setIsAdmin(false);
        setRoleChecked(true);
      } finally {
        setRoleLoading(false);
        checkingRef.current = false;
      }
    };

    checkAdminAccess();
  }, [authLoading, isAuthenticated, user, userRole, roleChecked]);

  // Show loading state while checking auth and role
  if (authLoading || roleLoading || !roleChecked) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--border-soft)',
          borderTopColor: 'var(--accent-gold)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{
          color: 'var(--text-soft)',
          fontSize: '0.9rem',
          margin: 0
        }}>
          Verifying access...
        </p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location.pathname }}
      />
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    // Redirect based on user's actual role
    const normalizedRole = userRole?.toLowerCase();
    
    if (normalizedRole === 'driver') {
      return <Navigate to="/driver/dashboard" replace />;
    } else if (normalizedRole === 'member' || normalizedRole === 'customer') {
      return <Navigate to="/member/dashboard" replace />;
    }
    
    // Default: redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and is admin - render admin content
  return children;
};

export default AdminRouteGuard;

