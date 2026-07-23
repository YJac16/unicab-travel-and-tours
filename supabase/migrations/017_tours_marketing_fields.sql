-- Optional: extend tours for marketing fields used by the public site.
-- Safe to re-run.

alter table if exists public.tours
  add column if not exists slug text,
  add column if not exists image_url text,
  add column if not exists short_description text,
  add column if not exists highlights jsonb default '[]'::jsonb,
  add column if not exists pricing jsonb;

create unique index if not exists tours_slug_unique
  on public.tours (slug)
  where slug is not null;
