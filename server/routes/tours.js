// Tours API Routes
// GET /api/tours - Get all active tours

const express = require('express');
const router = express.Router();

// For now, we'll use a simple in-memory store or connect to database later
// This will be replaced with actual database queries when Supabase/PostgreSQL is configured

router.get('/', async (req, res) => {
  try {
    // TODO: Replace with actual database query
    // const { data, error } = await supabase.from('tours').select('*').eq('active', true);
    
    // For now, return a placeholder response
    // In production, this should query the database
    res.json({
      success: true,
      data: [],
      message: 'Tours endpoint - connect to database to fetch tours'
    });
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tours',
      message: error.message
    });
  }
});

module.exports = router;







