#!/bin/bash

# E-Waste Management Backend Setup Script

set -e

echo "🚀 Setting up E-Waste Management Backend..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the backend directory."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Create .env from example if it doesn't exist
if [ ! -f ".env" ]; then
  echo "⚙️  Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please edit .env and add your GEMINI_API_KEY"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env and add your GEMINI_API_KEY"
echo "2. Run: npm run dev"
echo "3. Backend will be available at: http://localhost:3000/api"
echo ""
echo "📚 Documentation:"
echo "   - API Guide: See README.md"
echo "   - Frontend Integration: See ../BACKEND_INTEGRATION.md"
echo ""
echo "🔍 Useful commands:"
echo "   - View logs: docker-compose logs -f backend"
echo "   - MinIO console: http://localhost:9001 (minioadmin/minioadmin)"
echo "   - Database: psql postgresql://postgres:postgres@localhost:5432/ewaste_db"
