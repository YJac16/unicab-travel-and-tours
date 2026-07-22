-- =========================
-- 011_add_reserved_status
-- =========================

-- Add 'reserved' status to bookings table
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
add constraint bookings_status_check
check (status in ('reserved','pending','confirmed','completed','cancelled'));

-- Update default status to 'reserved' for new bookings
alter table public.bookings alter column status set default 'reserved';

