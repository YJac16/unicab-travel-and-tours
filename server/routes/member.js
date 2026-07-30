// Member API — bookings, subscriptions, invoices, profile
const express = require('express');
const router = express.Router();
const { requireAuth, requireMember } = require('./middleware/auth');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');

router.use(requireAuth);
router.use(requireMember);

const requireSupabase = (res) => {
  if (!isSupabaseConfigured()) {
    res.status(501).json({ success: false, error: 'Supabase not configured' });
    return false;
  }
  return true;
};

const BOOKING_SELECT = `
  *,
  tour:tours(*),
  driver:drivers(id, name, email, phone, user_id),
  vehicle:vehicles(id, label, type, status)
`;

// GET /api/member/bookings
router.get('/bookings', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabase = getSupabaseAdmin();
    const userId = req.user.id || req.user.userId;
    const email = (req.user.email || '').toLowerCase();

    let query = supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .order('booking_date', { ascending: false });

    if (userId && email) {
      query = query.or(`user_id.eq.${userId},customer_email.ilike.${email}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.ilike('customer_email', email);
    } else {
      return res.json({ success: true, data: [] });
    }

    const { data, error } = await query;
    if (error) throw error;

    // Attach driver profile avatar when linked
    const bookings = data || [];
    const driverUserIds = [...new Set(bookings.map((b) => b.driver?.user_id).filter(Boolean))];
    let profilesById = {};
    if (driverUserIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', driverUserIds);
      (profiles || []).forEach((p) => {
        profilesById[p.id] = p;
      });
    }

    const enriched = bookings.map((b) => ({
      ...b,
      driver_profile: b.driver?.user_id ? profilesById[b.driver.user_id] || null : null,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching member bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings', message: error.message });
  }
});

// GET /api/member/bookings/:id
router.get('/bookings/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabase = getSupabaseAdmin();
    const userId = req.user.id || req.user.userId;
    const email = (req.user.email || '').toLowerCase();

    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Booking not found' });

    const owns =
      (userId && data.user_id === userId) ||
      (email && data.customer_email && data.customer_email.toLowerCase() === email);
    if (!owns) return res.status(403).json({ success: false, error: 'Forbidden' });

    let driver_profile = null;
    if (data.driver?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .eq('id', data.driver.user_id)
        .maybeSingle();
      driver_profile = profile;
    }

    let location = null;
    if (['en_route_pickup', 'on_tour'].includes(data.trip_status)) {
      const { data: loc } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('booking_id', data.id)
        .maybeSingle();
      location = loc;
    }

    res.json({ success: true, data: { ...data, driver_profile, location } });
  } catch (error) {
    console.error('Error fetching member booking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking', message: error.message });
  }
});

// GET /api/member/subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabase = getSupabaseAdmin();
    const userId = req.user.id || req.user.userId;

    // Expire-on-read: prepaid month ended → past_due
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString());

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subscriptions', message: error.message });
  }
});

// POST /api/member/subscriptions — activate tier (after client payment or request)
router.post('/subscriptions', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabase = getSupabaseAdmin();
    const userId = req.user.id || req.user.userId;
    const { tier, payment_reference, yoco_checkout_id } = req.body || {};

    if (!['explorer', 'frequent', 'elite'].includes(tier)) {
      return res.status(400).json({ success: false, error: 'Invalid tier' });
    }

    // Cancel existing active
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        payment_reference: payment_reference || null,
        yoco_checkout_id: yoco_checkout_id || null,
      })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to create subscription', message: error.message });
  }
});

// POST /api/member/subscriptions/:id/cancel
router.post('/subscriptions/:id/cancel', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabase = getSupabaseAdmin();
    const userId = req.user.id || req.user.userId;

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Subscription not found' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription', message: error.message });
  }
});

// GET /api/member/invoices
router.get('/invoices', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabase = getSupabaseAdmin();
    const userId = req.user.id || req.user.userId;
    const email = (req.user.email || '').toLowerCase();

    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (userId && email) {
      query = query.or(`user_id.eq.${userId},customer_email.ilike.${email}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices', message: error.message });
  }
});

// PATCH /api/member/profile
router.patch('/profile', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabase = getSupabaseAdmin();
    const userId = req.user.id || req.user.userId;
    const { full_name, avatar_url, phone } = req.body || {};

    const updates = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    // phone may live on profiles if column exists — ignore if not
    if (phone !== undefined) updates.phone = phone;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      // Retry without phone if column missing
      if (String(error.message || '').includes('phone')) {
        delete updates.phone;
        const retry = await supabase.from('profiles').update(updates).eq('id', userId).select('*').maybeSingle();
        if (retry.error) throw retry.error;
        return res.json({ success: true, data: retry.data });
      }
      throw error;
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile', message: error.message });
  }
});

module.exports = router;
