# Copilot Instructions for User Service

This file provides context and guidelines for AI coding assistants working on the **user-service** microservice.

## Service Overview

**User Service** is a foundational Node.js/Express microservice that manages user accounts, profiles, addresses, payment methods, wishlists, and preferences. It follows the **Pure Publisher** pattern for event-driven communication.

**Key Characteristics:**
- **Technology**: Node.js 18+, Express 5.1.0, MongoDB 8.18.0, Mongoose ODM
- **Port**: 5000
- **Architecture Pattern**: Pure Publisher (AWS EventBridge style)
- **Database**: MongoDB (user data storage)
- **Event Communication**: HTTP POST to message-broker-service (no direct RabbitMQ/Kafka)
- **Authentication**: JWT validation (tokens provided by auth-service)
- **Dependencies**: Minimal - only MongoDB and message-broker-service

---

## Project Structure

```
src/
├── controllers/          # Request handlers (user, admin, operational)
├── database/            # MongoDB connection and configuration
├── middlewares/         # Express middleware (auth, error, correlation)
├── models/              # Mongoose schemas (User model)
├── observability/       # Logging (Winston) and tracing (OpenTelemetry)
├── routes/              # API route definitions
├── schemas/             # Sub-schemas (Address, Payment, Wishlist, Preferences)
├── services/            # Business logic and external clients
│   ├── messageBrokerServiceClient.js  # Event publishing
│   └── user.service.js                # User business logic
├── types/               # TypeScript/JSDoc type definitions
├── utils/               # Utility functions and helpers
├── validators/          # Input validation logic
├── app.js              # Express application setup
└── server.js           # Server entry point
```

---

## Key Patterns & Conventions

### 1. Event Publishing (AWS EventBridge Style)

**ALWAYS use the message-broker-service gateway for events:**

```javascript
import messageBrokerService from '../services/messageBrokerServiceClient.js';

// Publish user.created event
await messageBrokerService.publishUserCreated(user, correlationId, ipAddress, userAgent);
```

**Event Format:**
```javascript
{
  source: 'user-service',
  eventType: 'user.created',
  eventVersion: '1.0',
  eventId: 'evt-123-xyz',
  timestamp: '2025-10-24T10:30:00Z',
  correlationId: 'corr-abc-def',
  data: { userId, email, firstName, lastName },
  metadata: { environment, ipAddress, userAgent }
}
```

**Available Event Publishers:**
- `publishUserCreated(user, correlationId, ipAddress, userAgent)`
- `publishUserUpdated(user, correlationId, updatedBy, ipAddress, userAgent)`
- `publishUserDeleted(userId, correlationId)`
- `publishUserLoggedIn(userId, email, correlationId)`
- `publishUserLoggedOut(userId, email, correlationId)`

**❌ DON'T:**
```javascript
import amqplib from 'amqplib'; // Never import message broker libraries directly
```

**✅ DO:**
```javascript
import messageBrokerService from '../services/messageBrokerServiceClient.js';
```

### 2. Controller Pattern

All controllers use `asyncHandler` middleware for automatic error handling:

```javascript
import asyncHandler from '../middlewares/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import logger from '../observability/index.js';

export const createUser = asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;
  
  // 1. Validate input
  if (!email) {
    return next(new ErrorResponse('Email is required', 400, 'EMAIL_REQUIRED'));
  }
  
  // 2. Business logic
  const user = await User.create({ email, password, firstName, lastName });
  
  // 3. Publish event
  await messageBrokerService.publishUserCreated(
    user,
    req.correlationId,
    req.ip,
    req.get('user-agent')
  );
  
  // 4. Structured logging
  logger.info('User created successfully', null, {
    operation: 'create_user',
    userId: user._id.toString(),
    correlationId: req.correlationId
  });
  
  // 5. Response
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { userId: user._id, email: user.email }
  });
});
```

### 3. Validation

Use custom validators from `validators/` directory:

```javascript
import userValidator from '../validators/user.validator.js';

// Email validation
if (!userValidator.isValidEmail(email)) {
  return next(new ErrorResponse('Invalid email format', 400, 'INVALID_EMAIL'));
}

// Password validation
const passwordValidation = userValidator.isValidPassword(password);
if (!passwordValidation.valid) {
  return next(new ErrorResponse(passwordValidation.error, 400, 'INVALID_PASSWORD'));
}
```

