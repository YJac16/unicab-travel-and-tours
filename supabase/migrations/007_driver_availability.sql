-- =========================
-- 007_driver_availability
-- Safe to re-run (idempotent)
-- =========================

create table if not exists public.driver_availability (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete cascade not null,
  date date not null,
  available boolean default true,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (driver_id, date)
);

alter table public.driver_availability enable row level security;

create or replace function public.set_driver_availability_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_driver_availability_updated_at on public.driver_availability;

create trigger trg_driver_availability_updated_at
before update on public.driver_availability
for each row
execute function public.set_driver_availability_updated_at();

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='driver_availability' and policyname='Drivers manage own availability') then
    create policy "Drivers manage own availability" on public.driver_availability for all
    using (driver_id in (select id from public.drivers where user_id = auth.uid()))
    with check (driver_id in (select id from public.drivers where user_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='driver_availability' and policyname='Admins manage all availability') then
    create policy "Admins manage all availability" on public.driver_availability for all
    using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

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
