// Script to create admin user
// Run: node scripts/create-admin.js

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  console.log('\n=== Create Admin User ===\n');
  
  rl.question('Enter admin email (default: admin@unicabtravel.co.za): ', async (email) => {
    email = email || 'admin@unicabtravel.co.za';
    
    rl.question('Enter admin password: ', async (password) => {
      if (!password) {
        console.error('Password is required!');
        rl.close();
        return;
      }
      
      rl.question('Enter admin name (default: Admin User): ', async (name) => {
        name = name || 'Admin User';
        
        try {
          // Hash password
          const passwordHash = await bcrypt.hash(password, 10);
          
          // Generate SQL
          const sql = `
-- Admin User SQL
-- Email: ${email}
-- Password: ${password} (hashed below)
-- Name: ${name}

INSERT INTO users (name, email, password_hash, role, active)
VALUES (
  '${name}',
  '${email.toLowerCase().trim()}',
  '${passwordHash}',
  'ADMIN',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'ADMIN',
  active = true;
          `;
          
          console.log('\n=== SQL Query ===\n');
          console.log(sql);
          console.log('\n=== Copy the SQL above and run it in your database ===\n');
          console.log('Login Details:');
          console.log(`Email: ${email}`);
          console.log(`Password: ${password}`);
          console.log('\n');
          
        } catch (error) {
          console.error('Error:', error.message);
        }
        
        rl.close();
      });
    });
  });
}

createAdmin();







