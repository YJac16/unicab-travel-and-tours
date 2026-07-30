import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});
const VIEW_ROLE_KEY = 'unicab_active_view_role';
const VIEW_ROLES = ['admin', 'driver', 'customer'];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function readStoredViewRole() {
  try {
    const v = sessionStorage.getItem(VIEW_ROLE_KEY);
    return VIEW_ROLES.includes(v) ? v : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeViewRole, setActiveViewRoleState] = useState(() => readStoredViewRole());
  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState(null);
  const initializedRef = useRef(false);

  const setActiveViewRole = (role) => {
    const normalized = String(role || '').toLowerCase();
    const next = normalized === 'member' ? 'customer' : normalized;
    if (!VIEW_ROLES.includes(next)) return;
    setActiveViewRoleState(next);
    try {
      sessionStorage.setItem(VIEW_ROLE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const effectiveRole = isOwner && activeViewRole ? activeViewRole : userRole;

  const fetchUserRole = async (userId) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('role, is_owner')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116' && !String(error.message || '').includes('Failed to fetch')) {
        const result = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        data = result.data ? { ...result.data, is_owner: false } : null;
        error = result.error;
      }

      if (error && error.code !== 'PGRST116') {
        if (!String(error.message || '').includes('Failed to fetch')) {
          console.error('Error fetching user role:', error);
        }
        setUserRole('customer');
        setIsOwner(false);
        return;
      }

      const role = data?.role?.toLowerCase() || 'customer';
      const owner = Boolean(data?.is_owner);
      setUserRole(role);
      setIsOwner(owner);
      if (owner && !readStoredViewRole()) {
        setActiveViewRole(role === 'admin' ? 'admin' : role);
      }
      if (!owner) {
        setActiveViewRoleState(null);
        try {
          sessionStorage.removeItem(VIEW_ROLE_KEY);
        } catch {
          /* ignore */
        }
      }
    } catch (error) {
      if (!String(error?.message || '').includes('Failed to fetch')) {
        console.error('Error fetching user role:', error);
      }
      setUserRole('customer');
      setIsOwner(false);
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      setLoading(false);
      return;
    }

    const loadingTimeout = setTimeout(() => {
      console.warn('Auth initialization timeout - setting loading to false');
      setLoading(false);
    }, 5000);

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          clearTimeout(loadingTimeout);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
          await fetchDriverProfile(session.user.id);
        } else {
          setUser(null);
          setUserRole(null);
          setIsOwner(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setUserRole(null);
        setIsOwner(false);
        setActiveViewRoleState(null);
        setDriverProfile(null);
        localStorage.removeItem('auth_token');
        try {
          sessionStorage.removeItem(VIEW_ROLE_KEY);
        } catch {
          /* ignore */
        }
      } else if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
        await fetchDriverProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDriverProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching driver profile:', error);
        return;
      }

      setDriverProfile(data || null);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
    }
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error };
      }

      if (data?.user) {
        setUser(data.user);
        // Don't block sign-in forever on role/profile lookups
        await Promise.race([
          Promise.all([fetchUserRole(data.user.id), fetchDriverProfile(data.user.id)]),
          new Promise((resolve) => setTimeout(resolve, 8000)),
        ]);
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Sign in failed' } };
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (!error && data?.user && (metadata.full_name || metadata.name)) {
      await supabase
        .from('profiles')
        .update({
          full_name: metadata.full_name || metadata.name,
          email: email.toLowerCase().trim(),
        })
        .eq('id', data.user.id);
    }

    return { data, error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setIsOwner(false);
      setActiveViewRoleState(null);
      setDriverProfile(null);
      localStorage.removeItem('auth_token');
      try {
        sessionStorage.removeItem(VIEW_ROLE_KEY);
      } catch {
        /* ignore */
      }
      return { error };
    } catch (err) {
      setUser(null);
      setUserRole(null);
      setIsOwner(false);
      setDriverProfile(null);
      localStorage.removeItem('auth_token');
      return { error: { message: err.message } };
    }
  };

  const value = {
    user,
    userRole,
    effectiveRole,
    isOwner,
    activeViewRole: activeViewRole || userRole,
    setActiveViewRole,
    driverProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isAdmin: effectiveRole === 'admin',
    isDriver: effectiveRole === 'driver',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
