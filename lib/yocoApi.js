/**
 * Thin Yoco Checkout API helpers.
 */
function getYocoSecretKey() {
  return (
    process.env.YOCO_SECRET_KEY ||
    process.env.YOCO_LIVE_SECRET_KEY ||
    process.env.YOCO_SECRET ||
    process.env.YOCO_LIVE_KEY ||
    null
  );
}

async function yocoFetch(path, { method = 'GET', body } = {}) {
  const secret = getYocoSecretKey();
  if (!secret) {
    const err = new Error('YOCO_SECRET_KEY is not configured');
    err.code = 'CONFIG';
    throw err;
  }
  const res = await fetch(`https://payments.yoco.com/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
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
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Yoco API ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function getCheckout(checkoutId) {
  if (!checkoutId) throw new Error('checkoutId required');
  return yocoFetch(`/checkouts/${encodeURIComponent(checkoutId)}`);
}

function checkoutLooksPaid(checkout) {
  if (!checkout) return false;
  const status = String(checkout.status || checkout.paymentStatus || '').toLowerCase();
  return (
    status === 'succeeded' ||
    status === 'successful' ||
    status === 'completed' ||
    status === 'paid' ||
    !!checkout.paid
  );
}

async function refundCheckout(checkoutId, { amount } = {}) {
  if (!checkoutId) throw new Error('checkoutId required');
  const body = {};
  if (amount != null && Number(amount) > 0) {
    body.amount = Math.round(Number(amount));
  }
  return yocoFetch(`/checkouts/${encodeURIComponent(checkoutId)}/refund`, {
    method: 'POST',
    body,
  });
}

module.exports = {
  getYocoSecretKey,
  getCheckout,
  checkoutLooksPaid,
  refundCheckout,
};
