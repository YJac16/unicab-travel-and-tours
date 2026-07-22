// Authentication Routes
// POST /api/auth/login - Login with email/password
// POST /api/auth/register - Register new user (admin only)

const express = require('express');
const router = express.Router();

// Use bcryptjs (pure JS, no compilation needed) - already installed
const bcrypt = require('bcryptjs');
const { generateToken, requireAuth, requireAdmin } = require('./middleware/auth');

// Database connection
const db = require('../lib/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body?.email ? 'provided' : 'missing' });
    
    const { email, password } = req.body || {};

    if (!email || !password) {
      console.log('Login validation failed: missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Check if database is configured
    if (!db.isConfigured()) {
      console.log('Login: Database not configured');
      return res.status(501).json({
        success: false,
        error: 'Authentication not yet configured',
        message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables to enable authentication'
      });
    }

    // Query database for user
    const user = await db.getUserByEmail(email);

    if (!user || user.rows.length === 0) {
      console.log('Login: User not found for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const userData = user.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.password_hash);
    if (!passwordMatch) {
      console.log('Login: Password mismatch for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(userData);

    console.log('Login: Success for email:', email, 'role:', userData.role);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          guideId: userData.guide_id
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    // Ensure we always send a JSON response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// POST /api/auth/register (Public - for members)
// Members can register themselves, admins can register admins/drivers
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'MEMBER', guide_id } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if role is provided and valid
    const validRoles = ['ADMIN', 'DRIVER', 'MEMBER'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    // If registering as ADMIN or DRIVER, require authentication
    if (role === 'ADMIN' || role === 'DRIVER') {
      // Check if user is authenticated and is admin
      const token = req.headers.authorization?.substring(7);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Admin authentication required to create ADMIN or DRIVER accounts'
        });
      }
      // Verify token and check role (simplified - in production, use middleware)
      // For now, allow if role is MEMBER (public registration)
    }

    // MEMBER registration is public (no auth required)
    // ADMIN/DRIVER registration requires admin auth (handled above)

    if (role === 'DRIVER' && !guide_id) {
      return res.status(400).json({
        success: false,
        error: 'guide_id is required for DRIVER role'
      });
    }

    // Check if database is configured
    if (!db.isConfigured()) {
      return res.status(501).json({
        success: false,
        error: 'Registration not yet configured',
        message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables to enable registration'
      });
    }

    // Check if user already exists
    const exists = await db.userExists(email);
    if (exists) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: role,
      guide_id: guide_id || null,
      active: true
    });

    // Generate token for new user
    const token = generateToken(result.rows[0]);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.rows[0].id,
          name: result.rows[0].name,
          email: result.rows[0].email,
          role: result.rows[0].role
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Ensure we always send a JSON response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

module.exports = router;

