#!/bin/bash

# User Service - Local Development Setup Commands (MongoDB installed locally)
# Execute each command manually as needed

# =============================================================================
# STEP 1: Prerequisites Check
# =============================================================================

# Check Node.js version (requires 18+)
node --version

# Check npm version
npm --version

# Check if MongoDB is installed locally
mongosh --version
# or: mongo --version

# =============================================================================
# STEP 2: Project Setup  
# =============================================================================

# Navigate to project directory (if not already there)
# cd /path/to/user-service

# Install dependencies
npm install

# =============================================================================
# STEP 3: Local MongoDB Setup
# =============================================================================

# Install MongoDB Community Server:
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS:
# brew tap mongodb/brew
# brew install mongodb-community

# Ubuntu/Debian:
# sudo apt-get install mongodb

# Start MongoDB service:
# Windows:
# net start MongoDB

# macOS:
# brew services start mongodb/brew/mongodb-community

# Linux:
# sudo systemctl start mongodb

# Create database and user:
mongosh --eval "
use user_service_db;
db.createUser({
  user: 'appuser',
  pwd: 'apppass123',
  roles: [{ role: 'readWrite', db: 'user_service_db' }]
});
print('Database user created successfully');
"

# Verify MongoDB connection:
mongosh "mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=user_service_db"
# or with older client:
# mongo "mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=user_service_db"

# =============================================================================
# STEP 4: Environment Configuration
# =============================================================================

# Copy environment template:
cp .env.development .env

# Or create .env file manually:
cat << 'EOF' > .env
# Server Configuration
NODE_ENV=development
PORT=3002
HOST=0.0.0.0
API_VERSION=1.0.0

# MongoDB Configuration (Local Installation)
MONGODB_URI=mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=user_service_db

# JWT Configuration
JWT_SECRET=dev_jwt_secret_change_this_in_production_minimum_32_characters_long
JWT_EXPIRES_IN=24h

# External Service URLs
AUDIT_SERVICE_URL=http://localhost:3007
NOTIFICATION_SERVICE_URL=http://localhost:3003

# Security Settings (development)
BCRYPT_ROUNDS=10
ENABLE_SECURITY_HEADERS=false
ENABLE_RATE_LIMITING=false

# Logging Configuration
LOG_LEVEL=debug
LOG_TO_CONSOLE=true
LOG_TO_FILE=false
LOG_FILE_PATH=logs/user-service.log

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3010,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
EOF

# Validate configuration:
npm run validate

# =============================================================================
# STEP 5: Database Initialization
# =============================================================================

# Clear existing data (optional):
npm run clear

# Seed database with sample data:
npm run seed

# Verify database data:
mongosh "mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=user_service_db" --eval "
show collections;
db.users.find().pretty();
"

# =============================================================================
# STEP 6: Testing Setup
# =============================================================================

# Run tests:
npm test

# Run linting:
npm run lint

# =============================================================================
# STEP 7: Start Application
# =============================================================================

# Development mode (with auto-reload):
npm run dev

# Production mode:
# npm start

# =============================================================================
# STEP 8: Verify Setup (run in another terminal)
# =============================================================================

# Health check:
curl http://localhost:3002/health

# Test API endpoints:
# Register a new user:
curl -X POST http://localhost:3002/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login:
curl -X POST http://localhost:3002/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# =============================================================================
# ADDITIONAL COMMANDS
# =============================================================================

# Development workflow commands:
# npm run dev          # Start in development mode
# npm test             # Run all tests
# npm run test:watch   # Run tests in watch mode
# npm run test:coverage # Run tests with coverage
# npm run lint         # Check code style
# npm run lint:fix     # Fix code style issues
# npm run seed         # Re-seed database
# npm run clear        # Clear database
# npm run validate     # Validate configuration

# Local MongoDB management:
# mongosh "mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=user_service_db"
# or with older client:
# mongo "mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=user_service_db"

# MongoDB service management:
# Windows: net start/stop MongoDB
# macOS: brew services start/stop mongodb/brew/mongodb-community
# Linux: sudo systemctl start/stop mongodb

# =============================================================================
# TROUBLESHOOTING COMMANDS
# =============================================================================

# Check what's running on port 3002:
lsof -i :3002
# Or on Windows:
# netstat -ano | findstr :3002

# Kill process on port 3002:
# lsof -ti:3002 | xargs kill
# Or on Windows (find PID from netstat command above, then):
# taskkill /PID <PID> /F

# View application logs:
# tail -f logs/user-service.log

# MongoDB service troubleshooting:
# Check MongoDB status:
# Windows: sc query MongoDB
# macOS: brew services list | grep mongodb
# Linux: sudo systemctl status mongodb

# Check MongoDB logs:
# Windows: Check Event Viewer or MongoDB log directory
# macOS/Linux: Check /var/log/mongodb/ or MongoDB log directory

echo "Local setup commands ready! Execute step by step as needed."
