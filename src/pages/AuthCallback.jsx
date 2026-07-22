import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchRoleAndGetRedirect } from '../lib/authRedirects';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login?error=auth_failed');
          return;
        }

        if (session?.user) {
          // Fetch role and redirect
          const redirectPath = await fetchRoleAndGetRedirect(session.user.id);
          navigate(redirectPath, { replace: true });
        } else {
          navigate('/login?error=no_session');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <p>Completing sign in...</p>
    </div>
  );
}

export default AuthCallback;

