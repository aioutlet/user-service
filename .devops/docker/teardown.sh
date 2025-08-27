#!/bin/bash

# User Service - Docker Development Teardown Commands
# Execute each command manually as needed

# =============================================================================
# DOCKER CONTAINER CLEANUP
# =============================================================================

# Stop MongoDB container:
docker stop mongodb-local

# Remove MongoDB container:
docker rm mongodb-local

# Remove MongoDB data volume (WARNING: This will delete all data):
docker volume rm mongodb-local-data

# Remove MongoDB image (optional):
# docker rmi mongo:latest

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

# Verify containers are removed:
docker ps -a | grep mongodb-local

# Verify volumes are removed:
docker volume ls | grep mongodb-local

# Verify port is free:
lsof -i :3002
# Or on Windows:
# netstat -ano | findstr :3002

echo "Docker teardown commands ready! Execute step by step as needed."
