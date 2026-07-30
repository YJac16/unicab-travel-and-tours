import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { login } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { fetchRoleAndGetRedirect, getRedirectPath } from '../lib/authRedirects';
import PasswordInput from '../components/PasswordInput';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signInWithGoogle, signIn: supabaseSignIn, isAuthenticated, userRole, loading: authLoading } = useAuth();

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If user is authenticated, redirect based on role
      if (isAuthenticated && userRole) {
        const redirectPath = getRedirectPath(userRole);
        const from = location.state?.from || redirectPath;
        navigate(from, { replace: true });
        return;
      }

      // If user is authenticated but role not loaded yet, wait and fetch
      if (isAuthenticated) {
        // Wait a bit for role to load from AuthContext
        const checkRole = async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // If role is now available, redirect
          if (userRole) {
            const redirectPath = getRedirectPath(userRole);
            navigate(redirectPath, { replace: true });
          } else {
            // Role still not loaded, fetch directly
            const { supabase } = await import('../lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const redirectPath = await fetchRoleAndGetRedirect(session.user.id);
              navigate(redirectPath, { replace: true });
            }
          }
        };
        
        checkRole();
        return;
      }

      // Not authenticated, show login form
      setCheckingAuth(false);
    };

    checkAuthAndRedirect();
  }, [authLoading, isAuthenticated, userRole, navigate, location]);

  // Check for error in URL params
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'auth_failed') {
      setError('Authentication failed. Please try again.');
      setCheckingAuth(false);
    } else if (urlError === 'no_session') {
      setError('No session found. Please try signing in again.');
      setCheckingAuth(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out`)), ms)
        ),
      ]);

    try {
      // Try Supabase auth first (short timeout — fall back to API if hung)
      let supabaseData = null;
      let supabaseError = null;
      try {
        const result = await withTimeout(
          supabaseSignIn(email, password),
          12000,
          'Sign in'
        );
        supabaseData = result?.data || null;
        supabaseError = result?.error || null;
      } catch (timeoutErr) {
        supabaseError = { message: timeoutErr.message || 'Sign in timed out' };
      }
      
      if (!supabaseError && supabaseData?.user) {
        const redirectParam = searchParams.get('redirect');
        if (redirectParam && redirectParam.startsWith('/')) {
          navigate(redirectParam, { replace: true });
          return;
        }
        const redirectPath = await withTimeout(
          fetchRoleAndGetRedirect(supabaseData.user.id),
          10000,
          'Role lookup'
        );
        navigate(redirectPath, { replace: true });
        return;
      }

      // Fallback to API auth (Supabase session token)
      const { data, error: loginError } = await withTimeout(
        login(email, password),
        20000,
        'API login'
      );

      if (loginError) {
        const errorMessage = loginError.message || loginError.error || loginError.details || supabaseError?.message || 'Failed to sign in';
        setError(errorMessage);
        
        if (errorMessage.includes('Network error') || errorMessage.includes('Could not connect')) {
          setError('Cannot connect to server. Please make sure the backend server is running on port 3000.');
        }
      } else if (data && data.token) {
        localStorage.setItem('auth_token', data.token);

        // Restore Supabase client session when API returns tokens
        if (data.refresh_token) {
          try {
            const { supabase } = await import('../lib/supabase');
            await supabase.auth.setSession({
              access_token: data.token,
              refresh_token: data.refresh_token,
            });
          } catch (sessionErr) {
            console.warn('Could not hydrate Supabase session from API login:', sessionErr);
          }
        }
        
        const role = String(data.user?.role || '').toLowerCase();
        if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (role === 'driver') {
          navigate('/driver/dashboard', { replace: true });
        } else if (role === 'member' || role === 'customer') {
          navigate('/member/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError(supabaseError?.message || 'Invalid response from server. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        setError('Failed to sign in with Google. Please try again.');
        setGoogleLoading(false);
      }
      // If successful, user will be redirected to /auth/callback
    } catch (err) {
      setError('An error occurred during Google sign in.');
      setGoogleLoading(false);
      console.error('Google sign in error:', err);
    }
  };

  // Show loading while checking if user is already authenticated
  if (checkingAuth || authLoading) {
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
          Checking authentication...
        </p>
      </div>
    );
  }

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="UNICAB Travel & Tours - Home">
            <img src="/logo-white.png" alt="UNICAB Travel & Tours" className="logo-img" />
          </Link>
          <Link to="/" className="btn btn-outline btn-compact hub-chrome-btn" style={{ marginLeft: 'auto' }}>
            Home
          </Link>
        </div>
      </header>

      <main>
        <section className="section" style={{ paddingTop: "7rem", paddingBottom: "4rem" }}>
          <div className="container">
            <div style={{ maxWidth: "440px", margin: "0 auto" }}>
              <div className="login-card">
                <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>UNICAB</p>
                <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Sign in</h1>
                <p style={{ color: "var(--text-soft)", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
                  Access your admin, driver, or member hub.
                </p>

                {error && (
                  <div style={{
                    padding: "0.85rem 1rem",
                    background: "var(--accent-gold-soft)",
                    border: "1px solid var(--border-gold)",
                    borderRadius: "8px",
                    marginBottom: "1.25rem",
                    color: "var(--text-main)",
                    fontSize: "0.9rem"
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor="login-email" style={{ 
                      display: "block", 
                      marginBottom: "0.4rem", 
                      fontSize: "0.8rem",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)"
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      id="login-email"
                      name="login-email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="login-password" style={{ 
                      display: "block", 
                      marginBottom: "0.4rem", 
                      fontSize: "0.8rem",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)"
                    }}>
                      Password
                    </label>
                    <PasswordInput
                      id="login-password"
                      name="login-password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || googleLoading}
                    style={{ 
                      width: "100%", 
                      fontSize: "0.95rem", 
                      padding: "0.9rem",
                      marginBottom: "1rem"
                    }}
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </button>
                </form>

                <div style={{ 
                  marginTop: "1.5rem", 
                  paddingTop: "1.5rem",
                  borderTop: "1px solid var(--border-soft)"
                }}>
                  <div style={{ 
                    textAlign: "center", 
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                    color: "var(--text-soft)"
                  }}>
                    Or
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="btn btn-outline"
                    style={{ 
                      width: "100%", 
                      fontSize: "1rem", 
                      padding: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}
                  >
                    {googleLoading ? (
                      "Signing in..."
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </button>
                </div>

                <div style={{ 
                  textAlign: "center", 
                  paddingTop: "1.5rem",
                  borderTop: "1px solid var(--border-soft)"
                }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-soft)", marginBottom: "1rem" }}>
                    Don't have an account?
                  </p>
                  <Link 
                    to="/member/register" 
                    className="btn btn-outline"
                    style={{ 
                      textDecoration: "none",
                      display: "inline-block",
                      marginBottom: "1rem"
                    }}
                  >
                    Create Member Account
                  </Link>
                </div>

                <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-soft)", marginTop: "1.5rem" }}>
                  <Link to="/" style={{ color: "var(--accent-gold)" }}>
                    ← Back to Home
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;





