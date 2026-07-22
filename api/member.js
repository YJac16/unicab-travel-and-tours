// Member API Routes
// Protected by MEMBER role
// Members can only see their own data

const express = require('express');
const router = express.Router();
const { requireAuth, requireMember } = require('./middleware/auth');

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireMember);

// GET /api/member/bookings
// Return bookings for the authenticated member
router.get('/bookings', async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Query database for member bookings
    // Members can only see bookings linked to their user_id
    // const { rows } = await db.query(
    //   `SELECT 
    //      b.*,
    //      t.name as tour_name,
    //      t.duration,
    //      json_build_object(
    //        'id', d.id,
    //        'name', d.name
    //      ) as driver
    //    FROM bookings b
    //    INNER JOIN tours t ON b.tour_id = t.id
    //    LEFT JOIN drivers d ON b.driver_id = d.id
    //    WHERE b.user_id = $1
    //    ORDER BY b.date ASC, b.created_at DESC`,
    //   [userId]
    // );

    // Placeholder response
    res.json({
      success: true,
      data: [],
      message: 'Member bookings endpoint - connect to database to fetch bookings'
    });
  } catch (error) {
    console.error('Error fetching member bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

module.exports = router;







