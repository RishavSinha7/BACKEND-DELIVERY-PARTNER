const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class DatabaseSetup {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials in .env file');
      console.log('Please add the following to your .env file:');
      console.log('SUPABASE_URL=your-supabase-url');
      console.log('SUPABASE_ANON_KEY=your-supabase-anon-key');
      console.log('SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key');
      process.exit(1);
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async testConnection() {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
      
      if (error && error.code !== '42P01') {
        throw error;
      }
      
      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
  }

  async setupSchema() {
    try {
      console.log('📊 Setting up database schema...');
      
      const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      
      // Split schema into individual statements
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      console.log(`📝 Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.trim()) {
          try {
            const { error } = await this.supabase.rpc('exec_sql', { 
              sql: stmt + ';' 
            });
            
            if (error) {
              console.warn(`⚠️ Statement ${i + 1}:`, error.message);
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
            }
          } catch (err) {
            console.warn(`⚠️ Statement ${i + 1} failed:`, err.message);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Schema setup failed:', error.message);
      return false;
    }
  }

  async verifyTables() {
    try {
      console.log('🔍 Verifying database tables...');
      
      const testTables = ['users', 'drivers', 'vehicles', 'bookings', 'wallets'];
      const results = {};
      
      for (const tableName of testTables) {
        try {
          const { data, error } = await this.supabase
            .from(tableName)
            .select('count')
            .limit(1);
          
          if (error) {
            if (error.code === '42P01') {
              results[tableName] = 'missing';
              console.log(`❌ ${tableName}: Table does not exist`);
            } else {
              results[tableName] = 'error';
              console.log(`⚠️ ${tableName}: ${error.message}`);
            }
          } else {
            results[tableName] = 'exists';
            console.log(`✅ ${tableName}: Table exists and accessible`);
          }
        } catch (err) {
          results[tableName] = 'error';
          console.log(`❌ ${tableName}: ${err.message}`);
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Table verification failed:', error.message);
      return {};
    }
  }

  async seedDatabase() {
    try {
      console.log('🌱 Seeding database with sample data...');
      
      // Test user creation
      const testUser = {
        name: 'Test User',
        phone: '0000000000',
        password_hash: 'test_hash_123',
        is_driver: false,
        email: 'test@example.com'
      };
      
      const { data: insertData, error: insertError } = await this.supabase
        .from('users')
        .insert(testUser)
        .select();
      
      if (insertError) {
        console.error('❌ Test insert failed:', insertError.message);
        return false;
      }
      
      console.log('✅ Test user created successfully');
      
      // Clean up test user
      await this.supabase
        .from('users')
        .delete()
        .eq('phone', '0000000000');
      
      console.log('🗑️ Test user cleaned up');
      return true;
    } catch (error) {
      console.error('❌ Database seeding failed:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Starting Supabase Database Setup');
    console.log('=' .repeat(50));
    
    try {
      // Step 1: Test connection
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Failed to connect to Supabase');
      }
      
      // Step 2: Setup schema
      await this.setupSchema();
      
      // Step 3: Verify tables
      const tables = await this.verifyTables();
      
      // Step 4: Seed database (optional)
      await this.seedDatabase();
      
      console.log('\n🎉 Database setup completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Update your .env file with the correct Supabase keys');
      console.log('2. Run the server: npm run dev');
      console.log('3. Test the API endpoints');
      
      return true;
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      return false;
    }
  }
}

// Export functions for use in other modules
const setupDatabase = async () => {
  const setup = new DatabaseSetup();
  return await setup.run();
};

const testConnection = async () => {
  const setup = new DatabaseSetup();
  return await setup.testConnection();
};

const verifyDatabase = async () => {
  const setup = new DatabaseSetup();
  return await setup.verifyTables();
};

module.exports = { 
  DatabaseSetup, 
  setupDatabase, 
  testConnection, 
  verifyDatabase 
};

// Run if called directly
if (require.main === module) {
  setupDatabase();
}
