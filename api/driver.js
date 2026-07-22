// Driver API Routes
// Protected by DRIVER role
// Drivers can only see their own data

const express = require('express');
const router = express.Router();
const { requireAuth, requireDriver } = require('./middleware/auth');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../lib/supabaseAdmin');

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireDriver);

const BOOKING_SELECT = `
  *,
  tour:tours(*),
  customer:profiles!bookings_user_id_fkey(id, email, full_name)
`;

// GET /api/driver/bookings
router.get('/bookings', async (req, res) => {
  try {
    const driverId = req.user.driverId;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: 'Driver profile not linked to user account'
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(501).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('driver_id', driverId)
      .eq('status', 'confirmed')
      .gte('booking_date', today)
      .order('booking_date', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

// GET /api/driver/unavailability
router.get('/unavailability', async (req, res) => {
  try {
    const driverId = req.user.driverId;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: 'Driver profile not linked to user account'
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(501).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('driver_availability')
      .select('id, driver_id, date, available, reason, created_at, updated_at')
      .eq('driver_id', driverId)
      .eq('available', false)
      .gte('date', today)
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching unavailability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unavailability',
      message: error.message
    });
  }
});

// POST /api/driver/unavailability
router.post('/unavailability', async (req, res) => {
  try {
    const driverId = req.user.driverId;
    const { date, reason } = req.body;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: 'Driver profile not linked to user account'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Cannot block dates in the past'
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(501).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: confirmedBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('driver_id', driverId)
      .eq('booking_date', date)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (bookingError) {
      throw bookingError;
    }

    if (confirmedBooking) {
      return res.status(409).json({
        success: false,
        error: 'Cannot block date with confirmed booking'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('driver_availability')
      .upsert({
        driver_id: driverId,
        date,
        available: false,
        reason: reason?.trim() || null
      }, {
        onConflict: 'driver_id,date'
      })
      .select('id, driver_id, date, available, reason, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Date blocked successfully'
    });
  } catch (error) {
    console.error('Error blocking date:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Date is already blocked'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to block date',
      message: error.message
    });
  }
});

// DELETE /api/driver/unavailability/:date
router.delete('/unavailability/:date', async (req, res) => {
  try {
    const driverId = req.user.driverId;
    const { date } = req.params;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: 'Driver profile not linked to user account'
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(501).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('driver_availability')
      .delete()
      .eq('driver_id', driverId)
      .eq('date', date)
      .eq('available', false)
      .select('id');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Blocked date not found'
      });
    }

    res.json({
      success: true,
      message: 'Blocked date removed successfully'
    });
  } catch (error) {
    console.error('Error removing blocked date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove blocked date',
      message: error.message
    });
  }
});

module.exports = router;
