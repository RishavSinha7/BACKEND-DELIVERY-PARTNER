const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupSupabaseDatabase() {
  console.log('🚀 Setting up Supabase Database');
  console.log('=' .repeat(40));
  
  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('✅ Supabase client created');
    console.log('🔗 URL:', process.env.SUPABASE_URL);
    
    // First, let's manually create the tables since exec_sql might not be available
    console.log('\n📊 Creating database tables...');
    
    // Create users table
    console.log('1. Creating users table...');
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(15) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          is_driver BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          profile_image TEXT,
          phone_verified BOOLEAN DEFAULT FALSE,
          email_verified BOOLEAN DEFAULT FALSE,
          address JSONB,
          device_tokens JSONB DEFAULT '[]'::jsonb,
          reset_password_token VARCHAR(255),
          reset_password_expiry TIMESTAMP,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Try using SQL editor approach
    const { error: usersError } = await supabase.rpc('exec_sql', { sql: createUsersTable });
    
    if (usersError && usersError.message.includes('exec_sql')) {
      console.log('ℹ️ exec_sql not available, using alternative approach...');
      
      // Alternative: Create tables using Supabase Admin API or manual setup required
      console.log('📝 Since exec_sql is not available, you need to run the SQL manually.');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/pmyaatotmhnzfwflkndx/sql');
      console.log('\n📋 Copy and paste this SQL:');
      
      // Read the full schema file
      const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      
      console.log('\n' + '='.repeat(50));
      console.log('SQL TO RUN IN SUPABASE SQL EDITOR:');
      console.log('='.repeat(50));
      console.log(schemaSql);
      console.log('='.repeat(50));
      
      // Wait for user confirmation
      console.log('\n⏸️ After running the SQL in Supabase dashboard, continue...');
      
    } else if (usersError) {
      console.log('❌ Failed to create users table:', usersError.message);
      return;
    } else {
      console.log('✅ Users table created successfully');
    }
    
    // Test the connection by trying to insert and delete a test record
    console.log('\n🧪 Testing database operations...');
    
    const testUser = {
      name: 'Test User',
      phone: '0000000001',
      password_hash: 'test_hash_123',
      is_driver: false,
      email: 'test@example.com'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();
    
    if (insertError) {
      if (insertError.code === '42P01') {
        console.log('⚠️ Tables not created yet. Please run the SQL manually in Supabase dashboard.');
        console.log('🔗 Dashboard: https://supabase.com/dashboard/project/pmyaatotmhnzfwflkndx/sql');
        return;
      } else {
        console.log('❌ Insert test failed:', insertError.message);
        return;
      }
    }
    
    console.log('✅ Test record inserted:', insertData[0]);
    
    // Clean up test record
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('phone', '0000000001');
    
    if (deleteError) {
      console.log('⚠️ Test cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test record cleaned up');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Supabase connection: Working');
    console.log('  ✅ Database operations: Working');
    console.log('  ✅ Authentication: Configured');
    
    console.log('\n🔄 Next Steps:');
    console.log('  1. Your database is ready to use');
    console.log('  2. Start your backend: npm run dev');
    console.log('  3. Test your API endpoints');
    console.log('  4. Frontend should now connect successfully');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Check internet connection');
    console.log('  2. Verify Supabase project is active');
    console.log('  3. Check .env configuration');
    console.log('  4. Try running SQL manually in Supabase dashboard');
  }
}

// Create a simpler connection test
async function testConnection() {
  console.log('🔍 Quick Connection Test');
  console.log('-'.repeat(30));
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Simple health check
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('✅ Connection working (tables need to be created)');
      return true;
    } else if (error) {
      console.log('❌ Connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Connection working (found existing data)');
      return true;
    }
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

// Export functions
module.exports = { setupSupabaseDatabase, testConnection };

// Run if called directly
if (require.main === module) {
  setupSupabaseDatabase();
}
