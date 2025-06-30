#!/bin/bash

echo "🚀 Setting up Delivery Partner Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env 2>/dev/null || echo "Please create a .env file with your configuration"
fi

# Test setup
echo "🔍 Testing backend setup..."
node test-setup.js

if [ $? -ne 0 ]; then
    echo "❌ Backend setup test failed"
    exit 1
fi

echo "🎉 Backend setup completed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Update the .env file with your configuration"
echo "2. Make sure MongoDB is running"
echo "3. Start the backend server:"
echo "   npm run dev    (for development)"
echo "   npm start      (for production)"
echo ""
echo "📖 For more information, check the README.md file"
