/**
 * Ensure Supabase Auth test users for hub testing.
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
  process.env.SUPABASE_SECRET_KEY;

const USERS = [
  {
    email: 'admin@unicabtravel.co.za',
    password: 'Admin123!',
    role: 'admin',
    full_name: 'Admin User',
  },
  {
    email: 'driver@unicabtravel.co.za',
    password: 'Driver123!',
    role: 'driver',
    full_name: 'Driver User',
  },
  {
    email: 'member@unicabtravel.co.za',
    password: 'Member123!',
    role: 'customer',
    full_name: 'Member User',
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

async function ensureUser(admin, spec) {
  const existing = await findUserByEmail(admin, spec.email);
  let userId;

  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: spec.password,
      email_confirm: true,
      user_metadata: { full_name: spec.full_name, name: spec.full_name },
    });
    if (error) throw error;
    console.log(`Updated auth user: ${spec.email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: spec.email,
      password: spec.password,
      email_confirm: true,
      user_metadata: { full_name: spec.full_name, name: spec.full_name },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user: ${spec.email}`);
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      role: spec.role,
      email: spec.email.toLowerCase(),
      full_name: spec.full_name,
    },
    { onConflict: 'id' }
  );
  if (profileError) throw profileError;
  console.log(`  profile role=${spec.role}`);

  if (spec.role === 'driver') {
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
          phone: '+27810000000',
          active: true,
        })
        .select('id')
        .single();
      if (driverError) throw driverError;
      console.log(`  created drivers row ${inserted.id}`);
    }
  }

  return userId;
}

function printCredentials() {
  console.log(`
=== Hub test logins ===
Sign in at: /login  (or https://www.unicabtraveltours.com/login)

Admin
  Email:    admin@unicabtravel.co.za
  Password: Admin123!
  Hub:      /admin/dashboard

Driver
  Email:    driver@unicabtravel.co.za
  Password: Driver123!
  Hub:      /driver/dashboard

Client (member)
  Email:    member@unicabtravel.co.za
  Password: Member123!
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

  console.log(`\nEnsuring hub test users against ${url}...\n`);
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
