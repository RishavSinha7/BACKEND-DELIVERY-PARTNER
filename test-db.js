const { supabase } = require('./src/models');

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n');
  
  const tables = ['bikes', 'trucks', 'users', 'drivers', 'bike_bookings', 'truck_bookings'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  // Test a simple query
  try {
    console.log('\n🔍 Testing simple queries...');
    const { data: bikeData, error: bikeError } = await supabase
      .from('bikes')
      .select('id, type, model')
      .limit(3);
    
    if (bikeError) {
      console.log(`❌ Bikes query: ${bikeError.message}`);
    } else {
      console.log(`✅ Bikes query: Retrieved ${bikeData.length} sample records`);
      if (bikeData.length > 0) {
        console.log('   Sample bike:', bikeData[0]);
      }
    }
  } catch (err) {
    console.log(`❌ Bikes query failed: ${err.message}`);
  }
  
  console.log('\n✅ Database connection test completed!');
}

testDatabase().catch(console.error);
