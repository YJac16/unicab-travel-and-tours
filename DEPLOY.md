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

## Supabase
Run migration `supabase/migrations/015_hubs_fleet_tracking_invoices.sql` in the SQL editor.
