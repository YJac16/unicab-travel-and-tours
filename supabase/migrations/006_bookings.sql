-- =========================
-- 006_bookings
-- Safe to re-run (idempotent)
-- =========================

alter table public.bookings enable row level security;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'user_id'
  ) then
    alter table public.bookings
    add column user_id uuid references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'driver_id'
  ) then
    alter table public.bookings
    add column driver_id uuid references public.drivers(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'booking_date'
  ) then
    alter table public.bookings
    add column booking_date date not null default current_date;
  end if;
end $$;

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
add constraint bookings_status_check
check (status in ('reserved','pending','confirmed','completed','cancelled'));

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='Users read own bookings') then
    create policy "Users read own bookings" on public.bookings for select
    using (user_id = auth.uid() or public.is_admin());
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
    create policy "Admins manage bookings" on public.bookings for all
    using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;