### 4. Authentication & Authorization

**JWT Validation Middleware:**
```javascript
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

// Protected endpoint (requires valid JWT)
router.get('/profile', requireAuth, getProfile);

// Admin-only endpoint
router.get('/admin/users', requireAuth, requireRole(['admin']), getUsers);

// Optional auth (works with or without token)
router.get('/public', optionalAuth, getPublicData);
```

**Access User from JWT:**
```javascript
export const getProfile = asyncHandler(async (req, res) => {
  // req.user is populated by requireAuth middleware
  const userId = req.user.userId; // from JWT payload
  const email = req.user.email;
  const roles = req.user.roles;
  
  const user = await User.findById(userId);
  res.json({ success: true, data: user });
});
```

### 5. Correlation ID

Always use correlation ID for distributed tracing:

```javascript
// Correlation ID automatically added by middleware (correlationId.middleware.js)
// Access it via: req.correlationId

logger.info('Processing request', null, {
  operation: 'update_user',
  userId: user._id,
  correlationId: req.correlationId  // Include in all logs
});

// Pass to event publishing
await messageBrokerService.publishUserUpdated(user, req.correlationId);
```

### 6. Structured Logging

Use Winston logger with structured data:

```javascript
import logger from '../observability/index.js';

// Success logging
logger.info('User created', null, {
  operation: 'create_user',
  userId: user._id.toString(),
  email: user.email,
  correlationId: req.correlationId
});

// Error logging
logger.error('Failed to create user', null, {
  operation: 'create_user',
  error: error.message,
  stack: error.stack,
  correlationId: req.correlationId
});

// Warning logging
logger.warn('Event publishing failed', null, {
  operation: 'publish_event',
  eventType: 'user.created',
  userId: user._id.toString(),
  correlationId: req.correlationId
});
```

**Log Levels:**
- `ERROR`: Failures requiring immediate attention
- `WARN`: Degraded functionality (e.g., event publishing failed but user created)
- `INFO`: Normal operations (user created, updated, deleted)
- `DEBUG`: Detailed diagnostic information

**Never log sensitive data:**
- ❌ Passwords (even hashed)
- ❌ JWT tokens
- ❌ Full credit card numbers (only last 4 digits)
- ❌ Social security numbers

### 7. Error Handling

Use `ErrorResponse` class for consistent error responses:

```javascript
import ErrorResponse from '../utils/ErrorResponse.js';

// 400 Bad Request
return next(new ErrorResponse('Invalid email format', 400, 'INVALID_EMAIL'));

// 401 Unauthorized
return next(new ErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));

// 403 Forbidden
return next(new ErrorResponse('Insufficient permissions', 403, 'FORBIDDEN'));

// 404 Not Found
return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));

// 409 Conflict
return next(new ErrorResponse('Email already exists', 409, 'EMAIL_EXISTS'));

// 500 Internal Server Error
return next(new ErrorResponse('Database error', 500, 'DATABASE_ERROR'));
```

**Error Response Format:**
```json
{
  "success": false,
  "message": "Invalid email format",
  "errorCode": "INVALID_EMAIL",
  "correlationId": "corr-123-abc"
}
```

### 8. Database Operations

**User Model (Mongoose):**

```javascript
import User from '../models/user.model.js';

// Create user
const user = await User.create({
  email: 'john@example.com',
  password: 'SecurePass123',  // Auto-hashed by pre-save hook
  firstName: 'John',
  lastName: 'Doe',
  roles: ['customer']  // Default
});

// Find by ID
const user = await User.findById(userId);

// Find by email
const user = await User.findOne({ email: 'john@example.com' });

// Update user
const user = await User.findByIdAndUpdate(
  userId,
  { firstName: 'Jonathan', phoneNumber: '+1-555-9999' },
  { new: true, runValidators: true }
);

// Delete user
await User.findByIdAndDelete(userId);

// Add address
user.addresses.push({
  type: 'shipping',
  isDefault: true,
  fullName: 'John Doe',
  addressLine1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'USA'
});
await user.save();

// Remove address
user.addresses.id(addressId).remove();
await user.save();
```

