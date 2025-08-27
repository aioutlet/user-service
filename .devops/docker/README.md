# User Service - Docker Development Setup

This guide provides step-by-step instructions for setting up the User Service in a Docker-based development environment. This approach uses MongoDB running in a Docker container.

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
- **Docker** (v20+ recommended)
- **Docker Compose** (usually included with Docker Desktop)
- **Git** (for version control)

### Verify Prerequisites

```bash
# Check versions
node --version        # Should be v18+
npm --version         # Should be 8+
docker --version      # Should be 20+
docker-compose --version
git --version
```

## 🚀 Quick Start

For experienced developers who want to get started immediately:

```bash
# 1. Start MongoDB container
docker run -d --name mongodb-local \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=root_pass_123 \
  -v mongodb-local-data:/data/db \
  mongo:7.0

# 2. Create development user and database
docker exec -it mongodb-local mongosh --eval "
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

# 4. Update MongoDB URI for Docker
# Edit .env and use the Docker MongoDB URI

# 5. Initialize database and start service
npm run seed
npm run dev
```

## 📖 Detailed Setup

### Step 1: MongoDB Container Setup

Create and start a MongoDB container with persistent storage:

```bash
# Create and start MongoDB container
docker run -d \
  --name mongodb-local \
  --restart unless-stopped \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=root_pass_123 \
  -v mongodb-local-data:/data/db \
  mongo:7.0

# Verify container is running
docker ps | grep mongodb-local

# Check logs if needed
docker logs mongodb-local
```

### Step 2: Database User Creation

Create a dedicated user for the User Service:

```bash
# Connect to MongoDB and create user
docker exec -it mongodb-local mongosh --eval "
use admin;
db.createUser({
  user: 'appuser',
  pwd: 'apppass123',
  roles: [
    { role: 'readWrite', db: 'user_service_db' },
    { role: 'dbAdmin', db: 'user_service_db' }
  ]
});

// Verify user creation
db.getUsers();
"
```

### Step 3: Application Setup

Navigate to the user-service directory and install dependencies:

```bash
# Navigate to user service directory
cd user-service

# Install Node.js dependencies
npm install

# Create environment file from template
cp .env.development .env
```

### Step 4: Environment Configuration

Edit the `.env` file to use the Docker MongoDB container:

```bash
# Open .env file in your preferred editor
nano .env  # or code .env, vim .env, etc.
```

Ensure the MongoDB URI is configured for Docker:

```env
# MongoDB Configuration for Docker container
MONGODB_URI=mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=admin
```

### Step 5: Database Initialization

Seed the database with initial data:

```bash
# Clear any existing data and seed database
npm run clear
npm run seed

# Verify seeding was successful
npm run test -- --testNamePattern="database"
```

### Step 6: Start Development Server

```bash
# Start the service in development mode
npm run dev

# The service should be running on http://localhost:3002
```

## 🔧 Environment Configuration

The User Service uses environment variables for configuration. Here's the Docker-specific setup:

### MongoDB URI Breakdown (Docker)

```env
MONGODB_URI=mongodb://appuser:apppass123@localhost:27017/user_service_db?authSource=admin
```

**Components:**

- `mongodb://` - Protocol
- `appuser:apppass123` - Username and password
- `localhost:27017` - Docker container exposed on localhost port 27017
- `user_service_db` - Database name
- `authSource=admin` - Authentication database (where user was created)

### Environment Files

- `.env.development` - Template for development
- `.env.production` - Template for production
- `.env` - Your local configuration (not in git)

## 🗄️ Database Management

### Container Operations

```bash
# Start existing container
docker start mongodb-local

# Stop container
docker stop mongodb-local

# Restart container
docker restart mongodb-local

# View logs
docker logs mongodb-local

# Remove container (data preserved in volume)
docker rm mongodb-local

# Remove container and volume (ALL DATA LOST)
docker rm mongodb-local
docker volume rm mongodb-local-data
```

### Database Operations

```bash
# Connect to MongoDB shell
docker exec -it mongodb-local mongosh -u appuser -p apppass123 --authenticationDatabase admin

# Clear database via npm script
npm run clear

# Seed database via npm script
npm run seed
```

### Manual Database Operations

```bash
# Connect and perform operations
docker exec -it mongodb-local mongosh --eval "
use user_service_db;
db.auth('appuser', 'apppass123');

// List collections
show collections;

// Count documents
db.users.countDocuments();

// Find sample user
db.users.findOne();
"

// Find sample user
db.users.findOne();
"
```

## 💻 Development Workflow

### Starting Development

```bash
# Start MongoDB container (if not running)
docker start mongodb-local

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

### MongoDB Container Issues

**Container won't start:**

```bash
# Check if port 27017 is already in use
netstat -an | findstr :27017  # Windows
lsof -i :27017               # macOS/Linux

# Check Docker logs
docker logs mongodb-local

# Remove and recreate container
docker rm -f mongodb-local
# Then recreate with original docker run command
```

**Can't connect to MongoDB:**

```bash
# Verify container is running
docker ps | grep mongodb-local

# Test connection
docker exec -it mongodb-local mongosh --eval "db.runCommand('ping')"

# Check if user exists
docker exec -it mongodb-local mongosh --eval "
use admin;
db.getUsers();
"
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

### Docker Issues

**Docker daemon not running:**

```bash
# Start Docker Desktop or Docker service
# Windows: Start Docker Desktop
# macOS: Start Docker Desktop
# Linux: sudo systemctl start docker
```

**Permission issues:**

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Then logout and login again
```

## 🧹 Cleanup

### Daily Cleanup

```bash
# Stop application (Ctrl+C in terminal where it's running)

# Stop MongoDB container (optional)
docker stop mongodb-local
```

### Full Cleanup

Use the teardown script for comprehensive cleanup:

```bash
# Navigate to docker setup directory
cd .devops/docker

# Run teardown commands manually
# See teardown.sh for complete list of commands

# Or follow the teardown script step by step
```

**Manual cleanup:**

```bash
# Stop and remove container
docker stop mongodb-local
docker rm mongodb-local

# Remove data volume (ALL DATA WILL BE LOST)
docker volume rm mongodb-local-data

# Clean up application files
rm .env
rm -rf node_modules
rm package-lock.json
rm -rf logs/*
```
