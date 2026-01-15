#!/bin/bash

# E-Waste Management - Complete Local Setup

set -e

echo "🚀 Complete E-Waste Management Setup"
echo "===================================="

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend
chmod +x setup.sh
./setup.sh

cd ..

echo ""
echo "🎉 Complete setup finished!"
echo ""
echo "📝 Quick Start:"
echo "1. Backend: cd backend && npm run dev"
echo "2. Frontend: npm run dev (from root)"
echo "3. Open: http://localhost:5173"
echo ""
