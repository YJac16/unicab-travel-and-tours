-- =========================
-- 013_booking_payments
-- YOCO payment fields on bookings
-- =========================

alter table public.bookings
  add column if not exists payment_status text default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  add column if not exists payment_reference text,
  add column if not exists yoco_checkout_id text,
  add column if not exists paid_at timestamptz;

create index if not exists idx_bookings_payment_reference
  on public.bookings (payment_reference)
  where payment_reference is not null;

create index if not exists idx_bookings_yoco_checkout_id
  on public.bookings (yoco_checkout_id)
  where yoco_checkout_id is not null;
