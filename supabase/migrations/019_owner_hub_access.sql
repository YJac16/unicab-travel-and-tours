-- Owner hub inspection: is_owner flag on profiles
-- Safe to re-run

alter table public.profiles
  add column if not exists is_owner boolean not null default false;

comment on column public.profiles.is_owner is
  'When true, user may switch Admin/Driver/Member hubs for inspection; canonical role stays admin.';
