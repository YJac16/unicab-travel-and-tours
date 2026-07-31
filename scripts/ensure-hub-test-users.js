/**
 * Ensure Supabase Auth demo users for hub testing.
 * Usage: node scripts/ensure-hub-test-users.js
 *
 * Requires SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '');
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SERVICE_ROLE_SECRET;

const USERS = [
  {
    email: 'yaseenjacobs97@gmail.com',
    password: 'Yaseen97!',
    role: 'admin',
    full_name: 'Yaseen Jacobs',
    phone: '+27 82 000 0001',
    is_owner: true,
    ensure_driver_row: true,
    driver: {
      phone: '+27 82 000 0001',
      license_number: 'CA-OWNER-001',
    },
  },
  {
    email: 'admin@unicabtravel.co.za',
    password: 'Admin123!',
    role: 'admin',
    full_name: 'Demo Admin',
    phone: '+27 21 555 0100',
    demo: {
      title: 'Operations Admin',
      notes: 'Full admin hub access for demos and QA.',
    },
  },
  {
    email: 'driver@unicabtravel.co.za',
    password: 'Driver123!',
    role: 'driver',
    full_name: 'Demo Driver',
    phone: '+27 82 555 0200',
    driver: {
      phone: '+27 82 555 0200',
      license_number: 'CA-DEMO-DRV-88',
    },
    demo: {
      title: 'Cape Town chauffeur',
      notes: 'Assigned to Peninsula and Winelands routes.',
    },
  },
  {
    email: 'member@unicabtravel.co.za',
    password: 'Member123!',
    role: 'customer',
    full_name: 'Demo Client',
    phone: '+27 83 555 0300',
    subscription: {
      tier: 'frequent',
      months: 1,
    },
    demo: {
      title: 'Frequent member',
      notes: 'Seeded with an active Frequent prepaid month for discount testing.',
    },
  },
];

async function findUserByEmail(admin, email) {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = (data?.users || []).find((u) => (u.email || '').toLowerCase() === target);
    if (found) return found;
    if (!data?.users?.length || data.users.length < perPage) return null;
    page += 1;
    if (page > 20) return null;
  }
}

async function ensureSubscription(admin, userId, subscription) {
  if (!subscription?.tier) return;

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (subscription.months || 1));

  // Collapse any prior actives for this user (including duplicate demo rows)
  await admin
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');

  const { data: existingRows } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('tier', subscription.tier)
    .eq('payment_reference', `demo-${subscription.tier}`)
    .order('created_at', { ascending: false })
    .limit(1);

  const existing = existingRows?.[0];

  if (existing?.id) {
    const { data, error } = await admin
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, tier, status, current_period_end')
      .single();
    if (error) throw error;
    console.log(
      `  subscription tier=${data.tier} status=${data.status} until=${data.current_period_end}`
    );
    return;
  }

  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier: subscription.tier,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      payment_reference: `demo-${subscription.tier}`,
      updated_at: new Date().toISOString(),
    })
    .select('id, tier, status, current_period_end')
    .single();

  if (error) throw error;
  console.log(
    `  subscription tier=${data.tier} status=${data.status} until=${data.current_period_end}`
  );
}

async function ensureUser(admin, spec) {
  const existing = await findUserByEmail(admin, spec.email);
  let userId;

  const metadata = {
    full_name: spec.full_name,
    name: spec.full_name,
    phone: spec.phone || null,
    demo_title: spec.demo?.title || null,
    demo_notes: spec.demo?.notes || null,
  };

  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: spec.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    console.log(`Updated auth user: ${spec.email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: spec.email,
      password: spec.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user: ${spec.email}`);
  }

  const profileRow = {
    id: userId,
    role: spec.role,
    email: spec.email.toLowerCase(),
    full_name: spec.full_name,
    phone: spec.phone || null,
  };
  if (spec.is_owner) profileRow.is_owner = true;

  const { error: profileError } = await admin.from('profiles').upsert(profileRow, { onConflict: 'id' });
  if (profileError) throw profileError;
  console.log(
    `  profile role=${spec.role}${spec.is_owner ? ' is_owner=true' : ''}${
      spec.phone ? ` phone=${spec.phone}` : ''
    }`
  );

  if (spec.role === 'driver' || spec.ensure_driver_row) {
    const driverPhone = spec.driver?.phone || spec.phone || '+27810000000';
    const license = spec.driver?.license_number || null;

    const { data: existingDriver } = await admin
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingDriver) {
      await admin
        .from('drivers')
        .update({
          name: spec.full_name,
          email: spec.email.toLowerCase(),
          phone: driverPhone,
          license_number: license,
          active: true,
        })
        .eq('id', existingDriver.id);
      console.log(`  linked existing drivers row ${existingDriver.id}`);
    } else {
      const { data: inserted, error: driverError } = await admin
        .from('drivers')
        .insert({
          user_id: userId,
          name: spec.full_name,
          email: spec.email.toLowerCase(),
          phone: driverPhone,
          license_number: license,
          active: true,
        })
        .select('id')
        .single();
      if (driverError) throw driverError;
      console.log(`  created drivers row ${inserted.id}`);
    }
  }

  if (spec.subscription) {
    await ensureSubscription(admin, userId, spec.subscription);
  }

  return userId;
}

function printCredentials() {
  console.log(`
=== Hub demo logins ===
Sign in at: /login  (or https://www.unicabtraveltours.com/login)

Owner Admin (hub switcher: Admin / Driver / Member)
  Email:    yaseenjacobs97@gmail.com
  Password: Yaseen97!
  Hub:      /admin/dashboard

Admin (Demo Admin)
  Email:    admin@unicabtravel.co.za
  Password: Admin123!
  Phone:    +27 21 555 0100
  Hub:      /admin/dashboard

Driver (Demo Driver)
  Email:    driver@unicabtravel.co.za
  Password: Driver123!
  Phone:    +27 82 555 0200
  License:  CA-DEMO-DRV-88
  Hub:      /driver/dashboard

Client (Demo Client / Frequent member)
  Email:    member@unicabtravel.co.za
  Password: Member123!
  Phone:    +27 83 555 0300
  Hub:      /member/dashboard
`);
}

async function main() {
  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
    printCredentials();
    console.error(
      'Fallback: create the users in Supabase Auth Dashboard and set profiles.role (see DEPLOY.md).'
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\nEnsuring hub demo users against ${url}...\n`);
  let failures = 0;
  for (const spec of USERS) {
    try {
      await ensureUser(admin, spec);
    } catch (err) {
      failures += 1;
      const cause = err?.cause?.code || err?.cause?.message || '';
      console.error(`Failed for ${spec.email}:`, err.message || err, cause ? `(${cause})` : '');
      process.exitCode = 1;
    }
  }

  printCredentials();

  if (failures) {
    console.error(
      'Could not create/update Auth users (often ENOTFOUND if SUPABASE_URL is wrong or the project was deleted).'
    );
    console.error(
      'Fallback: fix SUPABASE_URL, or create the users in Supabase Auth Dashboard and set profiles.role — see DEPLOY.md.'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
