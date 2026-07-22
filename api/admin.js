// Admin API Routes
// Protected by ADMIN role
// Admin has full visibility and override authority

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('./middleware/auth');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../lib/supabaseAdmin');

const BOOKING_SELECT = `
  *,
  tour:tours(*),
  driver:drivers(id, name, email, phone, active),
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

module.exports = router;
