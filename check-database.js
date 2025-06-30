const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure');
  console.log('=' .repeat(40));
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('✅ Connected to Supabase');
    console.log('🔗 URL:', process.env.SUPABASE_URL);
    
    // Method 1: Try to list tables using information_schema
    console.log('\n1️⃣ Checking existing tables...');
    
    try {
      const { data, error } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;`
        });
      
      if (error) {
        console.log('❌ Cannot query information_schema:', error.message);
      } else {
        console.log('✅ Found tables:', data);
      }
    } catch (err) {
      console.log('❌ exec_sql not available');
    }
    
    // Method 2: Try direct table queries to see what exists
    console.log('\n2️⃣ Testing direct table access...');
    
    const testTables = ['users', 'drivers', 'vehicles', 'bookings', 'wallets'];
    
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          if (error.code === '42P01') {
            console.log(`❌ ${tableName}: Table does not exist`);
          } else {
            console.log(`⚠️ ${tableName}: ${error.message} (code: ${error.code})`);
          }
        } else {
          console.log(`✅ ${tableName}: Table exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Error - ${err.message}`);
      }
    }
    
    // Method 3: Check if RLS is blocking access
    console.log('\n3️⃣ Testing Row Level Security...');
    
    try {
      // Try inserting a simple test record to see if RLS is blocking
      const { data, error } = await supabase
        .from('users')
        .insert({ 
          name: 'RLS Test',
          phone: '0000000000',
          password_hash: 'test',
          is_driver: false 
        })
        .select();
      
      if (error) {
        if (error.code === '42501') {
          console.log('⚠️ RLS (Row Level Security) is blocking access');
          console.log('   You may need to disable RLS or create proper policies');
        } else if (error.code === '42P01') {
          console.log('❌ Users table does not exist');
        } else {
          console.log('❌ Insert failed:', error.message, '(code:', error.code, ')');
        }
      } else {
        console.log('✅ RLS test passed - inserted test record');
        
        // Clean up
        await supabase
          .from('users')
          .delete()
          .eq('phone', '0000000000');
        
        console.log('✅ Test record cleaned up');
      }
    } catch (err) {
      console.log('❌ RLS test error:', err.message);
    }
    
    // Method 4: Check using Supabase Admin API
    console.log('\n4️⃣ Checking with admin privileges...');
    
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.log('⚠️ Admin API test:', error.message);
      } else {
        console.log('✅ Admin API working - Supabase auth is active');
      }
    } catch (err) {
      console.log('⚠️ Admin API not accessible');
    }
    
    console.log('\n📋 Summary:');
    console.log('If tables don\'t exist, you need to:');
    console.log('1. Go to: https://supabase.com/dashboard/project/pmyaatotmhnzfwflkndx/sql');
    console.log('2. Run the SQL schema from the setup script');
    console.log('3. If RLS is blocking, disable it temporarily or create policies');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

// Run the check
checkDatabaseStructure();
