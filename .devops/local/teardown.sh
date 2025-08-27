#!/bin/bash

# User Service - Local Development Teardown Commands (MongoDB installed locally)
# Execute each command manually as needed

# =============================================================================
# APPLICATION CLEANUP
# =============================================================================

# Stop any running User Service processes:
# Check what's running on port 3002:
lsof -i :3002
# Or on Windows:
# netstat -ano | findstr :3002

# Kill process on port 3002:
# lsof -ti:3002 | xargs kill
# Or on Windows (find PID from netstat command above, then):
# taskkill /PID <PID> /F

# =============================================================================
# DATABASE CLEANUP
# =============================================================================

# Clear application database:
npm run clear

# Drop database completely (optional):
mongosh --eval "
use user_service_db;
db.dropDatabase();
print('Database dropped');
"

# Remove database user (optional):
mongosh --eval "
use user_service_db;
db.dropUser('appuser');
print('User removed');
"

# =============================================================================
# MONGODB SERVICE CLEANUP (OPTIONAL)
# =============================================================================

# Stop MongoDB service:
# Windows:
# net stop MongoDB

# macOS:
# brew services stop mongodb/brew/mongodb-community

# Linux:
# sudo systemctl stop mongodb

# =============================================================================
# FILE CLEANUP (OPTIONAL)
# =============================================================================

# Remove .env file:
# rm .env

# Remove log files:
# rm -rf logs/*

# Remove node_modules (optional):
# rm -rf node_modules

# Remove package-lock.json (optional):
# rm package-lock.json

# Remove test coverage reports (optional):
# rm -rf coverage

# =============================================================================
# VERIFICATION
# =============================================================================

# Verify port is free:
lsof -i :3002
# Or on Windows:
# netstat -ano | findstr :3002

# Check MongoDB service status:
# Windows: sc query MongoDB
# macOS: brew services list | grep mongodb
# Linux: sudo systemctl status mongodb

echo "Local teardown commands ready! Execute step by step as needed."
