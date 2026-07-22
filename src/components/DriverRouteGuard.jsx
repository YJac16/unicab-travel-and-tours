import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * DriverRouteGuard - Secure route guard for driver-only routes
 * 
 * Features:
 * - Prevents non-driver users from accessing driver routes
 * - Prevents unauthenticated users from accessing driver routes
 * - Waits for auth session to load before checking role
 * - Prevents UI flashing and redirect loops
 * - Caches role after first fetch
 * - Optionally verifies driver record exists in drivers table
 */
export const DriverRouteGuard = ({ children }) => {
  const { user, userRole, loading: authLoading, isAuthenticated } = useAuth();
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const location = useLocation();
  const roleFetchedRef = useRef(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (checkingRef.current) return;
    
    const checkDriverAccess = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If not authenticated, we'll redirect (handled below)
      if (!isAuthenticated || !user) {
        setRoleLoading(false);
        setRoleChecked(true);
        setIsDriver(false);
        return;
      }

      // If we've already fetched the role from AuthContext, use it
      if (userRole !== null && !roleFetchedRef.current) {
        const normalizedRole = userRole?.toLowerCase();
        const driver = normalizedRole === 'driver';
        setIsDriver(driver);
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

        const driver = role === 'driver';
        setIsDriver(driver);
        setRoleChecked(true);
        roleFetchedRef.current = true;

        // Optional: Verify driver record exists in drivers table
        if (driver) {
          const { data: driverRecord, error: driverError } = await supabase
            .from('drivers')
            .select('id, active')
            .eq('user_id', user.id)
            .single();

          if (driverError && driverError.code !== 'PGRST116') {
            console.warn('DriverRouteGuard: Driver record not found or error', driverError);
            // Still allow access if role is driver, but log warning
          } else if (driverRecord && !driverRecord.active) {
            console.warn('DriverRouteGuard: Driver record exists but is inactive');
            // Still allow access - inactive status can be handled in UI
          }
        }

        console.log('DriverRouteGuard: Role check complete', { 
          userId: user.id, 
          role, 
          isDriver: driver 
        });
      } catch (error) {
        console.error('DriverRouteGuard: Error checking role', error);
        setIsDriver(false);
        setRoleChecked(true);
      } finally {
        setRoleLoading(false);
        checkingRef.current = false;
      }
    };

    checkDriverAccess();
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

  // Redirect if not driver
  if (!isDriver) {
    // Redirect based on user's actual role
    const normalizedRole = userRole?.toLowerCase();
    
    if (normalizedRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (normalizedRole === 'member' || normalizedRole === 'customer') {
      return <Navigate to="/member/dashboard" replace />;
    }
    
    // Default: redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and is driver - render driver content
  return children;
};

export default DriverRouteGuard;






