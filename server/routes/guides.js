// Guides / drivers availability API
const express = require('express');
const router = express.Router();
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');

router.get('/available', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required (format: YYYY-MM-DD)',
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Date cannot be in the past',
      });
    }

    if (!isSupabaseConfigured()) {
      return res.json({ success: true, data: [], date, source: 'unconfigured' });
    }

    const admin = getSupabaseAdmin();

    // Prefer RPC if present
    const rpc = await admin.rpc('get_available_drivers_for_date', { p_date: date });
    if (!rpc.error && Array.isArray(rpc.data)) {
      return res.json({
        success: true,
        data: rpc.data.map((d) => ({
          guide_id: d.id || d.guide_id || d.driver_id,
          guide_name: d.name || d.guide_name,
          guide_email: d.email || d.guide_email,
          ...d,
        })),
        date,
        source: 'rpc',
      });
    }

    const { data: drivers, error: driversError } = await admin
      .from('drivers')
      .select('id, name, email, phone, active, user_id')
      .eq('active', true);
    if (driversError) throw driversError;

    const { data: blocked } = await admin
      .from('driver_unavailability')
      .select('driver_id')
      .eq('date', date);

    const blockedIds = new Set((blocked || []).map((b) => b.driver_id));

    const { data: booked } = await admin
      .from('bookings')
      .select('driver_id')
      .eq('booking_date', date)
      .in('status', ['confirmed', 'reserved']);

    const bookedIds = new Set((booked || []).map((b) => b.driver_id).filter(Boolean));

    const available = (drivers || [])
      .filter((d) => !blockedIds.has(d.id) && !bookedIds.has(d.id))
      .map((d) => ({
        guide_id: d.id,
        guide_name: d.name,
        guide_email: d.email,
        phone: d.phone,
      }));

    return res.json({
      success: true,
      data: available,
      date,
      source: 'query',
    });
  } catch (error) {
    console.error('Error fetching available guides:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch available guides',
      message: error.message,
    });
  }
});

module.exports = router;
