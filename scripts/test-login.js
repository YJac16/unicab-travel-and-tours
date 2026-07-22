// Test login diagnostic script
// Run: node scripts/test-login.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

async function testLogin() {
  console.log('\n=== Login Diagnostic Test ===\n');
  
  // 1. Check database connection
  console.log('1. Checking database connection...');
  if (!db.isConfigured()) {
    console.error('❌ Database not configured!');
    console.log('   Check your .env file has:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  console.log(`✅ Database configured: ${db.dbType}\n`);
  
  // 2. Test querying users table
  console.log('2. Testing database query...');
  try {
    const testEmail = 'admin@unicabtravel.co.za';
    const result = await db.getUserByEmail(testEmail);
    
    if (!result || result.rows.length === 0) {
      console.error(`❌ User not found: ${testEmail}`);
      console.log('\n   Possible issues:');
      console.log('   - Users table does not exist');
      console.log('   - Migration 002_auth_and_unavailability.sql not run');
      console.log('   - Migration 005_create_test_users.sql not run');
      console.log('   - Email mismatch (check case sensitivity)');
      return;
    }
    
    console.log(`✅ User found: ${result.rows[0].email}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log(`   Active: ${result.rows[0].active}`);
    console.log(`   Has password_hash: ${!!result.rows[0].password_hash}\n`);
    
    // 3. Test password verification
    console.log('3. Testing password verification...');
    const testPassword = 'Admin123!';
    const passwordHash = result.rows[0].password_hash;
    
    if (!passwordHash) {
      console.error('❌ No password hash found for user!');
      return;
    }
    
    const passwordMatch = await bcrypt.compare(testPassword, passwordHash);
    
    if (passwordMatch) {
      console.log('✅ Password verification successful!\n');
    } else {
      console.error('❌ Password verification failed!');
      console.log('\n   Possible issues:');
      console.log('   - Password hash in database is incorrect');
      console.log('   - Password hash was generated with different bcrypt version');
      console.log('   - Migration 005 used wrong password hashes');
      console.log('\n   Solution:');
      console.log('   1. Generate new password hash:');
      console.log('      node -e "const bcrypt = require(\'bcryptjs\'); bcrypt.hash(\'Admin123!\', 10).then(h => console.log(h));"');
      console.log('   2. Update the hash in Supabase SQL Editor:');
      console.log('      UPDATE users SET password_hash = \'<new_hash>\' WHERE email = \'admin@unicabtravel.co.za\';');
    }
    
    // 4. List all users
    console.log('\n4. Checking all users in database...');
    try {
      const { supabase } = db;
      if (supabase) {
        const { data: allUsers, error } = await supabase
          .from('users')
          .select('email, name, role, active')
          .order('email');
        
        if (error) {
          console.error('❌ Error querying users:', error.message);
        } else {
          console.log(`✅ Found ${allUsers.length} user(s):`);
          allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.role}) - Active: ${user.active}`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error listing users:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('   Full error:', error);
    console.log('\n   Possible issues:');
    console.log('   - Users table does not exist');
    console.log('   - RLS (Row Level Security) is blocking access');
    console.log('   - Service role key is incorrect');
    console.log('   - Supabase URL is incorrect');
  }
  
  console.log('\n=== Test Complete ===\n');
}

testLogin().catch(console.error);











