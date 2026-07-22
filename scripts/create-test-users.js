// Quick script to create test users SQL
// This provides the SQL without needing bcrypt installed

console.log(`
=== Test Users SQL ===
Copy and paste this into your database after generating password hashes.

To generate password hashes, use one of these methods:

1. Online: https://bcrypt-generator.com/
   - Enter password, rounds: 10, click "Generate"
   - Copy the hash

2. Node.js (if bcrypt is installed):
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin123!', 10).then(h => console.log(h));"

3. Use the generate-password-hashes.js script:
   npm install bcrypt
   node scripts/generate-password-hashes.js

=== Test Credentials ===

Admin:
  Email: admin@unicabtravel.co.za
  Password: Admin123!

Driver:
  Email: driver@unicabtravel.co.za
  Password: Driver123!

Member:
  Email: member@unicabtravel.co.za
  Password: Member123!

=== SQL Template ===

Replace <HASH_ADMIN>, <HASH_DRIVER>, <HASH_MEMBER> with actual bcrypt hashes:

-- Admin User
INSERT INTO users (name, email, password_hash, role, active)
VALUES (
  'Admin User',
  'admin@unicabtravel.co.za',
  '<HASH_ADMIN>',
  'ADMIN',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'ADMIN',
  active = true;

-- Driver User
INSERT INTO users (name, email, password_hash, role, active, driver_id)
VALUES (
  'Driver User',
  'driver@unicabtravel.co.za',
  '<HASH_DRIVER>',
  'DRIVER',
  true,
  NULL
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'DRIVER',
  active = true;

-- Member User
INSERT INTO users (name, email, password_hash, role, active)
VALUES (
  'Member User',
  'member@unicabtravel.co.za',
  '<HASH_MEMBER>',
  'MEMBER',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'MEMBER',
  active = true;

`);







