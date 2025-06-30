const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Booking = require('./src/models/Booking');

// Sample data
const sampleUsers = [
  {
    name: 'John Customer',
    phone: '1111111111',
    password: 'password123',
    isDriver: false,
    email: 'john@example.com'
  },
  {
    name: 'Sarah Driver',
    phone: '2222222222',
    password: 'password123',
    isDriver: true,
    email: 'sarah@example.com',
    driverProfile: {
      licenseNumber: 'DL123456789',
      isAvailable: true,
      currentLocation: {
        latitude: 28.6139,
        longitude: 77.2090
      }
    }
  },
  {
    name: 'Mike Delivery',
    phone: '3333333333',
    password: 'password123',
    isDriver: true,
    email: 'mike@example.com',
    driverProfile: {
      licenseNumber: 'DL987654321',
      isAvailable: true,
      currentLocation: {
        latitude: 28.7041,
        longitude: 77.1025
      }
    }
  },
  {
    name: 'Alice Customer',
    phone: '4444444444',
    password: 'password123',
    isDriver: false,
    email: 'alice@example.com'
  }
];

const sampleBookings = [
  {
    serviceType: 'two-wheeler',
    pickupLocation: {
      address: '123 Main St, New Delhi',
      coordinates: { latitude: 28.6139, longitude: 77.2090 }
    },
    dropLocation: {
      address: '456 Oak Ave, New Delhi',
      coordinates: { latitude: 28.7041, longitude: 77.1025 }
    },
    items: [{
      name: 'Small package',
      description: 'Documents and small items',
      weight: 2
    }],
    pricing: {
      baseFare: 50,
      distanceCharges: 30,
      total: 80
    },
    distance: 8.5,
    estimatedTime: {
      minutes: 25,
      display: '25 mins'
    },
    status: 'delivered',
    scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
  },
  {
    serviceType: 'truck',
    pickupLocation: {
      address: '789 Pine St, New Delhi',
      coordinates: { latitude: 28.5355, longitude: 77.3910 }
    },
    dropLocation: {
      address: '321 Elm St, Gurgaon',
      coordinates: { latitude: 28.4595, longitude: 77.0266 }
    },
    items: [{
      name: 'Furniture',
      description: 'Sofa and dining table',
      weight: 50
    }],
    pricing: {
      baseFare: 200,
      distanceCharges: 150,
      total: 350
    },
    distance: 25.3,
    estimatedTime: {
      minutes: 60,
      display: '1 hour'
    },
    status: 'in_transit'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery-partner');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Cleaning existing data...');
    await User.deleteMany({});
    await Booking.deleteMany({});

    // Create users
    console.log('👥 Creating sample users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`   ✅ Created ${userData.isDriver ? 'driver' : 'customer'}: ${userData.name}`);
    }

    // Create bookings
    console.log('📦 Creating sample bookings...');
    const customers = createdUsers.filter(u => !u.isDriver);
    const drivers = createdUsers.filter(u => u.isDriver);

    for (let i = 0; i < sampleBookings.length; i++) {
      const bookingData = {
        ...sampleBookings[i],
        customer: customers[i % customers.length]._id,
        driver: drivers[i % drivers.length]._id
      };

      const booking = new Booking(bookingData);
      await booking.save();
      console.log(`   ✅ Created booking: ${booking.serviceType} - ${booking.status}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Sample credentials:');
    console.log('Customer Login:');
    console.log('  Phone: 1111111111');
    console.log('  Password: password123');
    console.log('  Type: Customer');
    console.log('\nDriver Login:');
    console.log('  Phone: 2222222222');
    console.log('  Password: password123');
    console.log('  Type: Driver');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📊 Database connection closed.');
  }
}

// Handle script execution
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
