const { Pool } = require('pg');
require('dotenv').config();

// Parse the database URL
const dbUrl = process.env.DATABASE_URL;
console.log('🔗 Database URL:', dbUrl ? 'Present' : 'Missing');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyDatabase() {
  console.log('🔍 Verifying Database Structure');
  console.log('=====================================');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // List all tables in the public schema
    console.log('\n📋 Listing all tables in public schema:');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in public schema');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
    
    // Check specific tables we need
    console.log('\n🎯 Checking required tables:');
    const requiredTables = ['users', 'drivers', 'vehicles', 'bookings', 'wallets'];
    
    for (const tableName of requiredTables) {
      try {
        const checkQuery = `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );`;
        
        const result = await client.query(checkQuery, [tableName]);
        const exists = result.rows[0].exists;
        
        if (exists) {
          // Count rows
          const countQuery = `SELECT COUNT(*) as count FROM ${tableName};`;
          const countResult = await client.query(countQuery);
          console.log(`✅ ${tableName}: EXISTS (${countResult.rows[0].count} rows)`);
        } else {
          console.log(`❌ ${tableName}: MISSING`);
        }
      } catch (error) {
        console.log(`❌ ${tableName}: ERROR - ${error.message}`);
      }
    }
    
    // Check table structures for existing tables
    console.log('\n🏗️ Table structures:');
    for (const tableName of requiredTables) {
      try {
        const structureQuery = `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position;
        `;
        
        const result = await client.query(structureQuery, [tableName]);
        if (result.rows.length > 0) {
          console.log(`\n📊 ${tableName} structure:`);
          result.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
        }
      } catch (error) {
        // Table doesn't exist, skip
      }
    }
    
    client.release();
    console.log('\n✅ Database verification complete');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
