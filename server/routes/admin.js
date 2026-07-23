// Admin API Routes
// Protected by ADMIN role
// Admin has full visibility and override authority

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('./middleware/auth');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');

const BOOKING_SELECT = `
  *,
  tour:tours(*),
  driver:drivers(id, name, email, phone, active),
  vehicle:vehicles(id, label, type, status),
  customer:profiles!bookings_user_id_fkey(id, email, full_name)
`;

const VALID_BOOKING_STATUSES = ['reserved', 'pending', 'confirmed', 'completed', 'cancelled'];

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireAdmin);

const requireSupabase = (res) => {
  if (!isSupabaseConfigured()) {
    res.status(501).json({
      success: false,
      error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    });
    return false;
  }
  return true;
};

// GET /api/admin/bookings
router.get('/bookings', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;

    const { status, date_from, date_to, driver_id } = req.query;
    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('bookings')
      .select(BOOKING_SELECT);

    if (status) {
      query = query.eq('status', status);
    }
    if (date_from) {
      query = query.gte('booking_date', date_from);
    }
    if (date_to) {
      query = query.lte('booking_date', date_to);
    }
    if (driver_id) {
      query = query.eq('driver_id', driver_id);
    }

    const { data, error } = await query
      .order('booking_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      filters: { status, date_from, date_to, driver_id }
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

// PATCH /api/admin/bookings/:id
router.patch('/bookings/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    if (!VALID_BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_BOOKING_STATUSES.join(', ')}`
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select(BOOKING_SELECT)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
      message: error.message
    });
  }
});

// GET /api/admin/drivers
router.get('/drivers', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;

    const supabaseAdmin = getSupabaseAdmin();

    const { data: drivers, error: driversError } = await supabaseAdmin
      .from('drivers')
      .select(`
        id,
        user_id,
        name,
        email,
        phone,
        license_number,
        active,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (driversError) {
      throw driversError;
    }

    const driversWithProfiles = await Promise.all(
      (drivers || []).map(async (driver) => {
        if (!driver.user_id) {
          return driver;
        }

        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('role, full_name')
          .eq('id', driver.user_id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn(`Error fetching profile for driver ${driver.id}:`, profileError);
        }

        return {
          ...driver,
          role: profile?.role || null,
          full_name: profile?.full_name || driver.name
        };
      })
    );

    res.json({
      success: true,
      data: driversWithProfiles || []
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers',
      message: error.message
    });
  }
});

// POST /api/admin/drivers
router.post('/drivers', async (req, res) => {
  try {
    const { name, email, phone, license_number, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (!requireSupabase(res)) return;

    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = email.toLowerCase().trim();

    let existingUser = null;
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(normalizedEmail);
      if (!userError && userData?.user) {
        existingUser = userData;
      }
    } catch (error) {
      console.log('User not found, will create new user:', error.message);
    }

    if (existingUser?.user) {
      const userId = existingUser.user.id;

      const { data: existingDriver, error: driverCheckError } = await supabaseAdmin
        .from('drivers')
        .select('id, user_id, name')
        .eq('user_id', userId)
        .maybeSingle();

      if (driverCheckError && driverCheckError.code !== 'PGRST116') {
        console.error('Error checking existing driver:', driverCheckError);
      }

      if (existingDriver) {
        return res.status(409).json({
          success: false,
          error: 'This user is already linked as a driver',
          data: {
            driver_id: existingDriver.id,
            name: existingDriver.name
          }
        });
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      if (profile) {
        if (profile.role !== 'driver') {
          await supabaseAdmin
            .from('profiles')
            .update({ role: 'driver', full_name: name.trim(), email: normalizedEmail })
            .eq('id', userId);
        }
      } else {
        await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            role: 'driver',
            email: normalizedEmail,
            full_name: name.trim()
          });
      }

      const { data: driverData, error: driverError } = await supabaseAdmin
        .from('drivers')
        .insert({
          user_id: userId,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          license_number: license_number?.trim() || null,
          active: true
        })
        .select()
        .single();

      if (driverError) {
        throw driverError;
      }

      return res.status(201).json({
        success: true,
        data: {
          user_id: userId,
          driver_id: driverData.id,
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          license_number: driverData.license_number,
          status: 'active',
          existing_user: true
        },
        message: 'Existing user successfully linked as driver'
      });
    }

    const { data: existingDriverByEmail } = await supabaseAdmin
      .from('drivers')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingDriverByEmail) {
      return res.status(409).json({
        success: false,
        error: 'A driver with this email already exists'
      });
    }

    let authUser;
    let inviteSent = false;

    if (password) {
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name.trim(),
          role: 'driver'
        }
      });

      if (createError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to create auth user',
          message: createError.message
        });
      }

      authUser = userData.user;
    } else {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        normalizedEmail,
        {
          data: {
            full_name: name.trim(),
            role: 'driver'
          }
        }
      );

      if (inviteError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to invite user',
          message: inviteError.message
        });
      }

      authUser = inviteData.user;
      inviteSent = true;
    }

    if (!authUser?.id) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create auth user'
      });
    }

    const userId = authUser.id;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: normalizedEmail,
        role: 'driver',
        full_name: name.trim()
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    const { data: driverData, error: driverError } = await supabaseAdmin
      .from('drivers')
      .insert({
        user_id: userId,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        license_number: license_number?.trim() || null,
        active: true
      })
      .select()
      .single();

    if (driverError) {
      throw driverError;
    }

    res.status(201).json({
      success: true,
      data: {
        user_id: userId,
        driver_id: driverData.id,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        license_number: license_number?.trim() || null,
        invite_sent: inviteSent,
        status: inviteSent ? 'pending_invite' : 'active'
      },
      message: inviteSent
        ? 'Driver invited successfully. They will receive an email to set their password.'
        : 'Driver account created successfully'
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create driver',
      message: error.message
    });
  }
});

// PATCH /api/admin/drivers/:id
router.patch('/drivers/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;

    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'active must be a boolean value'
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .update({ active })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    res.json({
      success: true,
      data,
      message: `Driver ${active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver',
      message: error.message
    });
  }
});

