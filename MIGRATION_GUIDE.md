# 🔄 Migration from MongoDB to Supabase PostgreSQL

## ✅ What's Been Updated

### 🗄️ Database Layer
- ❌ **Removed**: MongoDB + Mongoose
- ✅ **Added**: Supabase PostgreSQL + Sequelize
- ✅ **Added**: Row Level Security (RLS) policies
- ✅ **Added**: UUID primary keys
- ✅ **Added**: Proper indexing and constraints

### 📦 Dependencies Updated
- ❌ **Removed**: `mongoose`
- ✅ **Added**: `pg`, `sequelize`, `@supabase/supabase-js`

### 🏗️ Files Created/Updated
- ✅ **New**: `src/config/database.js` - Database configuration
- ✅ **New**: `src/database/schema.sql` - PostgreSQL schema
- ✅ **New**: `src/models/UserSequelize.js` - User model for Sequelize
- ✅ **New**: `src/models/BookingSequelize.js` - Booking model for Sequelize
- ✅ **New**: `src/models/index.js` - Models with associations
- ✅ **New**: `src/routes/authSequelize.js` - Updated auth routes
- ✅ **New**: `src/middleware/authSequelize.js` - Updated auth middleware
- ✅ **New**: `setup-supabase.js` - Database setup script

## 🔧 Required Setup Steps

### 1. Get Supabase Credentials

Visit your Supabase project at: https://supabase.com/dashboard/project/pmyaatotmhnzfwflkndx

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://pmyaatotmhnzfwflkndx.supabase.co`
   - **anon/public key**: `eyJ...` (starts with eyJ)
   - **service_role key**: `eyJ...` (starts with eyJ, longer key)

### 2. Update Environment Variables

Update your `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://pmyaatotmhnzfwflkndx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# PostgreSQL Direct Connection (Optional)
DATABASE_URL=postgresql://postgres:[your-password]@db.pmyaatotmhnzfwflkndx.supabase.co:5432/postgres
```

### 3. Setup Database Schema

Run the database setup script:

```bash
cd backend
node setup-supabase.js
```

### 4. Update File References

You'll need to update the following files to use the new models:

#### Update `src/server.js`:
- ✅ Already updated to use PostgreSQL connection

#### Update route files to use new models:
```javascript
// Change from:
const User = require('../models/User');

// To:
const { User } = require('../models');
```

#### Update middleware files:
```javascript
// Change from:
const User = require('../models/User');

// To:
const { User } = require('../models');
```

## 🔀 Key Differences

### Model Changes
| MongoDB (Mongoose) | PostgreSQL (Sequelize) |
|-------------------|-------------------------|
| `_id` | `id` (UUID) |
| `new User()` | `User.create()` |
| `user.save()` | `user.save()` (same) |
| `User.findOne()` | `User.findOne()` (same) |
| `User.findById()` | `User.findByPk()` |

### Query Changes
```javascript
// MongoDB/Mongoose
const user = await User.findOne({ phone: '1234567890' });
const users = await User.find({ isDriver: true });

// PostgreSQL/Sequelize  
const user = await User.findOne({ where: { phone: '1234567890' } });
const users = await User.findAll({ where: { isDriver: true } });
```

## 🧪 Testing the Migration

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Test Database Connection
```bash
node -e "require('./src/config/database').testConnection()"
```

### 3. Start the Server
```bash
npm run dev
```

### 4. Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test user signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"1234567890","password":"password123","confirmPassword":"password123","isDriver":false}'
```

## ⚠️ Important Notes

### Data Migration
- **No automatic data migration** - this is a fresh start with PostgreSQL
- You'll need to re-seed your database with test data
- Consider exporting important data from MongoDB before switching

### Authentication
- JWT tokens remain the same
- Password hashing logic is preserved
- User sessions will be reset (users need to login again)

### Real-time Features
- Socket.io integration remains the same
- No changes needed for WebSocket functionality

### API Compatibility
- All API endpoints maintain the same interface
- Request/response formats remain unchanged
- Frontend doesn't need modifications

## 🚨 Rollback Plan

If you need to rollback to MongoDB:

1. Restore the original `package.json`
2. Restore original model files
3. Restore original server.js
4. Run `npm install` to reinstall MongoDB dependencies

## 🎯 Next Steps

1. ✅ Complete Supabase setup
2. ✅ Test all API endpoints
3. ✅ Update remaining route files
4. ✅ Create new seed data script
5. ✅ Test frontend integration
6. ✅ Deploy to production with new database

## 📞 Support

If you encounter issues:
1. Check Supabase dashboard for connection issues
2. Verify environment variables are correct
3. Check server logs for detailed error messages
4. Test database connection independently
