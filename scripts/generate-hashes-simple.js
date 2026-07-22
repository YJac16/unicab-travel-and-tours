// Simple script to generate bcrypt hashes using bcryptjs (pure JS, no compilation needed)
// Run: node scripts/generate-hashes-simple.js

const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('\n=== Generating Password Hashes ===\n');

  const users = [
    { email: 'admin@unicabtravel.co.za', password: 'Admin123!', role: 'ADMIN', name: 'Admin User' },
    { email: 'driver@unicabtravel.co.za', password: 'Driver123!', role: 'DRIVER', name: 'Driver User' },
    { email: 'member@unicabtravel.co.za', password: 'Member123!', role: 'MEMBER', name: 'Member User' }
  ];

  console.log('Test Credentials:\n');
  for (const user of users) {
    console.log(`${user.role}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log('');
  }

  console.log('\n=== Generating Hashes (this may take a moment)... ===\n');

  const hashes = {};
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    hashes[user.role] = hash;
    console.log(`${user.role} hash: ${hash}`);
  }

  console.log('\n=== Complete SQL (Copy and Paste) ===\n');
  console.log('-- Test Users SQL');
  console.log('-- Run this in your database\n');

  for (const user of users) {
    const hash = hashes[user.role];
    if (user.role === 'DRIVER') {
      console.log(`-- ${user.role} User`);
      console.log(`-- Email: ${user.email}`);
      console.log(`-- Password: ${user.password}`);
      console.log(`INSERT INTO users (name, email, password_hash, role, active, driver_id)`);
      console.log(`VALUES (`);
      console.log(`  '${user.name}',`);
      console.log(`  '${user.email}',`);
      console.log(`  '${hash}',`);
      console.log(`  '${user.role}',`);
      console.log(`  true,`);
      console.log(`  NULL`);
      console.log(`)`);
      console.log(`ON CONFLICT (email) DO UPDATE SET`);
      console.log(`  password_hash = EXCLUDED.password_hash,`);
      console.log(`  role = '${user.role}',`);
      console.log(`  active = true;`);
      console.log('');
    } else {
      console.log(`-- ${user.role} User`);
      console.log(`-- Email: ${user.email}`);
      console.log(`-- Password: ${user.password}`);
      console.log(`INSERT INTO users (name, email, password_hash, role, active)`);
      console.log(`VALUES (`);
      console.log(`  '${user.name}',`);
      console.log(`  '${user.email}',`);
      console.log(`  '${hash}',`);
      console.log(`  '${user.role}',`);
      console.log(`  true`);
      console.log(`)`);
      console.log(`ON CONFLICT (email) DO UPDATE SET`);
      console.log(`  password_hash = EXCLUDED.password_hash,`);
      console.log(`  role = '${user.role}',`);
      console.log(`  active = true;`);
      console.log('');
    }
  }

  console.log('\n=== Summary ===\n');
  console.log('Test Credentials:');
  console.log('Admin:   admin@unicabtravel.co.za / Admin123!');
  console.log('Driver:  driver@unicabtravel.co.za / Driver123!');
  console.log('Member:  member@unicabtravel.co.za / Member123!');
  console.log('\n');
}

generateHashes().catch(console.error);







