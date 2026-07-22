-- UNICAB Travel & Tours — Supabase Schema
-- Run this in the Supabase SQL Editor (safe to re-run)
-- Uses profiles.role for admin/driver/customer access (not user_roles)

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================
-- TOURS
-- =========================
create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  duration text,
  duration_hours numeric(4,2),
  image_url text,
  price_from text,
  price_zar numeric(10,2),
  max_people integer default 22,
  promotion text,
  highlights jsonb default '[]'::jsonb,
  pricing jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tours enable row level security;

-- =========================
-- PROFILES (roles)
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'driver', 'customer')),
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- =========================
-- DRIVERS
-- =========================
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  license_number text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.drivers enable row level security;

create unique index if not exists drivers_email_unique_idx
  on public.drivers (lower(email))
  where email is not null;

-- =========================
-- BOOKINGS
-- =========================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  tour_id uuid references public.tours(id) on delete set null,
  booking_date date not null default current_date,
  booking_time time,
  group_size integer default 1 check (group_size >= 1 and group_size <= 22),
  customer_name text,
  customer_email text,
  customer_phone text,
  special_requests text,
  price_per_person numeric(10,2),
  total_price numeric(10,2),
  status text not null default 'reserved'
    check (status in ('reserved','pending','confirmed','completed','cancelled')),
  payment_status text default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  payment_reference text,
  yoco_checkout_id text,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bookings enable row level security;

create index if not exists idx_bookings_booking_date on public.bookings(booking_date);
create index if not exists idx_bookings_driver_date on public.bookings(driver_id, booking_date);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_user_id on public.bookings(user_id);

-- =========================
-- DRIVER AVAILABILITY
-- =========================
create table if not exists public.driver_availability (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  date date not null,
  available boolean default true,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (driver_id, date)
);

alter table public.driver_availability enable row level security;

create index if not exists idx_driver_availability_date
  on public.driver_availability(driver_id, date);

