-- =========================
-- 014_reviews_and_drivers_rpc
-- Support slug-based reviews + available drivers helper
-- =========================

-- Tour reviews: allow local tour slugs (text ids), not only UUIDs
alter table public.tour_reviews drop constraint if exists tour_reviews_tour_id_fkey;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tour_reviews' and column_name = 'tour_id'
      and data_type = 'uuid'
  ) then
    alter table public.tour_reviews
      alter column tour_id type text using tour_id::text;
  end if;
end $$;

alter table public.tour_reviews
  add column if not exists reviewer_name text;

-- Driver reviews: optional key for local drivers without UUID
alter table public.driver_reviews drop constraint if exists driver_reviews_driver_id_fkey;

alter table public.driver_reviews
  alter column driver_id drop not null;

alter table public.driver_reviews
  add column if not exists driver_key text,
  add column if not exists reviewer_name text;

create index if not exists idx_tour_reviews_tour_id_text on public.tour_reviews (tour_id);
create index if not exists idx_driver_reviews_driver_key on public.driver_reviews (driver_key);

-- Soften insert policies: allow authenticated reviews without a booking row
drop policy if exists "Users insert own tour review" on public.tour_reviews;
create policy "Users insert own tour review"
on public.tour_reviews
for insert
with check (
  auth.uid() = user_id
  and (
    booking_id is null
    or exists (
      select 1 from public.bookings
      where bookings.id = booking_id
        and bookings.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users insert own driver review" on public.driver_reviews;
create policy "Users insert own driver review"
on public.driver_reviews
for insert
with check (
  auth.uid() = user_id
  and (
    booking_id is null
    or exists (
      select 1 from public.bookings
      where bookings.id = booking_id
        and bookings.user_id = auth.uid()
    )
  )
);

-- Available drivers RPC used by booking flow
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
