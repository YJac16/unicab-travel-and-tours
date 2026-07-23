// Driver API Routes
// Protected by DRIVER role
// Drivers can only see their own data

const express = require('express');
const router = express.Router();
const { requireAuth, requireDriver } = require('./middleware/auth');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');

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
      .in('status', ['confirmed', 'pending', 'reserved', 'completed'])
      .order('booking_date', { ascending: true });

    if (error) {
      throw error;
    }

    // Prefer upcoming / active trips first; still return recent completed
    const rows = data || [];
    const active = rows.filter((b) => b.booking_date >= today && b.status !== 'cancelled');
    const past = rows.filter((b) => b.booking_date < today || b.status === 'completed');

    res.json({
      success: true,
      data: [...active, ...past.filter((b) => !active.includes(b))],
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

const VALID_TRIP_STATUSES = ['assigned', 'en_route_pickup', 'on_tour', 'completed', 'cancelled'];

const DETAIL_SELECT = `
  *,
  tour:tours(*),
  vehicle:vehicles(id, label, type, status),
  customer:profiles!bookings_user_id_fkey(id, email, full_name, avatar_url)
`;

// GET /api/driver/bookings/:id
router.get('/bookings/:id', async (req, res) => {
  try {
    const driverId = req.user.driverId;
    if (!driverId) {
      return res.status(400).json({ success: false, error: 'Driver profile not linked' });
    }
    if (!isSupabaseConfigured()) {
      return res.status(501).json({ success: false, error: 'Supabase not configured' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(DETAIL_SELECT)
      .eq('id', req.params.id)
      .eq('driver_id', driverId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Booking not found' });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching driver booking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking', message: error.message });
  }
});

// PATCH /api/driver/bookings/:id/trip-status
router.patch('/bookings/:id/trip-status', async (req, res) => {
  try {
    const driverId = req.user.driverId;
    const { trip_status } = req.body || {};
    if (!driverId) {
      return res.status(400).json({ success: false, error: 'Driver profile not linked' });
    }
    if (!VALID_TRIP_STATUSES.includes(trip_status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid trip_status. Must be one of: ${VALID_TRIP_STATUSES.join(', ')}`,
      });
    }
    if (!isSupabaseConfigured()) {
      return res.status(501).json({ success: false, error: 'Supabase not configured' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('bookings')
      .select('id, vehicle_id, trip_status, customer_email, customer_name, review_invite_sent_at, tour_id')
      .eq('id', req.params.id)
      .eq('driver_id', driverId)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) return res.status(404).json({ success: false, error: 'Booking not found' });

    const updates = {
      trip_status,
      updated_at: new Date().toISOString(),
    };
    if (trip_status === 'completed') {
      updates.status = 'completed';
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id)
      .eq('driver_id', driverId)
      .select(DETAIL_SELECT)
      .single();

    if (error) throw error;

    // Free vehicle when trip ends
    if ((trip_status === 'completed' || trip_status === 'cancelled') && existing.vehicle_id) {
      await supabaseAdmin
        .from('vehicles')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', existing.vehicle_id)
        .neq('status', 'out');
    }

    if (trip_status === 'completed' && existing.customer_email && !existing.review_invite_sent_at) {
      try {
        let tourName = data?.tour?.name || null;
        if (!tourName && existing.tour_id) {
          const { data: tour } = await supabaseAdmin
            .from('tours')
            .select('name')
            .eq('id', existing.tour_id)
            .maybeSingle();
          tourName = tour?.name || null;
        }
        const { sendReviewInviteEmail } = require('../../lib/bookingEmail');
        await sendReviewInviteEmail({
          to: existing.customer_email,
          guestName: existing.customer_name,
          bookingId: existing.id,
          tourName,
        });
        await supabaseAdmin
          .from('bookings')
          .update({ review_invite_sent_at: new Date().toISOString() })
          .eq('id', existing.id);
      } catch (inviteErr) {
        console.warn('Review invite email skipped:', inviteErr.message);
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ success: false, error: 'Failed to update trip status', message: error.message });
  }
});

// POST /api/driver/bookings/:id/location — live GPS upsert
router.post('/bookings/:id/location', async (req, res) => {
  try {
    const driverId = req.user.driverId;
    const { lat, lng, heading } = req.body || {};
    if (!driverId) {
      return res.status(400).json({ success: false, error: 'Driver profile not linked' });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ success: false, error: 'lat and lng numbers are required' });
    }
    if (!isSupabaseConfigured()) {
      return res.status(501).json({ success: false, error: 'Supabase not configured' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: booking, error: findErr } = await supabaseAdmin
      .from('bookings')
      .select('id, trip_status')
      .eq('id', req.params.id)
      .eq('driver_id', driverId)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (!['en_route_pickup', 'on_tour'].includes(booking.trip_status)) {
      return res.status(400).json({
        success: false,
        error: 'Tracking only allowed while en_route_pickup or on_tour',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('driver_locations')
      .upsert(
        {
          booking_id: booking.id,
          driver_id: driverId,
          lat,
          lng,
          heading: typeof heading === 'number' ? heading : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'booking_id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error upserting location:', error);
    res.status(500).json({ success: false, error: 'Failed to update location', message: error.message });
  }
});

module.exports = router;
