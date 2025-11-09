# E2E Test Requirements

## Overview
The e2e tests in `tests/e2e/` are designed to test the user service in a real environment with actual network requests.

## Prerequisites

### 1. MongoDB
The user service requires a running MongoDB instance:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:8.0

# Or use docker-compose
docker-compose up -d mongodb
```

### 2. User Service
Start the user service:
```bash
# Install dependencies
npm install

# Start the service
npm start

# Or with nodemon for development
npm run dev
```

The service should be running at `http://localhost:5000`

### 3. Environment Variables
Create a `.env` file or set these environment variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB_NAME=user-service-db
DAPR_ENABLED=false  # Set to true if testing with Dapr
```

## Running E2E Tests

Once the prerequisites are met, run the e2e tests:

```bash
npm run test:e2e
```

## Test Scope

The e2e tests cover:
- Health check endpoints
- User creation and retrieval
- User profile management
- User listing
- User deletion
- Error handling (404, 500, etc.)

## Continuous Integration

For CI/CD pipelines, consider:
1. Using Docker Compose to start dependencies
2. Adding a wait-for script to ensure services are ready
3. Cleaning up test data after tests complete

Example CI workflow:
```yaml
- name: Start services
  run: docker-compose up -d

- name: Wait for services
  run: ./scripts/wait-for-it.sh localhost:5000 -- echo "Service ready"

- name: Run E2E tests
  run: npm run test:e2e

- name: Cleanup
  run: docker-compose down
```

## Troubleshooting

### Connection Refused
- Ensure the user service is running on port 5000
- Check that MongoDB is accessible
- Verify network connectivity

### Tests Timeout
- Increase jest timeout in jest.config.js
- Check service logs for errors
- Ensure database has enough resources

### Test Data Conflicts
- E2E tests create unique test users with timestamps
- Clean up test data regularly if running locally
- Consider using separate test database
