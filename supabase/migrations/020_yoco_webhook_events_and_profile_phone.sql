-- 020: YOCO webhook idempotency + optional profile phone for demos
-- Safe to re-run

create table if not exists public.yoco_webhook_events (
  webhook_id text primary key,
  event_type text,
  processed_at timestamptz not null default now()
);

alter table public.yoco_webhook_events enable row level security;

-- Service role writes from Express; no anon policies needed
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'yoco_webhook_events'
      and policyname = 'Admins read webhook events'
  ) then
    create policy "Admins read webhook events"
      on public.yoco_webhook_events
      for select
      using (public.is_admin());
  end if;
end $$;

alter table public.profiles
  add column if not exists phone text;

comment on table public.yoco_webhook_events is
  'Dedupes YOCO webhook deliveries by webhook-id header.';
