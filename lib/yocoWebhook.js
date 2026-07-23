/**
 * Yoco / Standard Webhooks v1 signature verification.
 * Secret format: whsec_<base64>
 */
const crypto = require('crypto');

const MAX_BODY_BYTES = 1_048_576;
const DEFAULT_TOLERANCE_SEC = 180;

function getWebhookSecrets() {
  const primary = process.env.YOCO_WEBHOOK_SECRET || process.env.YOCO_WEBHOOK_SECRET_PRIMARY;
  const secondary = process.env.YOCO_WEBHOOK_SECRET_SECONDARY;
  return [primary, secondary].filter((s) => s && String(s).trim());
}

function decodeSecret(secret) {
  const raw = String(secret || '').trim();
  if (!raw.startsWith('whsec_')) {
    throw new Error('Webhook secret must start with whsec_');
  }
  const b64 = raw.slice('whsec_'.length);
  const key = Buffer.from(b64, 'base64');
  if (!key.length) throw new Error('Webhook secret base64 decoded empty');
  return key;
}

function parseSignatures(header) {
  const out = [];
  for (const part of String(header || '').trim().split(/\s+/)) {
    const [version, sig] = part.split(',', 2);
    if (version === 'v1' && sig) out.push(sig);
  }
  return out;
}

function timingSafeEqualB64(a, b) {
  try {
    const ba = Buffer.from(a, 'base64');
    const bb = Buffer.from(b, 'base64');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * @param {Buffer|string} rawBody
 * @param {Record<string,string>} headers
 * @param {{ toleranceSeconds?: number, secrets?: string[] }} [opts]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function verifyYocoWebhook(rawBody, headers, opts = {}) {
  const secrets = opts.secrets || getWebhookSecrets();
  if (!secrets.length) {
    // Allow local/dev without secret; production should set YOCO_WEBHOOK_SECRET
    if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_YOCO_WEBHOOK_SECRET !== '0') {
      return { ok: false, error: 'YOCO_WEBHOOK_SECRET is not configured' };
    }
    return { ok: true, skipped: true };
  }

  const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''), 'utf8');
  if (bodyBuf.length > MAX_BODY_BYTES) {
    return { ok: false, error: 'Body too large' };
  }

  const id = headers['webhook-id'] || headers['Webhook-Id'];
  const timestamp = headers['webhook-timestamp'] || headers['Webhook-Timestamp'];
  const signatureHeader = headers['webhook-signature'] || headers['Webhook-Signature'];

  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, error: 'Missing webhook-id, webhook-timestamp, or webhook-signature' };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, error: 'Invalid webhook-timestamp' };
  }

  const tolerance = opts.toleranceSeconds ?? DEFAULT_TOLERANCE_SEC;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > tolerance) {
    return { ok: false, error: 'Webhook timestamp outside tolerance window' };
  }

  const signedPayload = `${id}.${timestamp}.${bodyBuf.toString('utf8')}`;
  const candidates = parseSignatures(signatureHeader);
  if (!candidates.length) {
    return { ok: false, error: 'No v1 signatures in webhook-signature header' };
  }

  for (const secret of secrets) {
    let key;
    try {
      key = decodeSecret(secret);
    } catch (e) {
      return { ok: false, error: e.message };
    }
    const expected = crypto.createHmac('sha256', key).update(signedPayload, 'utf8').digest('base64');
    if (candidates.some((c) => timingSafeEqualB64(expected, c))) {
      return { ok: true };
    }
  }

  return { ok: false, error: 'Signature mismatch' };
}

module.exports = {
  verifyYocoWebhook,
  getWebhookSecrets,
};
