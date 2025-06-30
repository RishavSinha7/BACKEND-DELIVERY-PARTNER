const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function listTables() {
  console.log('📊 Listing Available Tables');
  console.log('=' .repeat(35));
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('✅ Supabase client connected');
    
    // Query to get all tables in the public schema
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });
    
    if (error) {
      console.log('❌ Cannot list tables via RPC:', error.message);
      
      // Try alternative method - check specific table existence
      console.log('\n🔍 Testing individual table access...');
      const testTables = ['users', 'drivers', 'vehicles', 'bookings', 'wallets'];
      
      for (const tableName of testTables) {
        try {
          const { data: tableData, error: tableError } = await supabase
            .from(tableName)
            .select('count', { count: 'exact', head: true });
          
          if (tableError) {
            console.log(`❌ ${tableName}: ${tableError.message}`);
          } else {
            console.log(`✅ ${tableName}: exists (${tableData || 0} rows)`);
          }
        } catch (e) {
          console.log(`❌ ${tableName}: ${e.message}`);
        }
      }
    } else {
      console.log('✅ Available tables:');
      data.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listTables();
