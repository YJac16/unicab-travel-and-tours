-- =========================
-- 004_drivers
-- Safe to re-run (idempotent)
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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'drivers' and policyname = 'Drivers read own record'
  ) then
    create policy "Drivers read own record"
    on public.drivers
    for select
    using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'drivers' and policyname = 'Admins manage drivers'
  ) then
    create policy "Admins manage drivers"
    on public.drivers
    for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end $$;
