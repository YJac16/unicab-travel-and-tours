-- =========================
-- 012_schema_alignment
-- Align schema with application code for admin/driver control
-- =========================

-- Profiles: add columns used by admin API and dashboards
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists avatar_url text;

-- Drivers: email used by admin driver management
alter table public.drivers
  add column if not exists email text;

create unique index if not exists drivers_email_unique_idx
  on public.drivers (lower(email))
  where email is not null;

-- Bookings: customer and pricing fields used by checkout flow
alter table public.bookings
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists special_requests text,
  add column if not exists price_per_person numeric(10, 2),
  add column if not exists total_price numeric(10, 2);

-- Point bookings.user_id at profiles so PostgREST can embed customer profile
insert into public.profiles (id, role, email)
select distinct b.user_id, 'customer', u.email
from public.bookings b
inner join auth.users u on u.id = b.user_id
where b.user_id is not null
on conflict (id) do nothing;

alter table public.bookings drop constraint if exists bookings_user_id_fkey;

alter table public.bookings
  add constraint bookings_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

-- Auto-create profile with email/name on signup
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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- RLS: users can update their own profile
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users update own profile'
  ) then
    create policy "Users update own profile"
    on public.profiles
    for update
    using (id = auth.uid())
    with check (id = auth.uid());
  end if;
end $$;

-- RLS: admins can read all profiles (needed for booking customer joins)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Admins read all profiles'
  ) then
    create policy "Admins read all profiles"
    on public.profiles
    for select
    using (public.is_admin());
  end if;
end $$;

-- RLS: drivers can read customer profiles on their assigned bookings
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Drivers read assigned customer profiles'
  ) then
    create policy "Drivers read assigned customer profiles"
    on public.profiles
    for select
    using (
      exists (
        select 1
        from public.bookings b
        inner join public.drivers d on d.id = b.driver_id
        where b.user_id = profiles.id
          and d.user_id = auth.uid()
      )
    );
  end if;
end $$;
