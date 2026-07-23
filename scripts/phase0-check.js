/**
 * Phase 0 readiness check — env, Supabase reachability, seed/smoke hints.
 * Usage: node scripts/phase0-check.js
 */
require('dotenv').config();

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'BASE_URL',
];

const paymentKeys = ['YOCO_SECRET_KEY', 'YOCO_LIVE_SECRET_KEY', 'YOCO_SECRET', 'YOCO_LIVE_KEY'];
const emailKeys = ['RESEND_API_KEY'];

function pick(...keys) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && String(v).trim()) return { key: k, value: String(v).trim() };
  }
  return null;
}

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  return false;
}

function ok(msg) {
  console.log(`OK    ${msg}`);
  return true;
}

function warn(msg) {
  console.warn(`WARN  ${msg}`);
}

async function main() {
  let passed = true;
  console.log('\n=== Phase 0 checklist ===\n');

  for (const key of required) {
    const v = process.env[key];
    if (!v || !String(v).trim()) {
      passed = fail(`${key} is missing`) || passed;
      passed = false;
    } else if (key.endsWith('_URL') && /cswucsxaujhimhigiybx/.test(v)) {
      passed = false;
      fail(`${key} still points at dead project cswucsxaujhimhigiybx — create a new Supabase project`);
    } else {
      ok(`${key} set`);
    }
  }

  // SERVICE_ROLE_SECRET alias
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SERVICE_ROLE_SECRET) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_SECRET;
    ok('SERVICE_ROLE_SECRET aliased to SUPABASE_SERVICE_ROLE_KEY');
  }

  const yoco = pick(...paymentKeys);
  if (!yoco) {
    passed = false;
    fail('No YOCO secret key (YOCO_SECRET_KEY or YOCO_LIVE_SECRET_KEY)');
  } else {
    const mode = yoco.value.startsWith('sk_live_')
      ? 'live'
      : yoco.value.startsWith('sk_test_')
        ? 'test'
        : 'configured';
    ok(`Yoco via ${yoco.key} (${mode})`);
  }

  if (!pick(...emailKeys)) {
    warn('RESEND_API_KEY missing — contact/booking emails will fail');
  } else {
    ok('RESEND_API_KEY set');
  }

  if (!process.env.CONTACT_TO_EMAIL) {
    warn('CONTACT_TO_EMAIL missing — ops notifications skipped');
  } else {
    ok('CONTACT_TO_EMAIL set');
  }

  if (!process.env.YOCO_WEBHOOK_SECRET) {
    warn('YOCO_WEBHOOK_SECRET missing — webhook signature verification will reject signed webhooks in production');
  } else {
    ok('YOCO_WEBHOOK_SECRET set');
  }

  if (process.env.VITE_API_URL) {
    warn('VITE_API_URL is set — DEPLOY.md says do not set it on Vercel (use same-origin /api)');
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  if (supabaseUrl) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: process.env.VITE_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_SECRET || ''}`,
        },
      });
      if (res.ok || res.status === 200 || res.status === 404) {
        ok(`Supabase reachable (${res.status}) at ${supabaseUrl}`);
      } else {
        passed = false;
        fail(`Supabase responded ${res.status} — check keys and project status`);
      }
    } catch (err) {
      passed = false;
      fail(`Supabase unreachable: ${err.message}`);
    }
  }

  const base = (process.env.BASE_URL || 'https://www.unicabtraveltours.com').replace(/\/+$/, '');
  console.log('\nNext manual steps:');
  console.log('  1. Run migrations 000→018 in Supabase SQL Editor');
  console.log('  2. Create storage buckets avatars (public) + invoices (private)');
  console.log('  3. node scripts/ensure-hub-test-users.js');
  console.log('  4. node scripts/seed-tours-from-data.js');
  console.log(`  5. Smoke: ${base}/login , Yoco test pay, contact form, ${base}/api/payments/status`);
  console.log(`  6. Yoco webhook → ${base}/api/payments/webhook (store whsec_ as YOCO_WEBHOOK_SECRET)\n`);

  if (!passed) {
    console.error('Phase 0: NOT READY\n');
    process.exit(1);
  }
  console.log('Phase 0: READY (env + Supabase OK — still run seed + smoke + webhook)\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
