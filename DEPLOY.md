# Deploy notes (Vercel-only)

## Phase 0 checklist (go-live unblock)

Run `npm run phase0` (`node scripts/phase0-check.js`) after env is set — it fails if the dead `cswucsxaujhimhigiybx` host is still configured.

1. Create a **new or restored** Supabase project (the old `cswucsxaujhimhigiybx` host is dead).
2. In SQL Editor, run migrations **in order**: `000` → `018` under [`supabase/migrations/`](supabase/migrations/). Prefer migrations over legacy [`schema.sql`](supabase/schema.sql).
3. Storage → create buckets **`avatars`** (public) and **`invoices`** (private), then run [`016_storage_buckets.sql`](supabase/migrations/016_storage_buckets.sql) policies.
4. Set Vercel + local env (Production):

| Name | Notes |
|------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_URL` | Same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (alias: `SERVICE_ROLE_SECRET`) |
| `YOCO_SECRET_KEY` or `YOCO_LIVE_SECRET_KEY` | Checkout |
| `YOCO_WEBHOOK_SECRET` | `whsec_…` from Yoco webhook create (shown once) |
| `BASE_URL` | `https://www.unicabtraveltours.com` |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Contact + booking emails |
| `VITE_GA_MEASUREMENT_ID` | Optional GA4 (loads only after cookie consent) |
| `JWT_SECRET` | Legacy JWT fallback |

5. **Do not** set `VITE_API_URL` (same-origin `/api`).
6. Redeploy Vercel after any `VITE_*` change.
7. `node scripts/ensure-hub-test-users.js` then `node scripts/seed-tours-from-data.js`
8. Smoke: `/login`, one Yoco test payment, contact form, `/api/payments/status`
9. Register the Yoco webhook (Developer Hub does **not** auto-create it for a new live app):
   - Put a real `sk_live_…` in `YOCO_SECRET_KEY` / `YOCO_LIVE_SECRET_KEY` on Vercel (empty placeholders will not work).
   - Run `node scripts/register-yoco-webhook.js` — it prints `YOCO_WEBHOOK_SECRET=whsec_…` **once**.
   - Save that value to Vercel as `YOCO_WEBHOOK_SECRET` and redeploy.
   - Notification URL: `https://www.unicabtraveltours.com/api/payments/webhook`

## Vercel

- Project: unicab-travel-and-tours
- Domains: unicabtraveltours.com / www.unicabtraveltours.com
- API: Express catch-all [`api/[[...path]].js`](api/[[...path]].js)

Local: `npm run build && node server.js` (or Vite proxy → port 3000).

## Hub test users

Credentials live only in [`scripts/ensure-hub-test-users.js`](scripts/ensure-hub-test-users.js) (not duplicated here). Run the script against a live project to create/update Auth users + `profiles.role`.

Sign in: https://www.unicabtraveltours.com/login

### Manual fallback

If DNS fails (`ENOTFOUND`): fix `SUPABASE_URL` / `VITE_SUPABASE_URL`, or create users in Supabase Auth Dashboard and upsert `profiles.role` (`admin` / `driver` / `customer`) plus a `drivers` row for the driver user.

## Payments & legal

- Checkout is **YOCO hosted only** (`/tours/:id/checkout`). Legacy card route redirects to checkout.
- Confirm requires a paid YOCO checkout id (webhook signature verified when `YOCO_WEBHOOK_SECRET` is set).
- Legal: `/terms`, `/cancellation`, `/privacy-policy`, `/cookie-policy` (footer links via `SiteFooter`). Checkout requires Terms + Cancellation acknowledgement.
