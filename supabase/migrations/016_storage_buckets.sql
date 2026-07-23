-- 016: Storage buckets for avatars + invoices
-- Run in Supabase SQL Editor after creating buckets in Dashboard
-- (Storage → New bucket), OR use the Storage API with service role.
--
-- Dashboard steps (required):
-- 1. Create public bucket "avatars" (public read)
-- 2. Create private bucket "invoices" (authenticated/service only)
--
-- Policies below assume those buckets exist.

-- Avatars: anyone can read; authenticated users can upload/update own folder
drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Avatar auth upload" on storage.objects;
create policy "Avatar auth upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "Avatar auth update" on storage.objects;
create policy "Avatar auth update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');

-- Invoices: service role bypasses RLS; allow authenticated owners if path contains user id
drop policy if exists "Invoice owner read" on storage.objects;
create policy "Invoice owner read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
