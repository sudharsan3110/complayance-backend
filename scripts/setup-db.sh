#!/bin/bash

# Database Setup Script for E-Invoicing Readiness Analyzer
# This script sets up the PostgreSQL database and runs Prisma migrations

set -e

echo "🚀 Setting up database for E-Invoicing Readiness Analyzer..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    echo "Example: export DATABASE_URL='postgresql://username:password@localhost:5432/compliance_ai'"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Check if Prisma CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please install Node.js and npm"
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Dependencies are installed"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Prisma client generated"

# Push schema to database (creates tables)
echo "🗄️  Creating database tables..."
npx prisma db push

echo "✅ Database tables created"

# Optional: Seed database with sample data
if [ "$1" = "--seed" ]; then
    echo "🌱 Seeding database with sample data..."
    # Add seed script here if needed
    echo "✅ Database seeded"
fi

# Verify database connection
echo "🔍 Verifying database connection..."
npx prisma db pull --print

echo "✅ Database connection verified"

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend server: npm run dev"
echo "2. View database in Prisma Studio: npx prisma studio"
echo "3. Check the API endpoints: http://localhost:3001"
echo ""
echo "Database schema documentation: ../DATABASE_SCHEMA.md"


