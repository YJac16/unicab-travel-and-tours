-- =========================
-- 005_CREATE_BOOKINGS
-- =========================

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  tour_id uuid references public.tours(id) on delete set null,

  booking_date date not null,
  group_size integer default 1,

  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled')),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.bookings enable row level security;

-- Updated_at trigger function
create or replace function public.set_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop old trigger if exists
drop trigger if exists trg_bookings_updated_at on public.bookings;

-- Create trigger
create trigger trg_bookings_updated_at
before update on public.bookings
for each row
execute function public.set_bookings_updated_at();

