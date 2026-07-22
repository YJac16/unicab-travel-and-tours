// Script to generate password hashes for test users
// Run: node scripts/generate-password-hashes.js

const bcrypt = require('bcrypt');

async function generateHashes() {
  console.log('\n=== Generating Password Hashes for Test Users ===\n');

  const users = [
    { email: 'admin@unicabtravel.co.za', password: 'Admin123!', role: 'ADMIN', name: 'Admin User' },
    { email: 'driver@unicabtravel.co.za', password: 'Driver123!', role: 'DRIVER', name: 'Driver User' },
    { email: 'member@unicabtravel.co.za', password: 'Member123!', role: 'MEMBER', name: 'Member User' }
  ];

  console.log('Generating hashes...\n');

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Hash: ${hash}`);
    console.log(`Role: ${user.role}`);
    console.log('---\n');
  }

  console.log('\n=== SQL INSERT Statements ===\n');
  console.log('Copy and paste this SQL into your database:\n');

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    const sql = `INSERT INTO users (name, email, password_hash, role, active)
VALUES (
  '${user.name}',
  '${user.email}',
  '${hash}',
  '${user.role}',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  active = true;

`;
    console.log(sql);
  }

  console.log('\n=== Test Credentials Summary ===\n');
  console.log('Admin:');
  console.log('  Email: admin@unicabtravel.co.za');
  console.log('  Password: Admin123!');
  console.log('\nDriver:');
  console.log('  Email: driver@unicabtravel.co.za');
  console.log('  Password: Driver123!');
  console.log('\nMember:');
  console.log('  Email: member@unicabtravel.co.za');
  console.log('  Password: Member123!');
  console.log('\n');
}

generateHashes().catch(console.error);







