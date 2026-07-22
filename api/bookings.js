// Bookings API — custom Supabase booking system only
const express = require('express');
const router = express.Router();
const { getSupabaseAdmin, isSupabaseConfigured } = require('../lib/supabaseAdmin');

const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.substring(7);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    if (isSupabaseConfigured()) {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        req.user = {
          id: user.id,
          email: user.email,
          role: profile?.role?.toLowerCase() || 'customer'
        };
        return next();
      }
    }
  } catch (error) {
    console.warn('Token verification failed:', error.message);
  }

  // Legacy JWT fallback
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role?.toLowerCase() || 'customer'
    };
  } catch {
    req.user = null;
  }

  next();
};

const parseDurationHours = (durationText) => {
  if (!durationText) return null;
  const rangeMatch = durationText.match(/(\d+\.?\d*)\s*-?\s*(\d+\.?\d*)\s*hours?/i);
  if (rangeMatch) {
    return (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
  }
  const singleMatch = durationText.match(/(\d+\.?\d*)\s*hours?/i);
  if (singleMatch) return parseFloat(singleMatch[1]);
  if (durationText.toLowerCase().includes('full day')) return 8.0;
  if (durationText.toLowerCase().includes('half day')) return 4.0;
  return null;
};

// POST /api/bookings — create booking in Supabase
router.post('/', optionalAuth, async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(501).json({
        success: false,
        error: 'Supabase not configured',
        message:
          'Set SUPABASE_URL to https://YOUR_PROJECT.supabase.co (no /rest/v1) and SUPABASE_SERVICE_ROLE_KEY on Railway, then redeploy.'
      });
    }

    const {
      tour_id,
      guide_id,
      driver_id,
      booking_date,
      booking_time,
      group_size,
      customer_name,
      customer_email,
      customer_phone,
      special_requests,
      price_per_person,
      total_price,
      status
    } = req.body;

    const finalDriverId = driver_id || guide_id || null;
    const errors = [];

    if (!tour_id) errors.push('tour_id is required');
    if (!booking_date) errors.push('booking_date is required (YYYY-MM-DD)');
    if (!group_size || group_size < 1) errors.push('group_size must be at least 1');
    if (!customer_name || customer_name.trim().length < 2) {
      errors.push('customer_name is required (min 2 characters)');
    }
    if (!customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      errors.push('valid customer_email is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const selectedDate = new Date(`${booking_date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Booking date cannot be in the past'
      });
    }

    // Minimum advance booking: same-day allowed until 06:00 cutoff for next-day? Keep same-day OK for now.
    // Enforce one paid/confirmed booking per driver per day when driver assigned
    const supabaseAdmin = getSupabaseAdmin();

    if (finalDriverId) {
      const { data: conflict } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('driver_id', finalDriverId)
        .eq('booking_date', booking_date)
        .in('status', ['reserved', 'pending', 'confirmed'])
        .limit(1)
        .maybeSingle();

      if (conflict) {
        return res.status(409).json({
          success: false,
          error: 'This driver/vehicle is already booked on this date'
        });
      }

      const { data: blocked } = await supabaseAdmin
        .from('driver_availability')
        .select('id')
        .eq('driver_id', finalDriverId)
        .eq('date', booking_date)
        .eq('available', false)
        .maybeSingle();

      if (blocked) {
        return res.status(409).json({
          success: false,
          error: 'Driver is unavailable on this date'
        });
      }
    }

    if (booking_time) {
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(booking_time)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time format. Use HH:MM (24-hour format)'
        });
      }

      const { data: tourData } = await supabaseAdmin
        .from('tours')
        .select('duration_hours, duration')
        .eq('id', tour_id)
        .maybeSingle();

      if (tourData) {
        const durationHours = tourData.duration_hours || parseDurationHours(tourData.duration) || 8;
        const [hours, minutes] = booking_time.split(':').map(Number);
        const startDateTime = new Date(booking_date);
        startDateTime.setHours(hours, minutes || 0, 0, 0);
        const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);
        const cutoffTime = new Date(booking_date);
        cutoffTime.setHours(20, 0, 0, 0);

        if (endDateTime > cutoffTime) {
          return res.status(400).json({
            success: false,
            error: 'This tour would end after our 8:00 PM cutoff. Please select an earlier start time.'
          });
        }
      }
    }

    const userRole = req.user?.role?.toLowerCase();
    const userId =
      req.user && (userRole === 'member' || userRole === 'customer' || userRole === 'admin')
        ? req.user.id
        : null;

    const bookingStatus =
      status && ['reserved', 'pending', 'confirmed'].includes(String(status).toLowerCase())
        ? String(status).toLowerCase()
        : 'reserved';

    const insertPayload = {
      tour_id,
      driver_id: finalDriverId,
      user_id: userId,
      booking_date,
      booking_time: booking_time || null,
      group_size: Number(group_size),
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      customer_phone: customer_phone?.trim() || null,
      special_requests: special_requests?.trim() || null,
      price_per_person: Number(price_per_person) || 0,
      total_price: Number(total_price) || 0,
      status: bookingStatus,
      payment_status: 'unpaid'
    };

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'This vehicle is already booked on this date'
        });
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: booking,
      message:
        bookingStatus === 'reserved'
          ? 'Reservation created. Complete payment to confirm.'
          : 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

// GET /api/bookings/:id — public confirmation lookup by id + email optional
router.get('/:id', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(501).json({ success: false, error: 'Supabase not configured' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        tour:tours(id, name, duration),
        driver:drivers(id, name, phone)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

module.exports = router;
