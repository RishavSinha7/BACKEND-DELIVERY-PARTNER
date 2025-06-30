const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Please add the following to your .env file:');
  console.log('SUPABASE_URL=https://pmyaatotmhnzfwflkndx.supabase.co');
  console.log('SUPABASE_ANON_KEY=your-supabase-anon-key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Supabase database...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    // Execute the schema
    console.log('📊 Creating database schema...');
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSql });

    if (error) {
      console.error('❌ Database setup failed:', error);
      return;
    }

    console.log('✅ Database schema created successfully!');

    // Test connection by creating a test user
    console.log('🧪 Testing database connection...');
    
    const testUser = {
      name: 'Test User',
      phone: '0000000000',
      password_hash: 'hashed_password',
      is_driver: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();

    if (insertError) {
      console.error('❌ Test insert failed:', insertError);
      return;
    }

    console.log('✅ Test user created successfully');

    // Clean up test user
    await supabase
      .from('users')
      .delete()
      .eq('phone', '0000000000');

    console.log('🗑️ Test user cleaned up');
    console.log('🎉 Database setup completed successfully!');
    
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with the correct Supabase keys');
    console.log('2. Run the server: npm run dev');
    console.log('3. Test the API endpoints');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Alternative setup using direct SQL execution
async function setupDatabaseDirect() {
  try {
    console.log('🔧 Setting up database with direct SQL execution...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📊 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
          if (error) {
            console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️ Statement ${i + 1} failed:`, err.message);
        }
      }
    }
    
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Direct setup failed:', error);
  }
}

// Check if this script is run directly
if (require.main === module) {
  console.log('🚀 Starting Supabase database setup...');
  console.log('Project ID: pmyaatotmhnzfwflkndx');
  console.log('');
  
  setupDatabaseDirect();
}

module.exports = { setupDatabase, setupDatabaseDirect };
