// Authentication Middleware
// Supports both JWT and Supabase Auth tokens

const jwt = require('jsonwebtoken');

// JWT Secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extract token from Authorization header
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');

const attachDriverId = async (userInfo) => {
  if (!userInfo || userInfo.role !== 'driver') {
    return userInfo;
  }

  if (userInfo.driverId) {
    return userInfo;
  }

  if (!isSupabaseConfigured()) {
    return userInfo;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: driver, error } = await supabaseAdmin
      .from('drivers')
      .select('id')
      .eq('user_id', userInfo.id)
      .maybeSingle();

    if (error) {
      console.warn('Could not resolve driver profile:', error.message);
      return userInfo;
    }

    if (driver?.id) {
      userInfo.driverId = driver.id;
    }
  } catch (error) {
    console.warn('Driver lookup failed:', error.message);
  }

  return userInfo;
};

// Verify Supabase token and get user info
const verifySupabaseToken = async (token) => {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify the token and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Get user role from profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    // If profile doesn't exist, default to customer role
    const role = profile?.role?.toLowerCase() || 'customer';

    return {
      id: user.id,
      email: user.email,
      role,
      name: profile?.full_name || user.user_metadata?.full_name || null
    };
  } catch (error) {
    console.error('Supabase token verification error:', error);
    return null;
  }
};

// Middleware: Require authentication
const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Try JWT token first (legacy support)
    let decoded = verifyToken(token);
    let userInfo = null;

    if (decoded) {
      // JWT token - legacy format
      userInfo = {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role?.toLowerCase() || 'customer',
        driverId: decoded.driverId || decoded.guideId || null
      };
    } else {
      // Try Supabase token
      userInfo = await verifySupabaseToken(token);
    }

    if (!userInfo) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    userInfo = await attachDriverId(userInfo);

    // Attach user info to request
    req.user = userInfo;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: error.message
    });
  }
};

// Middleware: Require ADMIN role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Support both uppercase and lowercase role names
  const role = req.user.role?.toLowerCase();
  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'This endpoint requires admin role'
    });
  }

  next();
};

// Middleware: Require DRIVER role
const requireDriver = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Support both uppercase and lowercase role names
  const role = req.user.role?.toLowerCase();
  if (role !== 'driver') {
    return res.status(403).json({
      success: false,
      error: 'Driver access required',
      message: 'This endpoint requires driver role'
    });
  }

  next();
};

// Middleware: Require MEMBER role
const requireMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Support both uppercase and lowercase role names
  const role = req.user.role?.toLowerCase();
  if (role !== 'member' && role !== 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Member access required',
      message: 'This endpoint requires member or customer role'
    });
  }

  next();
};

// Helper: Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name || null,
    role: user.role,
    guideId: user.guide_id || null
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireDriver,
  requireMember,
  generateToken,
  JWT_SECRET
};

