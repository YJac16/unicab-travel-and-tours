// Payments API — YOCO Checkout (bookings + membership subscriptions)
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');
const { verifyYocoWebhook } = require('../../lib/yocoWebhook');
const {
  getYocoSecretKey,
  getCheckout,
  checkoutLooksPaid,
  refundCheckout,
} = require('../../lib/yocoApi');
const { bookingEmailFields, BOOKING_EMAIL_SELECT } = require('../../lib/bookingFields');

const MEMBERSHIP_AMOUNTS_CENTS = {
  explorer: 29900,
  frequent: 89900,
  elite: 250000,
};

const getBaseUrl = (req) => {
  const clean = (value) =>
    String(value || '')
      .replace(/[\r\n\t]+/g, '')
      .trim()
      .replace(/\/+$/, '');

  if (process.env.BASE_URL) return clean(process.env.BASE_URL);
  if (process.env.FRONTEND_URL) return clean(process.env.FRONTEND_URL);
  if (process.env.VERCEL_URL) return clean(`https://${process.env.VERCEL_URL}`);
  const host = clean(req?.headers?.['x-forwarded-host'] || req?.headers?.host);
  const proto = clean(req?.headers?.['x-forwarded-proto'] || 'https') || 'https';
  if (host) return `${proto}://${host}`;
  return 'https://www.unicabtraveltours.com';
};

const getYocoPublicKey = () =>
  process.env.YOCO_PUBLIC_KEY || process.env.YOCO_LIVE_PUBLIC_KEY || null;

function pickYocoCheckoutId(...candidates) {
  for (const value of candidates) {
    const id = String(value || '').trim();
    if (id.startsWith('ch_')) return id;
  }
  return null;
}

async function resolveSubscriptionCheckoutId({ userId, tier, checkoutId }) {
  if (checkoutId) return checkoutId;
  if (!userId || !tier) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('yoco_checkout_id')
    .eq('user_id', userId)
    .eq('tier', String(tier).toLowerCase())
    .eq('status', 'past_due')
    .not('yoco_checkout_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.yoco_checkout_id || null;
}

async function activateSubscription({ userId, tier, checkoutId, paymentRef }) {
  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date();
  const normalizedTier = String(tier).toLowerCase();
  const checkoutKey = pickYocoCheckoutId(checkoutId, paymentRef);

  const { data: existingActive } = await supabaseAdmin
    .from('subscriptions')
    .select('id, current_period_end, tier')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  let periodStart = now;
  if (
    existingActive?.current_period_end &&
    existingActive.tier === normalizedTier &&
    new Date(existingActive.current_period_end).getTime() > now.getTime()
  ) {
    periodStart = new Date(existingActive.current_period_end);
  }

  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: now.toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Promote the matching unpaid checkout when we have a YOCO checkout id.
  // Do not activate a different past_due row if a specific checkout was paid.
  if (checkoutKey) {
    const { data: promoted, error: promoteError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        tier: normalizedTier,
        current_period_end: periodEnd.toISOString(),
        payment_reference: paymentRef || checkoutKey,
        updated_at: now.toISOString(),
      })
      .eq('yoco_checkout_id', checkoutKey)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (promoteError) throw promoteError;
    if (promoted) return promoted;

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: normalizedTier,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        yoco_checkout_id: checkoutKey,
        payment_reference: paymentRef || checkoutKey,
        updated_at: now.toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // No checkout id (admin/webhook metadata-only): activate latest past_due for user+tier
  const { data: latestPending } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('tier', normalizedTier)
    .eq('status', 'past_due')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestPending?.id) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        payment_reference: paymentRef || null,
        updated_at: now.toISOString(),
      })
      .eq('id', latestPending.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return updated;
  }

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier: normalizedTier,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      yoco_checkout_id: null,
      payment_reference: paymentRef || null,
      updated_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function sendPaidBookingEmails(booking) {
  const fields = bookingEmailFields(booking);
  if (!fields?.email) return;
  const { sendBookingConfirmationEmail, sendOpsNotificationEmail } = require('../../lib/bookingEmail');
  await sendBookingConfirmationEmail({
    to: fields.email,
    guestName: fields.name,
    bookingId: fields.bookingId,
    tourName: fields.tourName,
    date: fields.date,
    time: fields.time,
    amountZar: fields.amount,
  }).catch((e) => console.warn('Booking email failed:', e.message));
  await sendOpsNotificationEmail({
    subject: `Paid booking ${fields.bookingId}`,
    text: `Booking ${fields.bookingId} paid for ${fields.email}`,
  }).catch(() => {});
}