**Password Hashing:**
```javascript
// Passwords are automatically hashed by pre-save hook in User model
// NEVER manually hash passwords unless absolutely necessary

const user = await User.create({
  email: 'john@example.com',
  password: 'PlainTextPassword'  // Automatically hashed with bcrypt (cost: 12)
});

// To verify password (done in auth-service)
const isMatch = await bcrypt.compare(candidatePassword, user.password);
```

### 9. API Response Format

**Success Response:**
```javascript
res.status(200).json({
  success: true,
  message: 'User updated successfully',  // Optional
  data: { userId, email, firstName }
});
```

**Error Response:**
```javascript
res.status(400).json({
  success: false,
  message: 'Validation failed',
  errorCode: 'VALIDATION_ERROR',
  correlationId: req.correlationId
});
```

**Paginated Response:**
```javascript
res.status(200).json({
  success: true,
  data: users,
  pagination: {
    page: 1,
    pageSize: 20,
    totalCount: 150,
    totalPages: 8
  }
});
```

### 10. Testing

**Unit Tests (Jest):**
```javascript
import { createUser } from '../controllers/user.controller.js';
import User from '../models/user.model.js';
import messageBrokerService from '../services/messageBrokerServiceClient.js';

jest.mock('../models/user.model.js');
jest.mock('../services/messageBrokerServiceClient.js');

describe('createUser Controller', () => {
  it('should create user and publish event', async () => {
    // Arrange
    const req = { body: { email: 'test@example.com', password: 'Pass123' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    
    User.create.mockResolvedValue({ _id: 'user-123', email: 'test@example.com' });
    messageBrokerService.publishUserCreated.mockResolvedValue({ success: true });
    
    // Act
    await createUser(req, res, next);
    
    // Assert
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));
    expect(messageBrokerService.publishUserCreated).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

**Integration Tests:**
```javascript
import request from 'supertest';
import app from '../app.js';

describe('POST /users', () => {
  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'SecurePass123' })
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('test@example.com');
  });
});
```

---

## Common Tasks

### Adding a New Endpoint

1. **Define route** in `src/routes/user.routes.js`:
```javascript
router.post('/addresses', requireAuth, addAddress);
```

2. **Create controller** in `src/controllers/user.controller.js`:
```javascript
export const addAddress = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const addressData = req.body;
  
  // Validate, process, publish event
  const user = await User.findById(userId);
  user.addresses.push(addressData);
  await user.save();
  
  await messageBrokerService.publishUserUpdated(user, req.correlationId);
  
  res.status(200).json({ success: true, data: user.addresses });
});
```

3. **Add validation** in `src/validators/user.address.validator.js`

4. **Write tests** in `tests/`

### Publishing a New Event Type

1. **Add event publisher** in `src/services/messageBrokerServiceClient.js`:
```javascript
export async function publishUserEmailVerified(userId, email, correlationId) {
  const data = { userId, email, verifiedAt: new Date().toISOString() };
  return await publishEvent('user.email_verified', data, {}, correlationId);
}
```

2. **Use in controller**:
```javascript
await messageBrokerService.publishUserEmailVerified(user._id, user.email, req.correlationId);
```

3. **Document in PRD** (events section)

### Adding a New Sub-Schema

1. **Create schema** in `src/schemas/`:
```javascript
// loyaltyPoints.schema.js
import mongoose from 'mongoose';

