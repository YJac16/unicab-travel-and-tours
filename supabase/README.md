# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name:** unicab-travel-tours
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to your users
5. Wait for project to be created (2-3 minutes)

## 2. Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql`
3. Copy and paste the entire contents
4. Click **Run** (or press Ctrl+Enter)
5. Verify tables are created in **Table Editor**

## 3. Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (keep this secret!)

## 4. Set Environment Variables

Create a `.env` file in the project root:

```env
# Project root ONLY — do NOT append /rest/v1
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Wrong:** `https://xxxx.supabase.co/rest/v1` (causes `/rest/v1/rest/v1/...` 404s)  
**Right:** `https://xxxx.supabase.co`

**Production (Railway):** set the same values in the service variables, then **redeploy / rebuild**. Vite bakes `VITE_` vars at build time — changing them without a rebuild will leave the old URL in the live JS bundle.

Server bookings/payments also need `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → `service_role`). Without it, `/api/bookings` returns 501 "Supabase not configured".

If `VITE_SUPABASE_URL` points at a deleted project, the browser shows `net::ERR_NAME_NOT_RESOLVED`. The site falls back to local tour/driver data, but login, bookings, and cloud reviews need a live project.

## 5. Seed Initial Data (Optional)

Run this in SQL Editor to add sample data:

```sql
-- Insert sample vehicles
INSERT INTO vehicles (name, type, capacity, features) VALUES
('Luxury Sedan', 'sedan', 4, '["Wi-Fi", "Air Conditioning", "Leather Seats"]'),
('Premium SUV', 'suv', 7, '["Wi-Fi", "Air Conditioning", "Third Row Seats"]'),
('Premium Minivan', 'minivan', 8, '["Wi-Fi", "Air Conditioning", "Luggage Space"]'),
('Mini Coach 14', 'minicoach', 14, '["Wi-Fi", "PA System", "Luggage Compartment"]'),
('Mini Coach 22', 'minicoach', 22, '["Wi-Fi", "PA System", "Luggage Compartment"]');

-- Insert sample tours (use your existing tour data)
-- See supabase/seed-data.sql for full seed script
```

## 6. Create First Admin User

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter admin email and password
4. After user is created, run in SQL Editor:

```sql
-- Replace 'admin@unicabtravel.co.za' with your admin email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@unicabtravel.co.za';
```

## 7. Create Driver Users

1. Create users in **Authentication** → **Users**
2. Link them to drivers:

```sql
-- First, insert driver record
INSERT INTO drivers (name, email, phone, experience, languages, skills, vehicle_id)
VALUES (
  'Thabo M.',
  'thabo@unicabtravel.co.za',
  '+27123456789',
  '12 years with UNICAB',
  ARRAY['English', 'isiXhosa', 'Afrikaans'],
  ARRAY['City & Peninsula specialist', 'South African History'],
  (SELECT id FROM vehicles WHERE type = 'sedan' LIMIT 1)
);

-- Then link to user account
UPDATE drivers
SET user_id = (SELECT id FROM auth.users WHERE email = 'thabo@unicabtravel.co.za')
WHERE email = 'thabo@unicabtravel.co.za';

-- Assign driver role
INSERT INTO user_roles (user_id, role)
SELECT id, 'driver'
FROM auth.users
WHERE email = 'thabo@unicabtravel.co.za';
```

## 8. Test Connection

The app will automatically connect when you start it with the environment variables set.

## Security Notes

- **Never commit** `.env` file to git
- **Never expose** service_role key in frontend code
- Use **RLS policies** for all data access
- Regularly **audit** user roles and permissions










