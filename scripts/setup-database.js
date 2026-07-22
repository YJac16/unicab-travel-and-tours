// Interactive database setup script
// Run: node scripts/setup-database.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('\n=== Database Setup for UNICAB Travel & Tours ===\n');
  
  console.log('This script will help you configure your database connection.\n');
  
  // Check if .env already exists
  const envPath = path.join(__dirname, '..', '.env');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    const overwrite = await question('.env file already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\nSetup cancelled. Existing .env file preserved.');
      rl.close();
      return;
    }
  }
  
  console.log('\n--- Step 1: Supabase Credentials ---\n');
  console.log('Get these from: Supabase Dashboard → Settings → API\n');
  
  const supabaseUrl = await question('Enter your Supabase Project URL: ');
  const serviceRoleKey = await question('Enter your Supabase Service Role Key: ');
  const anonKey = await question('Enter your Supabase Anon Key (optional, press Enter to skip): ');
  
  console.log('\n--- Step 2: Other Configuration ---\n');
  const apiUrl = await question('API URL (default: http://localhost:3000): ') || 'http://localhost:3000';
  const jwtSecret = await question('JWT Secret (default: change-in-production): ') || 'change-in-production';
  
  // Create .env content
  const envContent = `# Supabase Configuration (for backend authentication)
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# Frontend Supabase (optional)
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${anonKey || 'your_anon_key_here'}

# API Configuration
VITE_API_URL=${apiUrl}

# JWT Secret (for token signing)
JWT_SECRET=${jwtSecret}
`;
  
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!\n');
  
  console.log('--- Next Steps ---\n');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Run migration: supabase/migrations/002_auth_and_unavailability.sql');
  console.log('3. Run migration: supabase/migrations/005_create_test_users.sql');
  console.log('4. Start server: node server.js');
  console.log('5. Test login at: http://localhost:5173/login\n');
  
  console.log('Test Credentials:');
  console.log('  Admin:  admin@unicabtravel.co.za / Admin123!');
  console.log('  Driver: driver@unicabtravel.co.za / Driver123!');
  console.log('  Member: member@unicabtravel.co.za / Member123!\n');
  
  rl.close();
}

setup().catch(console.error);







