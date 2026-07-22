-- 015: vehicles, booking trip/pickup, driver_locations, subscriptions, invoices
-- Safe to re-run (IF NOT EXISTS / additive columns)

-- =========================
-- VEHICLES (fleet)
-- =========================
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  type text,
  status text not null default 'available'
    check (status in ('available', 'dispatched', 'out')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vehicles enable row level security;

create index if not exists idx_vehicles_status on public.vehicles(status);

-- =========================
-- BOOKINGS extensions
-- =========================
alter table public.bookings
  add column if not exists pickup_address text,
  add column if not exists pickup_lat numeric(10,7),
  add column if not exists pickup_lng numeric(10,7),
  add column if not exists trip_status text,
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_trip_status_check'
  ) then
    alter table public.bookings
      add constraint bookings_trip_status_check
      check (
        trip_status is null
        or trip_status in ('assigned', 'en_route_pickup', 'on_tour', 'completed', 'cancelled')
      );
  end if;
end $$;

create index if not exists idx_bookings_trip_status on public.bookings(trip_status);
create index if not exists idx_bookings_vehicle_id on public.bookings(vehicle_id);

-- =========================
-- DRIVER LOCATIONS (live tracking)
-- =========================
create table if not exists public.driver_locations (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  heading numeric(6,2),
  updated_at timestamptz default now(),
  unique (booking_id)
);

alter table public.driver_locations enable row level security;

create index if not exists idx_driver_locations_driver on public.driver_locations(driver_id);
create index if not exists idx_driver_locations_updated on public.driver_locations(updated_at desc);

-- Enable Realtime for live map consumers
do $$
begin
  begin
    alter publication supabase_realtime add table public.driver_locations;
  exception when duplicate_object then
    null;
  end;
end $$;

-- =========================
-- SUBSCRIPTIONS
-- =========================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null check (tier in ('explorer', 'frequent', 'elite')),
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'past_due')),
  current_period_end timestamptz,
  yoco_checkout_id text,
  payment_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

-- =========================
-- INVOICES
-- =========================
create sequence if not exists public.invoice_number_seq start 1001;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  line_items jsonb not null default '[]'::jsonb,
  amount_zar numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid')),
  pdf_path text,
  customer_name text,
  customer_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.invoices enable row level security;

create index if not exists idx_invoices_user on public.invoices(user_id);
create index if not exists idx_invoices_status on public.invoices(status);

-- =========================
-- RLS policies (authenticated reads; writes via service role / Express)
-- =========================

-- Vehicles: authenticated read; admin writes via service role
drop policy if exists "vehicles_select_authenticated" on public.vehicles;
create policy "vehicles_select_authenticated"
  on public.vehicles for select
  to authenticated
  using (true);

-- Driver locations: customer of booking, assigned driver, or admin
drop policy if exists "driver_locations_select" on public.driver_locations;
create policy "driver_locations_select"
  on public.driver_locations for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or exists (
      select 1 from public.drivers d
      where d.id = driver_id and d.user_id = auth.uid()
    )
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.user_id = auth.uid() or lower(b.customer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "driver_locations_upsert_driver" on public.driver_locations;
create policy "driver_locations_insert_driver"
  on public.driver_locations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.drivers d
      where d.id = driver_id and d.user_id = auth.uid()
    )
  );

create policy "driver_locations_update_driver"
  on public.driver_locations for update
  to authenticated
  using (
    exists (
      select 1 from public.drivers d
      where d.id = driver_id and d.user_id = auth.uid()
    )
  );

-- Subscriptions: own rows
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Invoices: own rows
drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
  on public.invoices for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Helper: next invoice number
create or replace function public.next_invoice_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.invoice_number_seq');
  return 'INV-' || lpad(n::text, 6, '0');
end;
$$;
