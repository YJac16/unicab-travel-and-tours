import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState(null);
  const initializedRef = useRef(false);

  // Fetch user role from profiles table
  const fetchUserRole = async (userId) => {
    try {
      // Try profiles table first (as per user's context)
      let { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // If profiles table doesn't exist or returns error, try user_roles table
      if (error && error.code !== 'PGRST116' && !String(error.message || '').includes('Failed to fetch')) {
        console.log('Profiles table not found, trying user_roles...', error);
        const result = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error && error.code !== 'PGRST116') {
        if (!String(error.message || '').includes('Failed to fetch')) {
          console.error('Error fetching user role:', error);
        }
        setUserRole('customer');
        return;
      }

      const role = data?.role?.toLowerCase() || 'customer';
      setUserRole(role);
      console.log('User role fetched:', role, 'for user:', userId);
    } catch (error) {
      if (!String(error?.message || '').includes('Failed to fetch')) {
        console.error('Error fetching user role:', error);
      }
      setUserRole('customer');
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      setLoading(false);
      return;
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('Auth initialization timeout - setting loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    // Initialize session immediately
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          clearTimeout(loadingTimeout);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Session found for user:', session.user.id);
          setUser(session.user);
          // Fetch role immediately
          await fetchUserRole(session.user.id);
          await fetchDriverProfile(session.user.id);
        } else {
          console.log('No session found');
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION with no user is normal for anonymous visitors
      if (event !== 'INITIAL_SESSION' || session?.user) {
        console.log('Auth state changed:', event, session?.user?.id || 'anonymous');
      }
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        // Clear all auth state on sign out
        setUser(null);
        setUserRole(null);
        setDriverProfile(null);
        // Clear any cached tokens
        localStorage.removeItem('auth_token');
      } else if (session?.user) {
        setUser(session.user);
        // Fetch role after session is established
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
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching driver profile:', error);
        return;
      }

      setDriverProfile(data);
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
        console.error('Sign in error:', error);
        return { data: null, error };
      }

      if (data?.user) {
        console.log('Sign in successful for user:', data.user.id);
        setUser(data.user);
        // Fetch role after successful login
        await fetchUserRole(data.user.id);
        await fetchDriverProfile(data.user.id);
      }

      return { data, error: null };
    } catch (err) {
      console.error('Sign in exception:', err);
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
      options: {
        data: metadata,
      },
    });

    // Profile is auto-created by handle_new_user trigger; sync display fields if provided
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
      setDriverProfile(null);
      // Clear any JWT tokens from localStorage
      localStorage.removeItem('auth_token');
      return { error };
    } catch (err) {
      console.error('Sign out error:', err);
      // Still clear state even if signOut fails
      setUser(null);
      setUserRole(null);
      setDriverProfile(null);
      localStorage.removeItem('auth_token');
      return { error: { message: err.message } };
    }
  };

  const value = {
    user,
    userRole,
    driverProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isAdmin: userRole === 'admin',
    isDriver: userRole === 'driver',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};





