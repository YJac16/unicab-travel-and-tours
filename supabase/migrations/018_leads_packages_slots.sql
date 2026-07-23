-- Phase 3–4: leads CRM, package SKUs, morning/afternoon slot helper, review invites

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'contact',
  name text not null,
  email text not null,
  phone text,
  message text,
  package_id text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status, created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));

alter table public.leads enable row level security;

drop policy if exists "admins manage leads" on public.leads;
create policy "admins manage leads"
  on public.leads for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and lower(p.role) = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and lower(p.role) = 'admin'
    )
  );

-- Package catalogue (bookable or quote)
create table if not exists public.packages (
  id text primary key,
  name text not null,
  summary text,
  from_price_zar numeric(10, 2),
  tour_id uuid references public.tours (id) on delete set null,
  bookable boolean not null default true,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.packages enable row level security;

drop policy if exists "public read active packages" on public.packages;
create policy "public read active packages"
  on public.packages for select
  using (active = true);

drop policy if exists "admins manage packages" on public.packages;
create policy "admins manage packages"
  on public.packages for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and lower(p.role) = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and lower(p.role) = 'admin'
    )
  );

insert into public.packages (id, name, summary, from_price_zar, bookable, sort_order)
values
  (
    'cape-highlights',
    'Cape Highlights Day',
    'Table Mountain, Cape Point & Boulders in one curated private day.',
    4500,
    true,
    1
  ),
  (
    'wine-and-coast',
    'Wine & Coast Escape',
    'Stellenbosch tasting circuit with scenic coastal transfer.',
    3800,
    true,
    2
  ),
  (
    'corporate-delegate',
    'Corporate Delegate',
    'Airport meet & greet, hotel runs, and confidential chauffeur cover.',
    null,
    false,
    3
  )
on conflict (id) do update set
  name = excluded.name,
  summary = excluded.summary,
  from_price_zar = excluded.from_price_zar,
  bookable = excluded.bookable,
  sort_order = excluded.sort_order;

-- Slot preference on bookings (morning | afternoon | full_day)
alter table public.bookings
  add column if not exists time_slot text
    check (time_slot is null or time_slot in ('morning', 'afternoon', 'full_day'));

alter table public.bookings
  add column if not exists package_id text;

alter table public.bookings
  add column if not exists review_invite_sent_at timestamptz;

alter table public.bookings
  add column if not exists cancelled_at timestamptz;

alter table public.bookings
  add column if not exists cancel_reason text;

comment on column public.bookings.time_slot is
  'Inventory slot: morning/afternoon allow two paid bookings per driver/day; full_day blocks the day';
