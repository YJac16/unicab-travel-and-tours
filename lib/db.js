// Database connection module
// Supports both Supabase (via service role) and direct PostgreSQL connection

const { createClient } = require('@supabase/supabase-js');
const { normalizeSupabaseUrl } = require('./supabaseAdmin');

// Try Supabase first (if configured)
const supabaseUrl = normalizeSupabaseUrl(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
);
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

let supabase = null;
let dbType = 'none';

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    dbType = 'supabase';
    console.log('✅ Database: Using Supabase (service role)');
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }
}

// Direct PostgreSQL connection (alternative)
// Uncomment and configure if using direct PostgreSQL instead of Supabase
/*
const { Pool } = require('pg');
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  dbType = 'postgres';
  console.log('✅ Database: Using PostgreSQL (direct connection)');
}
*/

// Query helper function
const query = async (sql, params = []) => {
  if (dbType === 'supabase' && supabase) {
    // For Supabase, we need to use RPC or direct SQL
    // Note: Supabase service role can execute raw SQL via REST API
    // For now, we'll use the Supabase client methods
    
    // If it's a SELECT query, parse and use .from()
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      // This is a simplified approach - in production, use proper Supabase queries
      // For now, we'll need to adapt queries to Supabase's query builder
      throw new Error('Use Supabase client methods instead of raw SQL');
    }
    
    // For INSERT/UPDATE/DELETE, use Supabase client
    throw new Error('Use Supabase client methods instead of raw SQL');
  }
  
  // For direct PostgreSQL
  /*
  if (dbType === 'postgres' && pool) {
    const result = await pool.query(sql, params);
    return result;
  }
  */
  
  throw new Error('Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL');
};

// Get user by email (Supabase)
const getUserByEmail = async (email) => {
  if (dbType === 'supabase' && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }
    
    return data ? { rows: [data] } : { rows: [] };
  }
  
  throw new Error('Database not configured');
};

// Create user (Supabase)
const createUser = async (userData) => {
  if (dbType === 'supabase' && supabase) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { rows: [data] };
  }
  
  throw new Error('Database not configured');
};

// Check if user exists (Supabase)
const userExists = async (email) => {
  if (dbType === 'supabase' && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    return !error && data !== null;
  }
  
  throw new Error('Database not configured');
};

// Create guide (Supabase)
const createGuide = async (guideData) => {
  if (dbType === 'supabase' && supabase) {
    const { data, error } = await supabase
      .from('guides')
      .insert(guideData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { rows: [data] };
  }
  
  throw new Error('Database not configured');
};

// Get all guides with users (Supabase)
const getGuidesWithUsers = async () => {
  if (dbType === 'supabase' && supabase) {
    const { data, error } = await supabase
      .from('guides')
      .select(`
        *,
        users (
          id,
          email,
          name,
          role,
          active
        )
      `)
      .order('name', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Transform data to match expected format
    const transformed = (data || []).map(guide => ({
      id: guide.id,
      name: guide.name,
      email: guide.email,
      active: guide.active,
      user_id: guide.users?.[0]?.id || null,
      user_email: guide.users?.[0]?.email || null,
      user_active: guide.users?.[0]?.active || false
    }));
    
    return { rows: transformed };
  }
  
  throw new Error('Database not configured');
};

// Check if guide exists by email (Supabase)
const guideExists = async (email) => {
  if (dbType === 'supabase' && supabase) {
    const { data, error } = await supabase
      .from('guides')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    return !error && data !== null;
  }
  
  throw new Error('Database not configured');
};

module.exports = {
  query,
  getUserByEmail,
  createUser,
  userExists,
  createGuide,
  getGuidesWithUsers,
  guideExists,
  dbType,
  supabase,
  isConfigured: () => dbType !== 'none'
};








