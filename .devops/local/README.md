# User Service - Local Development Setup

This guide provides step-by-step instructions for setting up the User Service with MongoDB installed locally on your development machine.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Configuration](#environment-configuration)
- [Database Management](#database-management)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Cleanup](#cleanup)

## 🔧 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **npm** (comes with Node.js)
- **MongoDB** (v6.0+ recommended)
- **Git** (for version control)

### Verify Prerequisites

```bash
# Check versions
node --version        # Should be v18+
npm --version         # Should be 8+
mongosh --version     # MongoDB shell
git --version
```

## 🚀 Quick Start

For experienced developers who want to get started immediately:

```bash
# 1. Install and start MongoDB locally
# (Installation varies by OS - see Detailed Setup section)

# 2. Create MongoDB user
mongosh --eval "
use admin;
db.createUser({
  user: 'appuser',
  pwd: 'apppass123',
  roles: [
    { role: 'readWrite', db: 'user_service_db' },
    { role: 'dbAdmin', db: 'user_service_db' }
  ]
});
"

# 3. Install dependencies and setup environment
cd user-service
npm install
cp .env.development .env

# 4. Update MongoDB URI for local installation
# Edit .env and use the local MongoDB URI

# 5. Initialize database and start service
npm run seed
npm run dev
```

## 📖 Detailed Setup

### Step 1: MongoDB Local Installation

Install MongoDB Community Server on your system:

**Windows:**

```bash
# Download from https://www.mongodb.com/try/download/community
# Follow the installer instructions
# MongoDB will be installed as a service by default
```

**macOS (using Homebrew):**

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add MongoDB tap and install
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb/brew/mongodb-community@7.0
```

**Linux (Ubuntu/Debian):**

```bash
# Import the public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Create list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 2: Verify MongoDB Installation

```bash
# Test MongoDB connection
mongosh

# You should see MongoDB shell prompt
# Exit with: exit
```

### Step 3: Create MongoDB User

Create a dedicated user for the User Service:

```bash
# Connect to MongoDB as admin
mongosh

# In MongoDB shell, create user
use admin
db.createUser({
  user: 'appuser',
  pwd: 'apppass123',
  roles: [
    { role: 'readWrite', db: 'user_service_db' },
    { role: 'dbAdmin', db: 'user_service_db' }
  ]
})

# Verify user creation
db.getUsers()

# Exit MongoDB shell
exit
```

### Step 4: Application Setup

Navigate to the user-service directory and install dependencies:

```bash
# Navigate to user service directory
cd user-service

# Install Node.js dependencies
npm install

# Create environment file from template
cp .env.development .env
```

### Step 5: Environment Configuration

Edit the `.env` file to use the local MongoDB installation:

```bash
# Open .env file in your preferred editor
nano .env  # or code .env, vim .env, etc.
```

Ensure the MongoDB URI is configured for local installation:

```env
# MongoDB Configuration for local installation
MONGODB_URI=mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=admin
```

### Step 6: Database Initialization

Seed the database with initial data:

```bash
# Clear any existing data and seed database
npm run clear
npm run seed

# Verify seeding was successful
npm run test -- --testNamePattern="database"
```

### Step 7: Start Development Server

```bash
# Start the service in development mode
npm run dev

# The service should be running on http://localhost:3002
```

## 🔧 Environment Configuration

The User Service uses environment variables for configuration. Here's the local-specific setup:

### MongoDB URI Breakdown (Local)

```env
MONGODB_URI=mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=admin
```

**Components:**

- `mongodb://` - Protocol
- `appuser:apppass123` - Username and password
- `localhost:27017` - Local MongoDB server
- `user_service_db` - Database name
- `authSource=admin` - Authentication database (where user was created)

### Environment Files

- `.env.development` - Template for development
- `.env.production` - Template for production
- `.env` - Your local configuration (not in git)

## 🗄️ Database Management

### MongoDB Service Operations

**Windows:**

```bash
# Start MongoDB service
net start MongoDB

# Stop MongoDB service
net stop MongoDB

# Check service status
sc query MongoDB
```

**macOS:**

```bash
# Start MongoDB service
brew services start mongodb/brew/mongodb-community@7.0

# Stop MongoDB service
brew services stop mongodb/brew/mongodb-community@7.0

# Check service status
brew services list | grep mongodb
```

**Linux:**

```bash
# Start MongoDB service
sudo systemctl start mongod

# Stop MongoDB service
sudo systemctl stop mongod

# Check service status
sudo systemctl status mongod

# Enable auto-start on boot
sudo systemctl enable mongod
```

### Database Operations

```bash
# Connect to MongoDB shell with authentication
mongosh -u appuser -p apppass123 --authenticationDatabase admin user_service_db

# Clear database via npm script
npm run clear

# Seed database via npm script
npm run seed
```

### Manual Database Operations

```bash
# Connect and perform operations
mongosh -u appuser -p apppass123 --authenticationDatabase admin --eval "
use user_service_db;

// List collections
show collections;

// Count documents
db.users.countDocuments();

// Find sample user
db.users.findOne();
"
```

## 💻 Development Workflow

### Starting Development

```bash
# Start MongoDB service (if not already running)
# Windows: net start MongoDB
# macOS: brew services start mongodb/brew/mongodb-community@7.0
# Linux: sudo systemctl start mongod

# Start application in development mode
npm run dev
```

### Making Changes

1. **Code Changes**: Edit source files in `src/`
2. **Database Changes**: Update models in `src/models/`
3. **API Changes**: Update controllers in `src/controllers/`
4. **Test Changes**: Update tests in `tests/`

### Testing Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/integration/auth.test.js

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format
```

## 🧪 Testing

### Test Categories

1. **Unit Tests**: Test individual functions and modules
2. **Integration Tests**: Test API endpoints and database interactions
3. **E2E Tests**: Test complete user workflows

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Database

Tests use a separate test database that's automatically created and cleaned up.

## 🔧 Troubleshooting

### MongoDB Issues

**MongoDB service won't start:**

```bash
# Check if port 27017 is already in use
netstat -an | findstr :27017  # Windows
lsof -i :27017               # macOS/Linux

# Check MongoDB logs
# Windows: Check Event Viewer or MongoDB log files
# macOS: brew services list | grep mongodb
# Linux: sudo journalctl -u mongod
```

**Can't connect to MongoDB:**

```bash
# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Check if user exists
mongosh --eval "
use admin;
db.getUsers();
"

# Test authentication
mongosh -u appuser -p apppass123 --authenticationDatabase admin
```

### Application Issues

**Port already in use:**

```bash
# Find what's using port 3002
netstat -ano | findstr :3002  # Windows
lsof -i :3002                # macOS/Linux

# Kill process
taskkill /PID <PID> /F       # Windows
kill -9 <PID>                # macOS/Linux
```

**Dependencies issues:**

```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
```

**Environment issues:**

```bash
# Verify environment file exists and has correct format
cat .env

# Check for syntax errors
node -e "require('dotenv').config(); console.log('Environment loaded successfully');"
```

### Database Connection Issues

**Authentication failed:**

- Verify username/password in `.env` match the user created in MongoDB
- Ensure `authSource=admin` is in the connection string
- Check that user has proper roles

**Database not found:**

- MongoDB creates databases automatically when first accessed
- Ensure database name in URI matches what the application expects
- Run `npm run seed` to initialize the database

## 🧹 Cleanup

### Daily Cleanup

```bash
# Stop application (Ctrl+C in terminal where it's running)

# Stop MongoDB service (optional)
# Windows: net stop MongoDB
# macOS: brew services stop mongodb/brew/mongodb-community@7.0
# Linux: sudo systemctl stop mongod
```

### Full Cleanup

Use the teardown script for comprehensive cleanup:

```bash
# Navigate to setup directory
cd scripts/services/user-service/local

# Run teardown commands manually
# See teardown.sh for complete list of commands

# Or follow the teardown script step by step
```

**Manual cleanup:**

```bash
# Remove application database
mongosh -u appuser -p apppass123 --authenticationDatabase admin --eval "
use user_service_db;
db.dropDatabase();
"

# Remove database user (optional)
mongosh --eval "
use admin;
db.dropUser('appuser');
"

# Clean up application files (run from user-service directory)
rm .env
rm -rf node_modules
rm package-lock.json
rm -rf logs/*
```