const loyaltyPointsSchema = new mongoose.Schema({
  points: { type: Number, default: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold'], default: 'bronze' },
  lastEarned: { type: Date }
});

export default loyaltyPointsSchema;
```

2. **Add to User model**:
```javascript
import loyaltyPointsSchema from '../schemas/loyaltyPoints.schema.js';

const userSchema = new mongoose.Schema({
  // ... existing fields
  loyaltyPoints: loyaltyPointsSchema
});
```

3. **Create validator** in `src/validators/user.loyalty.validator.js`

---

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_CONNECTION_SCHEME=mongodb
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_DB_NAME=user-service-db
MONGODB_DB_PARAMS=

# Message Broker Service
MESSAGE_BROKER_SERVICE_URL=http://localhost:4000
MESSAGE_BROKER_API_KEY=dev-api-key-12345

# Logging
LOG_LEVEL=info
LOG_TO_CONSOLE=true
LOG_TO_FILE=false

# OpenTelemetry (optional)
OTEL_SERVICE_NAME=user-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

---

## Dependencies

### Internal Service Dependencies
- **message-broker-service** (Port 4000): Event publishing gateway

### Infrastructure Dependencies
- **MongoDB** (Port 27017): Primary database

### No Dependencies On
- ❌ auth-service (auth-service depends on user-service, not vice versa)
- ❌ RabbitMQ/Kafka (abstracted by message-broker-service)
- ❌ External APIs

---

## Common Gotchas

### 1. Event Publishing Failures
**Problem**: Event publishing fails but user operation succeeds  
**Solution**: Graceful degradation - log warning, don't throw error
```javascript
const publishResult = await messageBrokerService.publishUserCreated(user, correlationId);
if (!publishResult) {
  logger.warn('Event publishing failed, but user created successfully', {
    operation: 'create_user',
    userId: user._id,
    correlationId
  });
}
// Continue - don't fail the request
```

### 2. Password Handling
**Problem**: Accidentally logging or returning passwords  
**Solution**: 
- Use `.select('-password')` in queries
- Password auto-hashed by pre-save hook
- Never include password in responses

```javascript
// DON'T
const user = await User.findById(userId);
res.json({ data: user }); // Includes password hash!

// DO
const user = await User.findById(userId).select('-password');
res.json({ data: user }); // Safe
```

### 3. Mongoose Schema Validation
**Problem**: Validation errors not caught properly  
**Solution**: Use `runValidators: true` in updates
```javascript
await User.findByIdAndUpdate(
  userId,
  { email: 'newemail@example.com' },
  { new: true, runValidators: true }  // ✅ Validates email format
);
```

### 4. Correlation ID Propagation
**Problem**: Missing correlation ID in logs/events  
**Solution**: Always pass `req.correlationId` to services/events
```javascript
// DON'T
await messageBrokerService.publishUserCreated(user);

// DO
await messageBrokerService.publishUserCreated(user, req.correlationId, req.ip, req.get('user-agent'));
```

### 5. JWT Dependency Confusion
**Problem**: Thinking user-service validates JWTs  
**Solution**: User-service RECEIVES pre-validated tokens from auth-service
- JWT validation happens in auth-service
- User-service receives `req.user` from auth middleware (already decoded)
- User-service never calls auth-service APIs

---

## Code Style & Best Practices

### Naming Conventions
- **Files**: `camelCase.js` (e.g., `user.controller.js`)
- **Functions**: `camelCase` (e.g., `createUser`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MESSAGE_BROKER_SERVICE_URL`)
- **Classes**: `PascalCase` (e.g., `ErrorResponse`)

### Async/Await
- Always use `async/await` (no callbacks)
- Use `asyncHandler` middleware for controllers
- Handle errors with try/catch in services

### Imports
```javascript
// ES6 modules (not CommonJS)
import express from 'express';  // ✅
const express = require('express');  // ❌
```

### Comments
```javascript
// JSDoc for functions
/**
 * Create a new user
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
export const createUser = asyncHandler(async (req, res, next) => {
  // Implementation
});
```

---

## Health Checks & Observability

### Health Check Endpoints
```javascript
GET /health          // Overall service health
GET /health/ready    // Kubernetes readiness probe
GET /health/live     // Kubernetes liveness probe
GET /metrics         // Prometheus metrics
```

### Monitoring
- Winston structured logs → stdout
- OpenTelemetry tracing (optional)
- Prometheus metrics (planned)
- Correlation ID in all logs

---

## Deployment

### Docker
```bash
docker build -t user-service:latest .
docker run -p 5000:5000 --env-file .env user-service:latest
```

### Local Development
```bash
npm install
npm run dev  # nodemon with hot reload
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## Quick Reference

### Most Used Imports
```javascript
import ErrorResponse from '../utils/ErrorResponse.js';
import logger from '../observability/index.js';
import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import messageBrokerService from '../services/messageBrokerServiceClient.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
```

### Most Used Patterns
```javascript
// 1. Controller with auth
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId).select('-password');
  res.json({ success: true, data: user });
});

// 2. Create with event
const user = await User.create(userData);
await messageBrokerService.publishUserCreated(user, req.correlationId);

// 3. Update with event
const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
await messageBrokerService.publishUserUpdated(user, req.correlationId);

// 4. Error handling
if (!user) {
  return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
}
```

---

**Remember**: User-service is a **foundational service** - keep it simple, reliable, and focused on user data management. All event communication goes through message-broker-service, never directly to message brokers.