router.get('/status', (_req, res) => {
  const secret = getYocoSecretKey();
  const mode = secret
    ? String(secret).startsWith('sk_live_')
      ? 'live'
      : String(secret).startsWith('sk_test_')
        ? 'test'
        : 'configured'
    : 'missing';

  return res.json({
    success: true,
    gateway: 'yoco',
    configured: !!secret,
    mode,
    publicKeyConfigured: !!getYocoPublicKey(),
    webhookSecretConfigured: !!(
      process.env.YOCO_WEBHOOK_SECRET || process.env.YOCO_WEBHOOK_SECRET_PRIMARY
    ),
    webhookPath: '/api/payments/webhook',
    createPaymentPath: '/api/payments/create-payment',
  });
});

// POST /api/payments/create-payment
router.post('/create-payment', async (req, res) => {
  try {
    const {
      amount,
      bookingRef,
      booking_id,
      description,
      kind,
      tier,
      user_id,
      userId,
    } = req.body;

    const isSubscription = kind === 'subscription' || !!tier;
    const bookingId = booking_id || bookingRef;
    const memberUserId = user_id || userId;
    const membershipTier = Object.keys(MEMBERSHIP_AMOUNTS_CENTS);
    const normalizedTier = membershipTier.includes(String(tier || '').toLowerCase())
      ? String(tier).toLowerCase()
      : null;

    let amountInCents = Math.round(Number(amount));
    if (isSubscription) {
      if (!normalizedTier) {
        return res.status(400).json({
          success: false,
          error: 'tier is required for membership checkout (explorer|frequent|elite)',
        });
      }
      if (!memberUserId) {
        return res.status(400).json({
          success: false,
          error: 'user_id is required for membership checkout — sign in first',
        });
      }
      amountInCents = MEMBERSHIP_AMOUNTS_CENTS[normalizedTier];
    } else {
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'amount is required and must be greater than 0',
        });
      }
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: 'bookingRef (booking id) is required',
        });
      }
    }

    if (Number(amountInCents) < 200) {
      return res.status(400).json({
        success: false,
        error: 'Minimum YOCO charge is R2.00 (200 cents)',
      });
    }

    const yocoSecretKey = getYocoSecretKey();
    if (!yocoSecretKey) {
      console.error('YOCO secret key missing. Set YOCO_SECRET_KEY (or YOCO_LIVE_SECRET_KEY) on Vercel.');
      return res.status(500).json({
        success: false,
        error: 'Payment gateway configuration error',
        message: 'YOCO_SECRET_KEY is not configured on the server',
      });
    }

    const baseUrl = getBaseUrl(req);
    let successUrl;
    let cancelUrl;
    let metadata;

    if (isSubscription) {
      successUrl = `${baseUrl}/membership/success?tier=${encodeURIComponent(normalizedTier)}`;
      cancelUrl = `${baseUrl}/membership/transaction/${encodeURIComponent(normalizedTier)}?cancelled=1`;
      metadata = {
        kind: 'subscription',
        tier: normalizedTier,
        user_id: String(memberUserId),
        description: description || `UNICAB membership ${normalizedTier}`,
      };
    } else {
      successUrl = `${baseUrl}/payment-success?bookingRef=${encodeURIComponent(bookingId)}`;
      cancelUrl = `${baseUrl}/payment-failed?bookingRef=${encodeURIComponent(bookingId)}`;
      metadata = {
        kind: 'booking',
        bookingRef: String(bookingId),
        booking_id: String(bookingId),
        description: description || `UNICAB booking ${bookingId}`,
      };
    }

    const idempotencyKey = crypto.randomUUID
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');

    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${yocoSecretKey}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: 'ZAR',
        successUrl,
        cancelUrl,
        failureUrl: cancelUrl,
        metadata,
      }),
    });

    if (!yocoResponse.ok) {
      const errorText = await yocoResponse.text();
      console.error('Yoco API error:', yocoResponse.status, errorText);
      return res.status(yocoResponse.status).json({
        success: false,
        error: 'Failed to create payment checkout',
        message: 'Payment gateway returned an error. Please try again.',
      });
    }

    const yocoData = await yocoResponse.json();
    if (!yocoData.redirectUrl) {
      console.error('Yoco response missing redirectUrl:', yocoData);
      return res.status(500).json({
        success: false,
        error: 'Invalid response from payment gateway',
      });
    }

    const checkoutId = yocoData.id || yocoData.checkoutId || null;

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        if (isSubscription) {
          await supabaseAdmin.from('subscriptions').insert({
            user_id: memberUserId,
            tier: normalizedTier,
            status: 'past_due',
            yoco_checkout_id: checkoutId,
            payment_reference: checkoutId,
            updated_at: new Date().toISOString(),
          });
        } else {
          await supabaseAdmin
            .from('bookings')
            .update({
              payment_status: 'pending',
              yoco_checkout_id: checkoutId,
              payment_reference: checkoutId || bookingId,
            })
            .eq('id', bookingId);
        }
      } catch (dbError) {
        console.warn('Could not store checkout reference:', dbError.message);
      }
    }

    return res.json({
      success: true,
      data: {
        redirectUrl: yocoData.redirectUrl,
        checkoutId,
      },
      redirectUrl: yocoData.redirectUrl,
    });
  } catch (error) {
    console.error('Error creating Yoco payment checkout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment checkout',
      message: error.message || 'An unexpected error occurred',
    });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const rawBody = req.rawBody != null ? req.rawBody : Buffer.from(JSON.stringify(req.body || {}));
    const verified = verifyYocoWebhook(rawBody, req.headers || {});
    if (!verified.ok) {
      console.warn('YOCO webhook rejected:', verified.error);
      return res.status(401).json({ success: false, error: verified.error || 'Invalid signature' });
    }

    const webhookId = req.headers['webhook-id'] || req.headers['Webhook-Id'] || null;
    const payload = req.body || {};
    const eventType =
      payload.event_type || payload.type || payload.event || payload.eventType || null;
    const data = payload.payload || payload.data || payload;
    const metadata = data?.metadata || payload?.metadata || {};

    const kind = metadata.kind || (metadata.tier ? 'subscription' : 'booking');
    const bookingId = metadata.booking_id || metadata.bookingRef;
    const tier = metadata.tier;
    const userId = metadata.user_id;
    // Prefer checkout ids (ch_…) — payment.succeeded payloads often expose payment id (p_…) as data.id
    const checkoutId =
      pickYocoCheckoutId(
        data?.checkoutId,
        data?.checkout_id,
        metadata?.checkoutId,
        metadata?.checkout_id,
        data?.id,
        payload?.checkoutId,
        payload?.id
      ) || null;
    const paymentRef =
      checkoutId ||
      data?.paymentId ||
      data?.payment_id ||
      payload?.payment_id ||
      data?.id ||
      payload?.id ||
      null;

    console.log('YOCO webhook received:', {
      webhookId,
      eventType,
      kind,
      bookingId,
      tier,
      userId,
      checkoutId,
      paymentRef,
    });

    const typeStr = String(eventType || '');
    const isPaid =
      /payment\.created|payment\.succeeded|checkout\.succeeded|payment_succeeded|succeeded/i.test(
        typeStr
      ) ||
      data?.status === 'succeeded' ||
      data?.status === 'successful';

    const isFailed =
      /payment\.failed|checkout\.failed|failed/i.test(typeStr) || data?.status === 'failed';

    const isRefunded = /payment\.refunded|refunded/i.test(typeStr);

    if (!isSupabaseConfigured()) {
      return res.json({ success: true, received: true });
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (webhookId) {
      const { data: seen } = await supabaseAdmin
        .from('yoco_webhook_events')
        .select('webhook_id')
        .eq('webhook_id', webhookId)
        .maybeSingle();
      if (seen) {
        return res.json({ success: true, received: true, duplicate: true });
      }
    }

    const markWebhookProcessed = async () => {
      if (!webhookId) return;
      await supabaseAdmin.from('yoco_webhook_events').upsert({
        webhook_id: webhookId,
        event_type: typeStr || null,
        processed_at: new Date().toISOString(),
      });
    };

    if (kind === 'subscription' && (userId || checkoutId || paymentRef)) {
      if (isPaid && userId && tier) {
        try {
          await activateSubscription({
            userId,
            tier,
            checkoutId,
            paymentRef,
          });
        } catch (err) {
          console.error('Failed to activate subscription from webhook:', err);
          if (!checkoutId) {
            return res.status(500).json({ success: false, error: 'Subscription activation failed' });
          }
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          const { data: fallbackRows, error: fallbackError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'active',
              payment_reference: paymentRef || checkoutId,
              current_period_end: periodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('yoco_checkout_id', checkoutId)
            .eq('user_id', userId)
            .select('id');
          if (fallbackError || !fallbackRows?.length) {
            return res.status(500).json({
              success: false,
              error: 'Subscription activation failed',
              message: fallbackError?.message || 'No matching checkout row',
            });
          }
        }
      } else if ((isFailed || isRefunded) && (checkoutId || (userId && tier))) {
        let failQuery = supabaseAdmin
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('status', 'past_due');
        if (checkoutId) {
          failQuery = failQuery.eq('yoco_checkout_id', checkoutId);
        } else {
          failQuery = failQuery.eq('user_id', userId).eq('tier', String(tier).toLowerCase());
        }
        await failQuery;
      }
      await markWebhookProcessed();
      return res.json({ success: true, received: true });
    }

    if (bookingId || paymentRef) {
      const updates = {
        payment_reference: paymentRef || bookingId,
      };
      if (isPaid) {
        updates.status = 'confirmed';
        updates.payment_status = 'paid';
        updates.paid_at = new Date().toISOString();
      } else if (isFailed) {
        updates.payment_status = 'failed';
      } else if (isRefunded) {
        updates.payment_status = 'refunded';
      }

      let query = supabaseAdmin.from('bookings').update(updates);
      if (bookingId) query = query.eq('id', bookingId);
      else if (paymentRef) query = query.eq('yoco_checkout_id', paymentRef);

      const { error } = await query;
      if (error) console.error('Failed to update booking from YOCO webhook:', error);
      else if (isPaid) {
        try {
          const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select(BOOKING_EMAIL_SELECT)
            .eq(bookingId ? 'id' : 'yoco_checkout_id', bookingId || paymentRef)
            .maybeSingle();
          await sendPaidBookingEmails(booking);
        } catch (mailErr) {
          console.warn('Post-payment email skipped:', mailErr.message);
        }
      }
    }

    await markWebhookProcessed();
    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Error processing YOCO webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error.message,
    });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const { bookingRef, booking_id, kind, tier, user_id, userId, checkoutId } = req.body;
    const bookingId = booking_id || bookingRef;
    const memberUserId = user_id || userId;
    const isSubscription = kind === 'subscription' || !!tier;

    if (!isSupabaseConfigured()) {
      return res.status(501).json({ success: false, error: 'Supabase not configured' });
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (isSubscription) {
      if (!memberUserId || !tier) {
        return res.status(400).json({
          success: false,
          error: 'user_id and tier are required for membership confirm',
        });
      }

      const resolvedCheckoutId = await resolveSubscriptionCheckoutId({
        userId: memberUserId,
        tier,
        checkoutId,
      });

      if (!resolvedCheckoutId) {
        return res.status(400).json({
          success: false,
          error: 'checkoutId is required — payment must be verified with YOCO',
        });
      }

      let checkout;
      try {
        checkout = await getCheckout(resolvedCheckoutId);
      } catch (err) {
        return res.status(402).json({
          success: false,
          error: 'Could not verify YOCO checkout',
          message: err.message,
        });
      }
      if (!checkoutLooksPaid(checkout)) {
        return res.status(402).json({
          success: false,
          error: 'Payment not completed yet',
          status: checkout?.status || null,
        });
      }

      const data = await activateSubscription({
        userId: memberUserId,
        tier: String(tier).toLowerCase(),
        checkoutId: resolvedCheckoutId,
        paymentRef: resolvedCheckoutId,
      });

      return res.json({ success: true, data });
    }

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingRef is required' });
    }

    const { data: existing, error: findErr } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, yoco_checkout_id, payment_reference')
      .eq('id', bookingId)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (existing.payment_status === 'paid') {
      const { data: paid } = await supabaseAdmin
        .from('bookings')
        .select(BOOKING_EMAIL_SELECT)
        .eq('id', bookingId)
        .maybeSingle();
      return res.json({ success: true, data: paid, alreadyPaid: true });
    }

    const checkoutToVerify = checkoutId || existing.yoco_checkout_id || existing.payment_reference;
    if (!checkoutToVerify) {
      return res.status(400).json({
        success: false,
        error: 'checkoutId required to confirm unpaid booking',
      });
    }

    let checkout;
    try {
      checkout = await getCheckout(checkoutToVerify);
    } catch (err) {
      return res.status(402).json({
        success: false,
        error: 'Could not verify YOCO checkout',
        message: err.message,
      });
    }
    if (!checkoutLooksPaid(checkout)) {
      return res.status(402).json({
        success: false,
        error: 'Payment not completed yet',
        status: checkout?.status || null,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        payment_reference: checkoutToVerify,
        yoco_checkout_id: checkoutToVerify,
      })
      .eq('id', bookingId)
      .select(BOOKING_EMAIL_SELECT)
      .maybeSingle();

    if (error) throw error;

    await sendPaidBookingEmails(data).catch(() => {});

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to confirm payment',
      message: error.message,
    });
  }
});

// POST /api/payments/refund — admin-oriented refund by booking id
router.post('/refund', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token || !isSupabaseConfigured()) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (String(profile?.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { booking_id, bookingId, amount_cents } = req.body || {};
    const id = booking_id || bookingId;
    if (!id) {
      return res.status(400).json({ success: false, error: 'booking_id is required' });
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    const checkoutId = booking.yoco_checkout_id || booking.payment_reference;
    if (!checkoutId || booking.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Booking has no paid YOCO checkout to refund',
      });
    }

    await refundCheckout(checkoutId, {
      amount: amount_cents != null ? amount_cents : undefined,
    });

    const { data: updated, error: upErr } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: 'admin_refund',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (upErr) throw upErr;

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Refund error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refund',
      message: error.message,
    });
  }
});

module.exports = router;
