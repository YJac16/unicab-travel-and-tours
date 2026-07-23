# API + domain deploy notes

## Vercel (frontend)
- Project: unicab-travel-and-tours
- Domains: unicabtraveltours.com / www.unicabtraveltours.com (already on the Vercel team)
- DNS (GoDaddy): set A record `@` → `76.76.21.21` and CNAME `www` → `cname.vercel-dns.com`
- Then assign the domain to this project in Vercel → Project → Settings → Domains

## Express API (Railway or Render)
1. Create a new service from this repo
2. Start command: `node server.js`
3. Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `YOCO_SECRET_KEY`, `NODE_ENV=production`
4. Copy the public API URL into Vercel env `VITE_API_URL` (Production + Preview) and redeploy the frontend

## Hub test users

Run when Supabase is reachable:

```bash
node scripts/ensure-hub-test-users.js
```

Default credentials (created/updated by the script):

| Role | Email | Password | Hub |
|------|--------|----------|-----|
| Admin | admin@unicabtravel.co.za | Admin123! | /admin/dashboard |
| Driver | driver@unicabtravel.co.za | Driver123! | /driver/dashboard |
| Client | member@unicabtravel.co.za | Member123! | /member/dashboard |

Sign in at `/login` (https://www.unicabtraveltours.com/login).

### Manual fallback (when script cannot reach Supabase)

If `SUPABASE_URL` DNS fails (`ENOTFOUND`) or Auth API errors:

1. Fix Project URL in `.env` / Vercel (`VITE_SUPABASE_URL`, `SUPABASE_URL`) to a live project: `https://YOUR_REF.supabase.co` (no `/rest/v1`), then re-run the script.
2. Or create users in **Supabase Dashboard → Authentication → Users → Add user** with the emails/passwords above (confirm email).
3. In SQL Editor, upsert roles (replace UUIDs with each Auth user id):

```sql
insert into profiles (id, email, full_name, role)
values
  ('ADMIN_USER_UUID', 'admin@unicabtravel.co.za', 'Admin User', 'admin'),
  ('DRIVER_USER_UUID', 'driver@unicabtravel.co.za', 'Driver User', 'driver'),
  ('MEMBER_USER_UUID', 'member@unicabtravel.co.za', 'Member User', 'customer')
on conflict (id) do update
set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

insert into drivers (user_id, name, email, phone, active)
select 'DRIVER_USER_UUID', 'Driver User', 'driver@unicabtravel.co.za', '+27810000000', true
where not exists (select 1 from drivers where user_id = 'DRIVER_USER_UUID');
```
