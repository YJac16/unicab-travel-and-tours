-- =========================
-- 003_admin_helpers
-- Safe to re-run (idempotent)
-- =========================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Admins update profiles'
  ) then
    create policy "Admins update profiles"
    on public.profiles
    for update
    using (public.is_admin());
  end if;
end $$;
