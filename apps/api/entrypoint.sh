#!/bin/sh

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate --schema=./backend/prisma/schema.prisma

# Deploy migrations (if any)
echo "Deploying migrations..."
npx prisma migrate deploy --schema=./backend/prisma/schema.prisma

# Seed database
echo "Seeding database..."
npm run seed

# Start server
echo "Starting server..."
npm start