// GET /api/admin/drivers/:id/unavailability
router.get('/drivers/:id/unavailability', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;

    const { id } = req.params;
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('driver_availability')
      .select('id, driver_id, date, available, reason, created_at, updated_at')
      .eq('driver_id', id)
      .eq('available', false)
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      driver_id: id
    });
  } catch (error) {
    console.error('Error fetching driver unavailability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unavailability',
      message: error.message
    });
  }
});

// POST /api/admin/drivers/:id/unavailability
router.post('/drivers/:id/unavailability', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;

    const { id } = req.params;
    const { date, reason } = req.body;

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

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('driver_availability')
      .upsert({
        driver_id: id,
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
    res.status(500).json({
      success: false,
      error: 'Failed to block date',
      message: error.message
    });
  }
});

// DELETE /api/admin/drivers/:id/unavailability/:date
router.delete('/drivers/:id/unavailability/:date', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;

    const { id, date } = req.params;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('driver_availability')
      .delete()
      .eq('driver_id', id)
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
const { buildInvoicePdf } = require('../../lib/invoicePdf');

// =========================
// TOURS CRUD
// =========================
router.get('/tours', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('tours')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tours', message: error.message });
  }
});

router.post('/tours', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const body = req.body || {};
    if (!body.name) return res.status(400).json({ success: false, error: 'name is required' });
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('tours')
      .insert({
        name: body.name,
        slug: body.slug || null,
        description: body.description || null,
        duration: body.duration || null,
        image_url: body.image_url || null,
        price_from: body.price_from || null,
        price_zar: body.price_zar ?? null,
        max_people: body.max_people ?? 22,
        promotion: body.promotion || null,
        highlights: body.highlights || [],
        pricing: body.pricing || null,
        active: body.active !== false,
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({ success: false, error: 'Failed to create tour', message: error.message });
  }
});

router.patch('/tours/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const allowed = [
      'name', 'slug', 'description', 'duration', 'image_url', 'price_from',
      'price_zar', 'max_people', 'promotion', 'highlights', 'pricing', 'active',
    ];
    const updates = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('tours')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Tour not found' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating tour:', error);
    res.status(500).json({ success: false, error: 'Failed to update tour', message: error.message });
  }
});

