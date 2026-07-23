// Guides API Routes
// GET /api/guides/available?date=YYYY-MM-DD - Get available guides for a date

const express = require('express');
const router = express.Router();

// GET available guides for a specific date
router.get('/available', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required (format: YYYY-MM-DD)'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Validate date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Date cannot be in the past'
      });
    }

    // TODO: Replace with actual database query
    // Use the unavailability-based model:
    // A driver is available if:
    // 1. Driver is active
    // 2. No unavailability record exists for that date
    // 3. No CONFIRMED booking exists for that date
    // 
    // Example query:
    // const { data, error } = await db.query(
    //   `SELECT 
    //      d.id as guide_id,
    //      d.name as guide_name,
    //      d.email as guide_email
    //    FROM drivers d
    //    WHERE d.active = true
    //      AND NOT EXISTS (
    //        SELECT 1 FROM driver_unavailability du
    //        WHERE du.driver_id = d.id AND du.date = $1
    //      )
    //      AND NOT EXISTS (
    //        SELECT 1 FROM bookings b
    //        WHERE b.driver_id = d.id 
    //          AND b.date = $1 
    //          AND b.status = 'confirmed'
    //      )
    //    ORDER BY d.name`,
    //   [date]
    // );
    // 
    // Or use the function:
    // const { rows } = await db.query(
    //   'SELECT * FROM get_available_drivers_for_date($1)',
    //   [date]
    // );

    // For now, return placeholder
    res.json({
      success: true,
      data: [],
      date: date,
      message: 'Available guides endpoint - connect to database to fetch guides'
    });
  } catch (error) {
    console.error('Error fetching available guides:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available guides',
      message: error.message
    });
  }
});

module.exports = router;







