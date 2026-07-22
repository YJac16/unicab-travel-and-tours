/**
 * Utility functions for role-based redirects after authentication
 */

/**
 * Get the redirect path based on user role
 * @param {string} role - User role (admin, driver, customer, member)
 * @returns {string} Redirect path
 */
export const getRedirectPath = (role) => {
  if (!role) return '/';
  
  const normalizedRole = role.toLowerCase();
  
  if (normalizedRole === 'admin') {
    return '/admin'; // /admin route shows AdminDashboard
  } else if (normalizedRole === 'driver') {
    return '/driver/dashboard'; // Driver dashboard route
  } else if (normalizedRole === 'member' || normalizedRole === 'customer') {
    // For customers, use /member/dashboard or home (/)
    // Change to '/' if you prefer home page for customers
    return '/member/dashboard';
  }
  
  // Default to home
  return '/';
};

/**
 * Fetch user role from database and return redirect path
 * @param {string} userId - User ID from Supabase auth
 * @returns {Promise<string>} Redirect path
 */
export const fetchRoleAndGetRedirect = async (userId) => {
  const { supabase } = await import('./supabase');
  
  let role = 'customer';
  
  try {
    // Try profiles table first
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profileError && profileData?.role) {
      role = profileData.role.toLowerCase();
    } else {
      // Fallback to user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!roleError && roleData?.role) {
        role = roleData.role.toLowerCase();
      }
    }
  } catch (error) {
    console.error('Error fetching role for redirect:', error);
    // Default to customer/home
    role = 'customer';
  }

  return getRedirectPath(role);
};