// =========================
// FLEET / VEHICLES
// =========================
router.get('/vehicles', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    const vehicles = data || [];
    const summary = {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === 'available').length,
      dispatched: vehicles.filter((v) => v.status === 'dispatched').length,
      out: vehicles.filter((v) => v.status === 'out').length,
    };
    res.json({ success: true, data: vehicles, summary });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vehicles', message: error.message });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const { label, type, notes, count } = req.body || {};
    if (!label && !count) {
      return res.status(400).json({ success: false, error: 'label or count is required' });
    }
    const supabaseAdmin = getSupabaseAdmin();
    const n = Math.min(Math.max(Number(count) || 1, 1), 50);
    const rows = Array.from({ length: n }, (_, i) => ({
      label: n > 1 ? `${label || 'Vehicle'} ${i + 1}` : (label || 'Vehicle'),
      type: type || null,
      notes: notes || null,
      status: 'available',
    }));
    const { data, error } = await supabaseAdmin.from('vehicles').insert(rows).select('*');
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating vehicles:', error);
    res.status(500).json({ success: false, error: 'Failed to create vehicles', message: error.message });
  }
});

router.patch('/vehicles/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const { label, type, status, notes } = req.body || {};
    if (status && !['available', 'dispatched', 'out'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const updates = { updated_at: new Date().toISOString() };
    if (label !== undefined) updates.label = label;
    if (type !== undefined) updates.type = type;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Vehicle not found' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ success: false, error: 'Failed to update vehicle', message: error.message });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('vehicles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Vehicle removed' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ success: false, error: 'Failed to delete vehicle', message: error.message });
  }
});

// PATCH dispatch: assign driver + vehicle + trip_status
router.patch('/bookings/:id/dispatch', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const { driver_id, vehicle_id, trip_status } = req.body || {};
    const supabaseAdmin = getSupabaseAdmin();

    const { data: booking, error: findErr } = await supabaseAdmin
      .from('bookings')
      .select('id, vehicle_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    const updates = { updated_at: new Date().toISOString() };
    if (driver_id) updates.driver_id = driver_id;
    if (vehicle_id) updates.vehicle_id = vehicle_id;
    if (trip_status) {
      if (!VALID_TRIP_STATUSES.includes(trip_status)) {
        return res.status(400).json({ success: false, error: 'Invalid trip_status' });
      }
      updates.trip_status = trip_status;
    } else if (driver_id || vehicle_id) {
      updates.trip_status = 'assigned';
    }
    if (driver_id) updates.status = 'confirmed';

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id)
      .select(BOOKING_SELECT)
      .single();
    if (error) throw error;

    // Release previous vehicle if changed
    if (booking.vehicle_id && vehicle_id && booking.vehicle_id !== vehicle_id) {
      await supabaseAdmin
        .from('vehicles')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', booking.vehicle_id)
        .neq('status', 'out');
    }
    if (vehicle_id) {
      await supabaseAdmin
        .from('vehicles')
        .update({ status: 'dispatched', updated_at: new Date().toISOString() })
        .eq('id', vehicle_id);
    }

    try {
      const { sendOpsNotificationEmail } = require('../../lib/bookingEmail');
      await sendOpsNotificationEmail({
        subject: `Dispatched booking ${req.params.id}`,
        text: `Booking ${req.params.id} dispatched. Driver: ${driver_id || 'n/a'}, Vehicle: ${vehicle_id || 'n/a'}, Trip: ${updates.trip_status || 'n/a'}`,
      });
    } catch (mailErr) {
      console.warn('Dispatch notify skipped:', mailErr.message);
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error dispatching booking:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch booking', message: error.message });
  }
});

