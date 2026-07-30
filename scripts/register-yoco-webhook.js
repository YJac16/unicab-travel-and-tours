/**
 * Register (or reuse) a Yoco webhook subscription and print the whsec_ secret once.
 *
 * Usage:
 *   node scripts/register-yoco-webhook.js
 *   node scripts/register-yoco-webhook.js --url=https://www.unicabtraveltours.com/api/payments/webhook
 *
 * Requires YOCO_SECRET_KEY or YOCO_LIVE_SECRET_KEY in env (or .env / .env.vercel.pull).
 */
const fs = require('fs');
const path = require('path');

function loadEnvFiles() {
  for (const name of ['.env.vercel.pull', '.env.local', '.env']) {
    const p = path.join(process.cwd(), name);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null || process.env[key] === '') {
        process.env[key] = val;
      }
    }
  }
}

loadEnvFiles();

const secret =
  process.env.YOCO_SECRET_KEY ||
  process.env.YOCO_LIVE_SECRET_KEY ||
  process.env.YOCO_SECRET ||
  null;

const argUrl = process.argv.find((a) => a.startsWith('--url='));
const notificationUrl = (
  argUrl?.slice('--url='.length) ||
  process.env.YOCO_WEBHOOK_URL ||
  `${(process.env.BASE_URL || 'https://www.unicabtraveltours.com').replace(/\/+$/, '')}/api/payments/webhook`
).trim();

const NAME = process.env.YOCO_WEBHOOK_NAME || 'unicab-production';
const EVENT_TYPES = ['payment.created', 'payment.refunded'];

async function tryJson(url, { method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  if (!secret || secret.length < 10) {
    console.error('Missing YOCO_SECRET_KEY / YOCO_LIVE_SECRET_KEY. Set it and re-run.');
    process.exit(1);
  }

  console.log('Notification URL:', notificationUrl);
  console.log('Using secret key prefix:', `${secret.slice(0, 8)}…`);

  // Prefer Checkout API (same host as create checkout), then main API docs path.
  const attempts = [
    {
      label: 'payments.yoco.com/api/webhooks',
      list: 'https://payments.yoco.com/api/webhooks',
      create: 'https://payments.yoco.com/api/webhooks',
      createBody: { name: NAME, url: notificationUrl },
    },
    {
      label: 'api.yoco.com/v1/webhooks/subscriptions',
      list: 'https://api.yoco.com/v1/webhooks/subscriptions/',
      create: 'https://api.yoco.com/v1/webhooks/subscriptions/',
      createBody: {
        name: NAME,
        notification_url: notificationUrl,
        event_types: EVENT_TYPES,
      },
    },
  ];

  for (const api of attempts) {
    console.log(`\nTrying ${api.label}…`);
    const listed = await tryJson(api.list);
    if (listed.ok) {
      const items = Array.isArray(listed.data)
        ? listed.data
        : listed.data?.subscriptions || listed.data?.data || [];
      const existing = items.find((w) => {
        const url = w.url || w.notification_url || w.notificationUrl;
        return url === notificationUrl;
      });
      if (existing) {
        console.log('Webhook already registered for this URL.');
        console.log('Subscription id:', existing.id || existing.subscription_id || '(unknown)');
        console.log(
          'Secret is NOT returned on list. If you lost whsec_, rotate/delete+recreate, or set YOCO_WEBHOOK_SECRET from your password manager.'
        );
        return;
      }
    } else {
      console.log(`List failed (${listed.status}):`, listed.data?.message || listed.data?.error || listed.data);
    }

    const created = await tryJson(api.create, { method: 'POST', body: api.createBody });
    if (!created.ok) {
      console.log(`Create failed (${created.status}):`, created.data?.message || created.data?.error || created.data);
      continue;
    }

    const whsec =
      created.data?.secret ||
      created.data?.webhookSecret ||
      created.data?.signing_secret ||
      null;
    const id = created.data?.id || created.data?.subscription_id || null;

    console.log('\n========================================');
    console.log('YOCO WEBHOOK CREATED — SAVE THIS NOW');
    console.log('========================================');
    console.log('Subscription id:', id);
    console.log('Notification URL:', notificationUrl);
    if (whsec) {
      console.log('\nYOCO_WEBHOOK_SECRET (copy entire line):');
      console.log(whsec);
      console.log('\nNext: set this on Vercel as YOCO_WEBHOOK_SECRET and redeploy.');
    } else {
      console.log('Response had no secret field. Full response:');
      console.log(JSON.stringify(created.data, null, 2));
    }
    console.log('========================================\n');
    return;
  }

  console.error('Could not register webhook on either Yoco API surface.');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
