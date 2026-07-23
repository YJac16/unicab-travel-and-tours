# Deploy notes (Vercel-only)

## Vercel (frontend + API)

- Project: unicab-travel-and-tours
- Domains: unicabtraveltours.com / www.unicabtraveltours.com
- DNS (GoDaddy): A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`
- API runs on the same Vercel project via Express catch-all [`api/[[...path]].js`](api/[[...path]].js) (shared app in [`server/createApp.js`](server/createApp.js))
- Do **not** set `VITE_API_URL` — the client uses same-origin `/api/...`

### Required Production env

| Name | Notes |
|------|--------|
| `VITE_SUPABASE_URL` | Live project root, e.g. `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (or existing `SERVICE_ROLE_SECRET` alias) |
| `YOCO_SECRET_KEY` or `YOCO_LIVE_SECRET_KEY` | Checkout |
| `BASE_URL` | `https://www.unicabtraveltours.com` |
| `JWT_SECRET` | Legacy JWT auth fallback |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Contact form |

After changing `VITE_*` vars, redeploy so Vite rebuilds the client bundle.

Local API: `npm run build && node server.js` (or Vite proxy → Express on port 3000).

## Hub test users

```bash
node scripts/ensure-hub-test-users.js
```

| Role | Email | Password | Hub |
|------|--------|----------|-----|
| Admin | admin@unicabtravel.co.za | Admin123! | /admin/dashboard |
| Driver | driver@unicabtravel.co.za | Driver123! | /driver/dashboard |
| Client | member@unicabtravel.co.za | Member123! | /member/dashboard |

Sign in at https://www.unicabtraveltours.com/login

### Manual fallback (when script cannot reach Supabase)

If `SUPABASE_URL` DNS fails (`ENOTFOUND`) or Auth API errors:

1. Fix Project URL in `.env` / Vercel (`VITE_SUPABASE_URL`, `SUPABASE_URL`) to a live project, then re-run the script.
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