// =========================
// LIVE TRACKING
// =========================
router.get('/tracking', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, trip_status, booking_date, customer_name, pickup_address, pickup_lat, pickup_lng,
        driver:drivers(id, name, phone),
        tour:tours(name)
      `)
      .in('trip_status', ['en_route_pickup', 'on_tour']);
    if (error) throw error;

    const ids = (bookings || []).map((b) => b.id);
    let locations = [];
    if (ids.length) {
      const { data: locs } = await supabaseAdmin
        .from('driver_locations')
        .select('*')
        .in('booking_id', ids);
      locations = locs || [];
    }
    const byBooking = Object.fromEntries(locations.map((l) => [l.booking_id, l]));
    const data = (bookings || []).map((b) => ({ ...b, location: byBooking[b.id] || null }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tracking', message: error.message });
  }
});

// =========================
// INVOICES
// =========================
router.get('/invoices', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices', message: error.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const {
      booking_id,
      subscription_id,
      user_id,
      customer_name,
      customer_email,
      line_items,
      amount_zar,
      status,
    } = req.body || {};

    const { data: numRow, error: numErr } = await supabaseAdmin.rpc('next_invoice_number');
    if (numErr) throw numErr;
    const number = typeof numRow === 'string' ? numRow : numRow?.next_invoice_number || `INV-${Date.now()}`;

    const items = Array.isArray(line_items) ? line_items : [];
    const amount =
      amount_zar != null
        ? Number(amount_zar)
        : items.reduce((sum, i) => sum + Number(i.amount_zar ?? i.amount ?? 0), 0);

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .insert({
        number,
        booking_id: booking_id || null,
        subscription_id: subscription_id || null,
        user_id: user_id || null,
        customer_name: customer_name || null,
        customer_email: customer_email || null,
        line_items: items,
        amount_zar: amount,
        status: status || 'sent',
      })
      .select('*')
      .single();
    if (error) throw error;

    // Generate PDF and store if storage available
    try {
      const pdf = await buildInvoicePdf(data);
      const path = `invoices/${data.number}.pdf`;
      const { error: upErr } = await supabaseAdmin.storage
        .from('invoices')
        .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
      if (!upErr) {
        const { data: updated } = await supabaseAdmin
          .from('invoices')
          .update({ pdf_path: path, updated_at: new Date().toISOString() })
          .eq('id', data.id)
          .select('*')
          .single();
        return res.status(201).json({ success: true, data: updated || data });
      }
    } catch (pdfErr) {
      console.warn('Invoice PDF skipped:', pdfErr.message);
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to create invoice', message: error.message });
  }
});

router.patch('/invoices/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const { status } = req.body || {};
    if (status && !['draft', 'sent', 'paid'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to update invoice', message: error.message });
  }
});

router.get('/invoices/:id/pdf', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    if (invoice.pdf_path) {
      const { data: file, error: dlErr } = await supabaseAdmin.storage
        .from('invoices')
        .download(invoice.pdf_path);
      if (!dlErr && file) {
        const buf = Buffer.from(await file.arrayBuffer());
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`);
        return res.send(buf);
      }
    }

    const pdf = await buildInvoicePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    res.status(500).json({ success: false, error: 'Failed to download PDF', message: error.message });
  }
});

// Assign subscription (admin)
router.post('/subscriptions', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const { user_id, tier, current_period_end } = req.body || {};
    if (!user_id || !['explorer', 'frequent', 'elite'].includes(tier)) {
      return res.status(400).json({ success: false, error: 'user_id and valid tier required' });
    }
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('status', 'active');

    const periodEnd = current_period_end
      ? new Date(current_period_end)
      : (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          return d;
        })();

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id,
        tier,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error assigning subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to assign subscription', message: error.message });
  }
});

// GET /api/admin/leads
router.get('/leads', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const status = req.query.status;
    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads', message: error.message });
  }
});

// PATCH /api/admin/leads/:id
router.patch('/leads/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const { status } = req.body || {};
    if (!['new', 'contacted', 'qualified', 'won', 'lost'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead', message: error.message });
  }
});

// GET /api/admin/stats — simple booking KPIs
router.get('/stats', async (_req, res) => {
  try {
    if (!requireSupabase(res)) return;
    const supabaseAdmin = getSupabaseAdmin();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const [{ data: bookings }, { data: leads }, { count: newLeads }] = await Promise.all([
      supabaseAdmin
        .from('bookings')
        .select('id, status, payment_status, total_price, created_at')
        .gte('created_at', sinceIso),
      supabaseAdmin.from('leads').select('id, status').limit(500),
      supabaseAdmin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
    ]);

    const rows = bookings || [];
    const paid = rows.filter((b) => b.payment_status === 'paid');
    const revenue = paid.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const byStatus = rows.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        windowDays: 30,
        bookingsTotal: rows.length,
        bookingsPaid: paid.length,
        revenueZar: Math.round(revenue * 100) / 100,
        byStatus,
        leadsTotal: (leads || []).length,
        leadsNew: newLeads || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats', message: error.message });
  }
});

module.exports = router;
