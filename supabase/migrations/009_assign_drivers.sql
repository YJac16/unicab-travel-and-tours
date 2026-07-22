-- =========================
-- 009_assign_drivers
-- Promote seed users to admin/driver (only if they exist in auth.users)
-- Safe to re-run (idempotent)
-- =========================

-- Replace these UUIDs with your Supabase auth.users ids after creating accounts
-- Inserts are skipped automatically when the user does not exist yet

do $$
declare
  v_admin_id uuid := '00e486a2-9122-4314-9070-043e0f53fc03';
  v_driver_id uuid := 'd4d4527d-cbba-44f6-93bc-62c99ef44f2e';
begin
  -- Admin role
  insert into public.profiles (id, role, email, full_name)
  select
    u.id,
    'admin',
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Admin')
  from auth.users u
  where u.id = v_admin_id
  on conflict (id) do update
  set
    role = 'admin',
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  -- Driver role
  insert into public.profiles (id, role, email, full_name)
  select
    u.id,
    'driver',
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', 'Yaseen Jacobs')
  from auth.users u
  where u.id = v_driver_id
  on conflict (id) do update
  set
    role = 'driver',
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  -- Driver record (requires 004_drivers migration)
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'drivers'
  ) then
    insert into public.drivers (user_id, name, phone, license_number, active)
    select
      u.id,
      coalesce(u.raw_user_meta_data->>'full_name', 'Yaseen Jacobs'),
      '+27823277446',
      '600100150F46',
      true
    from auth.users u
    where u.id = v_driver_id
    on conflict (user_id) do update
    set
      name = excluded.name,
      phone = excluded.phone,
      license_number = excluded.license_number,
      active = true;

    -- Sync email column when present (added in 012_schema_alignment)
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'drivers'
        and column_name = 'email'
    ) then
      update public.drivers d
      set email = u.email
      from auth.users u
      where d.user_id = u.id
        and u.id = v_driver_id
        and (d.email is null or d.email = '');
    end if;
  end if;
end $$;

-- Verification (returns rows only when users exist)
select
  u.id,
  u.email,
  p.role,
  d.name as driver_name,
  d.active as driver_active
from auth.users u
left join public.profiles p on p.id = u.id
left join public.drivers d on d.user_id = u.id
where u.id in (
  '00e486a2-9122-4314-9070-043e0f53fc03',
  'd4d4527d-cbba-44f6-93bc-62c99ef44f2e'
);
