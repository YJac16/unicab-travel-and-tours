// Payments API — YOCO Checkout only (live or test secret key)
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getSupabaseAdmin, isSupabaseConfigured } = require('../lib/supabaseAdmin');

const getBaseUrl = () => {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return 'https://www.unicabtravelandtours.com';
};

/** Accept common Railway / dashboard env names for the secret key */
const getYocoSecretKey = () =>
  process.env.YOCO_SECRET_KEY ||
  process.env.YOCO_LIVE_SECRET_KEY ||
  process.env.YOCO_SECRET ||
  process.env.YOCO_LIVE_KEY ||
  null;

const getYocoPublicKey = () =>
  process.env.YOCO_PUBLIC_KEY ||
  process.env.YOCO_LIVE_PUBLIC_KEY ||
  null;

// GET /api/payments/status — confirm gateway is wired (no secrets returned)
router.get('/status', (_req, res) => {
  const secret = getYocoSecretKey();
  const mode = secret
    ? (String(secret).startsWith('sk_live_') ? 'live' : String(secret).startsWith('sk_test_') ? 'test' : 'configured')
    : 'missing';

  return res.json({
    success: true,
    gateway: 'yoco',
    configured: !!secret,
    mode,
    publicKeyConfigured: !!getYocoPublicKey(),
    webhookPath: '/api/payments/webhook',
    createPaymentPath: '/api/payments/create-payment'
  });
});

// POST /api/payments/create-payment
// Create YOCO hosted checkout for an existing Supabase booking
router.post('/create-payment', async (req, res) => {
  try {
    const { amount, bookingRef, booking_id, description } = req.body;
    const bookingId = booking_id || bookingRef;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount is required and must be greater than 0'
      });
    }

    if (Number(amount) < 200) {
      return res.status(400).json({
        success: false,
        error: 'Minimum YOCO charge is R2.00 (200 cents)'
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingRef (booking id) is required'
      });
    }

    const yocoSecretKey = getYocoSecretKey();
    if (!yocoSecretKey) {
      console.error('YOCO secret key missing. Set YOCO_SECRET_KEY (or YOCO_LIVE_SECRET_KEY) on Railway.');
      return res.status(500).json({
        success: false,
        error: 'Payment gateway configuration error',
        message: 'YOCO_SECRET_KEY is not configured on the server'
      });
    }

    const amountInCents = Math.round(Number(amount));
    const baseUrl = getBaseUrl().replace(/\/+$/, '');
    const successUrl = `${baseUrl}/payment-success?bookingRef=${encodeURIComponent(bookingId)}`;
    const cancelUrl = `${baseUrl}/payment-failed?bookingRef=${encodeURIComponent(bookingId)}`;
    const failureUrl = cancelUrl;

    const idempotencyKey = crypto.randomUUID
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');

    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${yocoSecretKey}`,
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: 'ZAR',
        successUrl,
        cancelUrl,
        failureUrl,
        metadata: {
          bookingRef: String(bookingId),
          booking_id: String(bookingId),
          description: description || `UNICAB booking ${bookingId}`
        }
      })
    });

    if (!yocoResponse.ok) {
      const errorText = await yocoResponse.text();
      console.error('Yoco API error:', yocoResponse.status, errorText);
      return res.status(yocoResponse.status).json({
        success: false,
        error: 'Failed to create payment checkout',
        message: 'Payment gateway returned an error. Please try again.'
      });
    }

    const yocoData = await yocoResponse.json();
    if (!yocoData.redirectUrl) {
      console.error('Yoco response missing redirectUrl:', yocoData);
      return res.status(500).json({
        success: false,
        error: 'Invalid response from payment gateway'
      });
    }

    const checkoutId = yocoData.id || yocoData.checkoutId || null;

    // Store checkout id + pending payment on booking
    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: 'pending',
            yoco_checkout_id: checkoutId,
            payment_reference: checkoutId || bookingId
          })
          .eq('id', bookingId);
      } catch (dbError) {
        console.warn('Could not update booking payment fields:', dbError.message);
      }
    }

    return res.json({
      success: true,
      data: {
        redirectUrl: yocoData.redirectUrl,
        checkoutId
      },
      redirectUrl: yocoData.redirectUrl
    });
  } catch (error) {
    console.error('Error creating Yoco payment checkout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment checkout',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/payments/webhook
// YOCO webhook — confirm booking payment in Supabase
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body || {};
    const eventType = payload.type || payload.event || payload.eventType;
    const data = payload.payload || payload.data || payload;

    const bookingId =
      data?.metadata?.booking_id ||
      data?.metadata?.bookingRef ||
      payload?.metadata?.booking_id ||
      payload?.metadata?.bookingRef;

    const paymentRef =
      data?.id ||
      data?.checkoutId ||
      data?.paymentId ||
      payload?.id ||
      null;

    console.log('YOCO webhook received:', { eventType, bookingId, paymentRef });

    const isPaid =
      /payment\.succeeded|checkout\.succeeded|payment_succeeded|succeeded/i.test(String(eventType || '')) ||
      data?.status === 'succeeded' ||
      data?.status === 'successful';

    const isFailed =
      /payment\.failed|checkout\.failed|failed/i.test(String(eventType || '')) ||
      data?.status === 'failed';

    if (isSupabaseConfigured() && (bookingId || paymentRef)) {
      const supabaseAdmin = getSupabaseAdmin();
      const updates = {
        payment_reference: paymentRef || bookingId
      };

      if (isPaid) {
        updates.status = 'confirmed';
        updates.payment_status = 'paid';
        updates.paid_at = new Date().toISOString();
      } else if (isFailed) {
        updates.payment_status = 'failed';
      }

      let query = supabaseAdmin.from('bookings').update(updates);
      if (bookingId) {
        query = query.eq('id', bookingId);
      } else if (paymentRef) {
        query = query.eq('yoco_checkout_id', paymentRef);
      }

      const { error } = await query;
      if (error) {
        console.error('Failed to update booking from YOCO webhook:', error);
      }
    }

    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Error processing YOCO webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error.message
    });
  }
});

// POST /api/payments/confirm
// Fallback confirm after redirect (when webhook is delayed)
router.post('/confirm', async (req, res) => {
  try {
    const { bookingRef, booking_id } = req.body;
    const bookingId = booking_id || bookingRef;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingRef is required'
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(501).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to confirm payment',
      message: error.message
    });
  }
});

module.exports = router;