-- =========================
-- REVIEWS
-- =========================
create table if not exists public.driver_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete cascade,
  driver_key text,
  booking_id uuid references public.bookings(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  reviewer_name text,
  approved boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.tour_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tour_id text not null,
  booking_id uuid references public.bookings(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  reviewer_name text,
  approved boolean default false,
  created_at timestamptz default now()
);

alter table public.driver_reviews enable row level security;
alter table public.tour_reviews enable row level security;

create index if not exists idx_driver_reviews_driver_id on public.driver_reviews(driver_id);
create index if not exists idx_driver_reviews_approved on public.driver_reviews(approved);
create index if not exists idx_tour_reviews_tour_id on public.tour_reviews(tour_id);
create index if not exists idx_tour_reviews_approved on public.tour_reviews(approved);

create unique index if not exists unique_driver_review_per_booking
  on public.driver_reviews (booking_id)
  where booking_id is not null;

create unique index if not exists unique_tour_review_per_booking
  on public.tour_reviews (booking_id)
  where booking_id is not null;

-- =========================
-- HELPER FUNCTIONS
-- =========================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, full_name)
  values (
    new.id,
    'customer',
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', null)
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

create or replace function public.set_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_driver_availability_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_driver_available(driver_uuid uuid, check_date date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return coalesce(
    (
      select available
      from public.driver_availability
      where driver_id = driver_uuid and date = check_date
      limit 1
    ),
    true
  );
end;
$$;

-- =========================
-- TRIGGERS
-- =========================
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_bookings_updated_at();

drop trigger if exists trg_driver_availability_updated_at on public.driver_availability;
create trigger trg_driver_availability_updated_at
before update on public.driver_availability
for each row execute function public.set_driver_availability_updated_at();

-- =========================
-- RLS POLICIES (idempotent)
-- =========================
do $$
begin
  -- profiles
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can read own profile') then
    create policy "Users can read own profile" on public.profiles for select using (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users read own profile') then
    create policy "Users read own profile" on public.profiles for select using (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users update own profile') then
    create policy "Users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Admins can update profiles') then
    create policy "Admins can update profiles" on public.profiles for update using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Admins update profiles') then
    create policy "Admins update profiles" on public.profiles for update using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Admins read all profiles') then
    create policy "Admins read all profiles" on public.profiles for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Drivers read assigned customer profiles') then
    create policy "Drivers read assigned customer profiles" on public.profiles for select using (
      exists (
        select 1 from public.bookings b
        inner join public.drivers d on d.id = b.driver_id
        where b.user_id = profiles.id and d.user_id = auth.uid()
      )
    );
  end if;

  -- drivers
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='drivers' and policyname='Drivers read own record') then
    create policy "Drivers read own record" on public.drivers for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='drivers' and policyname='Admins manage drivers') then
    create policy "Admins manage drivers" on public.drivers for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- bookings
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='Users read own bookings') then
    create policy "Users read own bookings" on public.bookings for select using (user_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='Users create bookings') then
    create policy "Users create bookings" on public.bookings for insert with check (
      user_id = auth.uid()
      and exists (select 1 from public.profiles where id = auth.uid() and role in ('customer','admin'))
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='Drivers read assigned bookings') then
    create policy "Drivers read assigned bookings" on public.bookings for select using (
      driver_id in (select id from public.drivers where user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='Drivers update assigned bookings') then
    create policy "Drivers update assigned bookings" on public.bookings for update using (
      driver_id in (select id from public.drivers where user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='Admins manage bookings') then
    create policy "Admins manage bookings" on public.bookings for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- driver_availability
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='driver_availability' and policyname='Drivers manage own availability') then
    create policy "Drivers manage own availability" on public.driver_availability for all using (
      driver_id in (select id from public.drivers where user_id = auth.uid())
    ) with check (
      driver_id in (select id from public.drivers where user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='driver_availability' and policyname='Admins manage all availability') then
    create policy "Admins manage all availability" on public.driver_availability for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- tours (public read)
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tours' and policyname='Tours are viewable by everyone') then
    create policy "Tours are viewable by everyone" on public.tours for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tours' and policyname='Admins manage tours') then
    create policy "Admins manage tours" on public.tours for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- driver_reviews
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='driver_reviews' and policyname='Users insert own driver review') then
    create policy "Users insert own driver review" on public.driver_reviews for insert with check (
      auth.uid() = user_id
      and (
        booking_id is null
        or exists (select 1 from public.bookings where id = booking_id and user_id = auth.uid())
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='driver_reviews' and policyname='Public read approved driver reviews') then
    create policy "Public read approved driver reviews" on public.driver_reviews for select using (approved = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='driver_reviews' and policyname='Admins manage driver reviews') then
    create policy "Admins manage driver reviews" on public.driver_reviews for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- tour_reviews
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tour_reviews' and policyname='Users insert own tour review') then
    create policy "Users insert own tour review" on public.tour_reviews for insert with check (
      auth.uid() = user_id
      and (
        booking_id is null
        or exists (select 1 from public.bookings where id = booking_id and user_id = auth.uid())
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tour_reviews' and policyname='Public read approved tour reviews') then
    create policy "Public read approved tour reviews" on public.tour_reviews for select using (approved = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tour_reviews' and policyname='Admins manage tour reviews') then
    create policy "Admins manage tour reviews" on public.tour_reviews for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Available drivers for booking flow
create or replace function public.get_available_drivers(check_date date)
returns setof public.drivers
language sql
security definer
set search_path = public
as $$
  select d.*
  from public.drivers d
  where d.active = true
    and not exists (
      select 1 from public.bookings b
      where b.driver_id = d.id
        and b.booking_date = check_date
        and b.status in ('reserved', 'pending', 'confirmed')
    )
    and coalesce(
      (
        select da.available
        from public.driver_availability da
        where da.driver_id = d.id
          and da.date = check_date
        limit 1
      ),
      true
    ) = true
  order by d.name;
$$;

grant execute on function public.get_available_drivers(date) to anon, authenticated;

-- =========================
-- SEED ROLES (optional — skipped if users do not exist)
-- Update UUIDs to match your auth.users after signup
-- =========================
do $$
declare
  v_admin_id uuid := '00e486a2-9122-4314-9070-043e0f53fc03';
  v_driver_id uuid := 'd4d4527d-cbba-44f6-93bc-62c99ef44f2e';
begin
  insert into public.profiles (id, role, email, full_name)
  select u.id, 'admin', u.email, coalesce(u.raw_user_meta_data->>'full_name', 'Admin')
  from auth.users u where u.id = v_admin_id
  on conflict (id) do update set role = 'admin';

  insert into public.profiles (id, role, email, full_name)
  select u.id, 'driver', u.email, coalesce(u.raw_user_meta_data->>'full_name', 'Yaseen Jacobs')
  from auth.users u where u.id = v_driver_id
  on conflict (id) do update set role = 'driver';

  insert into public.drivers (user_id, name, email, phone, license_number, active)
  select u.id, 'Yaseen Jacobs', u.email, '+27823277446', '600100150F46', true
  from auth.users u where u.id = v_driver_id
  on conflict (user_id) do update set
    name = excluded.name,
    email = coalesce(excluded.email, public.drivers.email),
    phone = excluded.phone,
    license_number = excluded.license_number,
    active = true;
end $$;
