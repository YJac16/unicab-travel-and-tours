// Bookings API — custom Supabase booking system only
const express = require('express');
const router = express.Router();
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Resolve public tour slug or UUID to the tours.id UUID used by bookings.tour_id */
async function resolveTourUuid(supabaseAdmin, tourId) {
  if (!tourId) return null;
  const raw = String(tourId).trim();
  if (UUID_RE.test(raw)) {
    const { data } = await supabaseAdmin
      .from('tours')
      .select('id')
      .eq('id', raw)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  const { data: bySlug } = await supabaseAdmin
    .from('tours')
    .select('id')
    .eq('slug', raw)
    .maybeSingle();
  return bySlug?.id || null;
}

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
          'Set SUPABASE_URL to https://YOUR_PROJECT.supabase.co (no /rest/v1) and SUPABASE_SERVICE_ROLE_KEY on Vercel, then redeploy.'
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
      status,
      time_slot,
      package_id,
    } = req.body;

    const finalDriverId = driver_id || guide_id || null;
    const errors = [];

    const resolvedSlot = (() => {
      const raw = String(time_slot || '').toLowerCase();
      if (['morning', 'afternoon', 'full_day'].includes(raw)) return raw;
      if (booking_time && /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(booking_time)) {
        const hour = Number(booking_time.split(':')[0]);
        return hour < 12 ? 'morning' : 'afternoon';
      }
      return 'full_day';
    })();

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

    // Public API exposes tour slugs as `id`; bookings.tour_id is a UUID FK
    const resolvedTourId = await resolveTourUuid(supabaseAdmin, tour_id);
    if (!resolvedTourId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tour_id',
        message: 'Tour not found. Use a valid tour id or slug.',
      });
    }

    if (finalDriverId) {
      const { data: existingBookings } = await supabaseAdmin
        .from('bookings')
        .select('id, time_slot, booking_time')
        .eq('driver_id', finalDriverId)
        .eq('booking_date', booking_date)
        .in('status', ['reserved', 'pending', 'confirmed']);

      const conflicts = (existingBookings || []).filter((b) => {
        const otherSlot =
          b.time_slot ||
          (b.booking_time && Number(String(b.booking_time).split(':')[0]) < 12
            ? 'morning'
            : b.booking_time
              ? 'afternoon'
              : 'full_day');
        if (resolvedSlot === 'full_day' || otherSlot === 'full_day') return true;
        return otherSlot === resolvedSlot;
      });

      if (conflicts.length) {
        return res.status(409).json({
          success: false,
          error:
            resolvedSlot === 'full_day'
              ? 'This driver/vehicle is already booked on this date'
              : `This driver is already booked for the ${resolvedSlot} slot on this date`,
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
        .eq('id', resolvedTourId)
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

    const {
      pickup_address,
      pickup_lat,
      pickup_lng,
    } = req.body || {};

    const insertPayload = {
      tour_id: resolvedTourId,
      driver_id: finalDriverId,
      user_id: userId,
      booking_date,
      booking_time: booking_time || null,
      time_slot: resolvedSlot,
      package_id: package_id || null,
      group_size: Number(group_size),
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      customer_phone: customer_phone?.trim() || null,
      special_requests: special_requests?.trim() || null,
      price_per_person: Number(price_per_person) || 0,
      total_price: Number(total_price) || 0,
      status: bookingStatus,
      payment_status: 'unpaid',
      pickup_address: pickup_address?.trim() || null,
      pickup_lat: pickup_lat != null && pickup_lat !== '' ? Number(pickup_lat) : null,
      pickup_lng: pickup_lng != null && pickup_lng !== '' ? Number(pickup_lng) : null,
      trip_status: finalDriverId ? 'assigned' : null,
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

/**
 * Cancellation refund policy (aligned with CancellationPolicy page):
 * >= 48h before booking_date → full refund eligible
 * 24–48h → 50%
 * < 24h → no automatic refund
 */
function refundFractionForDate(bookingDate) {
  if (!bookingDate) return 0;
  const start = new Date(`${bookingDate}T00:00:00`);
  const hours = (start.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hours >= 48) return 1;
  if (hours >= 24) return 0.5;
  return 0;
}

// POST /api/bookings/:id/cancel — member (auth) or guest (email match)
router.post('/:id/cancel', optionalAuth, async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(501).json({ success: false, error: 'Supabase not configured' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { reason, email, request_refund } = req.body || {};
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: `Booking is already ${booking.status}`,
      });
    }

    const userId = req.user?.id;
    const userEmail = (req.user?.email || email || '').toLowerCase().trim();
    const owns =
      (userId && booking.user_id === userId) ||
      (userEmail &&
        booking.customer_email &&
        booking.customer_email.toLowerCase() === userEmail);

    if (!owns) {
      return res.status(403).json({
        success: false,
        error: 'Provide the booking email or sign in as the booking owner',
      });
    }

    const fraction = request_refund === false ? 0 : refundFractionForDate(booking.booking_date);
    let refunded = false;
    let refundNote = null;

    if (
      request_refund !== false &&
      fraction > 0 &&
      booking.payment_status === 'paid' &&
      (booking.yoco_checkout_id || booking.payment_reference)
    ) {
      try {
        const { refundCheckout } = require('../../lib/yocoApi');
        const amountCents = Math.round(Number(booking.total_price || 0) * 100 * fraction);
        await refundCheckout(booking.yoco_checkout_id || booking.payment_reference, {
          amount: amountCents > 0 ? amountCents : undefined,
        });
        refunded = true;
        refundNote = fraction === 1 ? 'full' : 'partial_50';
      } catch (refundErr) {
        console.warn('Auto-refund failed:', refundErr.message);
        refundNote = `refund_failed: ${refundErr.message}`;
      }
    } else if (booking.payment_status === 'paid' && fraction === 0) {
      refundNote = 'outside_refund_window';
    }

    const updates = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason || 'guest_cancel',
      updated_at: new Date().toISOString(),
    };
    if (refunded) updates.payment_status = 'refunded';

    const { data: updated, error: upErr } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', booking.id)
      .select('*')
      .maybeSingle();
    if (upErr) throw upErr;

    try {
      const { sendOpsNotificationEmail } = require('../../lib/bookingEmail');
      await sendOpsNotificationEmail({
        subject: `Cancelled booking ${booking.id}`,
        text: `Booking ${booking.id} cancelled by guest. Refund: ${refundNote || 'none'}`,
      });
    } catch {
      // ignore
    }

    return res.json({
      success: true,
      data: {
        ...updated,
        refund: { attempted: !!refundNote, refunded, note: refundNote, fraction },
      },
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      message: error.message,
    });
  }
});

module.exports = router;
