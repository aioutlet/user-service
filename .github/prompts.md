# AI Prompts for User Service

Common task prompts for AI coding assistants working on user-service.

---

## 📋 Table of Contents

- [API Endpoints](#api-endpoints)
- [Event Publishing](#event-publishing)
- [Database Operations](#database-operations)
- [Validation](#validation)
- [Testing](#testing)
- [Middleware](#middleware)
- [Bug Fixes](#bug-fixes)

---

## API Endpoints

### Create New Endpoint

```
Create a new [GET|POST|PATCH|DELETE] endpoint for user-service:
- Route: [endpoint path]
- Purpose: [what it does]
- Auth: [public|requireAuth|requireAuth + requireRole(['admin'])]
- Request body: [describe fields]
- Response: [describe response]
- Event to publish: [event name or none]
- Include validation, error handling, logging, and correlation ID
```

**Example:**
```
Create a new POST endpoint for user-service:
- Route: POST /users/preferences
- Purpose: Update user notification preferences
- Auth: requireAuth
- Request body: { emailNotifications: boolean, smsNotifications: boolean, marketingEmails: boolean }
- Response: { success: true, data: updatedPreferences }
- Event to publish: user.preferences_updated
- Include validation, error handling, logging, and correlation ID
```

---

### Add Admin Endpoint

```
Create an admin endpoint for user-service:
- Route: [endpoint path]
- Purpose: [what it does]
- Required role: admin
- Request params/body: [describe]
- Response: [describe]
- Include audit logging with admin user ID
```

**Example:**
```
Create an admin endpoint for user-service:
- Route: PATCH /admin/users/:id/verify-email
- Purpose: Manually verify user's email (admin action)
- Required role: admin
- Request params: userId in URL
- Response: { success: true, message: 'Email verified', data: { userId, isEmailVerified: true } }
- Include audit logging with admin user ID
```

---

## Event Publishing

### Add New Event Type

```
Add a new event publisher to messageBrokerServiceClient.js:
- Event type: [event.name]
- Triggered when: [describe trigger]
- Data payload: [describe fields]
- Include: correlationId, metadata (ipAddress, userAgent if applicable)
```

**Example:**
```
Add a new event publisher to messageBrokerServiceClient.js:
- Event type: user.password_changed
- Triggered when: User successfully changes their password
- Data payload: { userId, email, changedAt: timestamp, changedBy: 'self' or adminId }
- Include: correlationId, metadata (ipAddress, userAgent)
```

---

### Update Event Payload

```
Update the [event.name] event payload in messageBrokerServiceClient.js:
- Add fields: [list new fields]
- Remove fields: [list fields to remove]
- Update documentation
- Maintain backward compatibility
```

**Example:**
```
Update the user.created event payload in messageBrokerServiceClient.js:
- Add fields: phoneNumber, registrationSource ('web'|'mobile'|'api')
- Remove fields: none
- Update documentation
- Maintain backward compatibility
```

---

## Database Operations

### Add Field to User Model

```
Add a new field to the User model (user.model.js):
- Field name: [fieldName]
- Type: [String|Number|Boolean|Date|Array|Object]
- Required: [yes|no]
- Default value: [value]
- Validation: [describe rules]
- Create migration script if needed
```

**Example:**
```
Add a new field to the User model (user.model.js):
- Field name: lastLoginAt
- Type: Date
- Required: no
- Default value: null
- Validation: Must be a valid date
- Update controller to set this field on login
```

---

### Add Sub-Schema

```
Create a new sub-schema for User model:
- Schema name: [name]
- Location: src/schemas/[name].schema.js
- Fields: [describe fields with types and validation]
- Add to User model as: [fieldName]
- Create validator in src/validators/
```

**Example:**
```
Create a new sub-schema for User model:
- Schema name: socialLinks
- Location: src/schemas/socialLinks.schema.js
- Fields: { platform: String (enum: ['twitter', 'facebook', 'instagram']), url: String (URL format), isPublic: Boolean (default: false) }
- Add to User model as: socialLinks (array of socialLinksSchema)
- Create validator in src/validators/user.socialLinks.validator.js
```

---

### Create Database Query Helper

```
Create a database query helper in src/services/user.service.js:
- Function name: [functionName]
- Purpose: [what it does]
- Parameters: [list parameters]
- Return value: [describe]
- Include error handling and logging
```

**Example:**
```
Create a database query helper in src/services/user.service.js:
- Function name: getUsersByRole
- Purpose: Fetch all users with a specific role (paginated)
- Parameters: role (string), page (number), pageSize (number)
- Return value: { users: User[], totalCount: number, totalPages: number }
- Include error handling and logging
```

---

## Validation

### Add Input Validator

```
Create a new validator in src/validators/:
- Validator name: [name]
- Purpose: Validate [what]
- Validation rules: [describe rules]
- Error messages: [describe]
- Export as: [functionName]
```

**Example:**
```
Create a new validator in src/validators/:
- Validator name: user.phone.validator.js
- Purpose: Validate phone number format
- Validation rules: 
  - Format: +[country code]-[area code]-[number]
  - Max length: 20 characters
  - Allow optional parentheses and dashes
- Error messages: 'Invalid phone number format. Use +1-555-0123'
- Export as: isValidPhoneNumber(phoneNumber)
```

---

### Update Existing Validator

```
Update the [validatorName] validator:
- Add validation for: [new rules]
- Update error messages
- Add test cases
- Maintain backward compatibility
```

**Example:**
```
Update the user.validator.js password validator:
- Add validation for: minimum 1 uppercase, 1 lowercase, 1 number, 1 special character
- Update error messages to be more descriptive
- Add test cases for new rules
- Maintain backward compatibility (still allow 6-100 chars)
```

---

## Testing

### Create Unit Test

```
Create unit tests for [function/controller]:
- Test file: tests/unit/[name].test.js
- Test cases:
  1. Happy path: [describe]
  2. Error case: [describe]
  3. Edge case: [describe]
- Mock dependencies: [list]
- Use Jest, expect assertions, and proper setup/teardown
```

**Example:**
```
Create unit tests for createUser controller:
- Test file: tests/unit/controllers/user.controller.test.js
- Test cases:
  1. Happy path: should create user with valid data
  2. Error case: should return 400 if email already exists
  3. Edge case: should handle event publishing failure gracefully
- Mock dependencies: User.create, messageBrokerService.publishUserCreated
- Use Jest, expect assertions, and proper setup/teardown
```

---

### Create Integration Test

```
Create integration test for [feature]:
- Test file: tests/integration/[name].integration.test.js
- Test scenario: [describe full user journey]
- Setup: [describe test data needed]
- Assertions: [what to verify]
- Cleanup: [what to clean up after test]
```

**Example:**
```
Create integration test for user profile update:
- Test file: tests/integration/user-profile-update.integration.test.js
- Test scenario: User registers → logs in → updates profile → verifies changes
- Setup: Create test user, get auth token
- Assertions: User data updated in DB, user.updated event published, response status 200
- Cleanup: Delete test user from database
```

---

## Middleware

### Create Custom Middleware

```
Create a new middleware in src/middlewares/:
- Middleware name: [name].middleware.js
- Purpose: [what it does]
- Applied to: [which routes]
- Logic: [describe behavior]
- Error handling: [describe]
```

**Example:**
```
Create a new middleware in src/middlewares/:
- Middleware name: rateLimiter.middleware.js
- Purpose: Limit API requests per IP address
- Applied to: All POST/PUT/DELETE routes
- Logic: Allow 100 requests per 15 minutes, block if exceeded
- Error handling: Return 429 Too Many Requests with retry-after header
```

---

### Update Existing Middleware

```
Update the [middlewareName] middleware:
- Add functionality: [describe]
- Update error handling
- Add tests
- Update documentation
```

**Example:**
```
Update the auth.middleware.js:
- Add functionality: Support API key authentication in addition to JWT
- Check X-API-Key header if Authorization header is missing
- Update error handling to distinguish between missing token and invalid token
- Add tests for API key auth
- Update documentation in copilot-instructions.md
```

---

## Bug Fixes

### Fix Error Handling

```
Fix error handling in [function/file]:
- Issue: [describe the bug]
- Expected behavior: [what should happen]
- Current behavior: [what actually happens]
- Fix: [describe the solution]
- Add test to prevent regression
```

**Example:**
```
Fix error handling in createUser controller:
- Issue: When MongoDB connection fails, server returns 500 with no error message
- Expected behavior: Return 500 with meaningful error message and correlation ID
- Current behavior: Empty error response
- Fix: Wrap User.create in try/catch, return ErrorResponse with proper message
- Add test to verify error message is returned
```

---

### Fix Event Publishing

```
Fix event publishing issue in [function]:
- Problem: [describe issue]
- Root cause: [what's causing it]
- Solution: [how to fix]
- Verify: [how to test the fix]
```

**Example:**
```
Fix event publishing issue in updateUser controller:
- Problem: user.updated event not published when only preferences are changed
- Root cause: Event publishing logic only checks for top-level field changes
- Solution: Always publish event after any user.save() operation
- Verify: Update preferences and check message broker logs for event
```

---

### Performance Optimization

```
Optimize performance of [function/query]:
- Current performance: [metrics]
- Target performance: [goal]
- Bottleneck: [what's slow]
- Optimization approach: [how to improve]
- Measure impact: [how to verify improvement]
```

**Example:**
```
Optimize performance of getUsersByRole query:
- Current performance: 2000ms for 10,000 users
- Target performance: < 100ms
- Bottleneck: No index on roles field
- Optimization approach: Add compound index on (roles, createdAt)
- Measure impact: Run performance test before and after indexing
```

---

## Complex Tasks

### Implement New Feature

```
Implement [feature name] for user-service:

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Implementation steps:
1. Update User model with new fields
2. Create validators
3. Create API endpoints (routes + controllers)
4. Add event publishing
5. Update tests
6. Update documentation (copilot-instructions.md, PRD.md)

Acceptance criteria:
- [Criteria 1]
- [Criteria 2]
- [Criteria 3]
```

**Example:**
```
Implement email verification feature for user-service:

Requirements:
- User receives verification email on registration
- Email contains unique verification token (expires in 24 hours)
- User can verify email by clicking link
- Endpoint to resend verification email

Implementation steps:
1. Update User model: Add emailVerificationToken, emailVerificationExpires fields
2. Create validator for verification token format
3. Create API endpoints:
   - POST /users/verify-email (verify token)
   - POST /users/resend-verification (resend email)
4. Add event publishing: user.email_verification_sent, user.email_verified
5. Update tests: unit tests for token generation, integration test for full flow
6. Update documentation

Acceptance criteria:
- Verification token generated on user registration
- user.email_verification_sent event published
- Token expires after 24 hours
- user.email_verified event published on successful verification
- isEmailVerified field updated in database
```

---

### Refactor Code

```
Refactor [file/function] to improve [quality aspect]:

Current issues:
- [Issue 1]
- [Issue 2]

Refactoring goals:
- [Goal 1]
- [Goal 2]

Approach:
- [Step 1]
- [Step 2]

Maintain:
- Backward compatibility
- Existing tests pass
- Same API contract
```

**Example:**
```
Refactor user.controller.js to improve code organization:

Current issues:
- Controllers are too long (500+ lines)
- Duplicate validation logic across controllers
- Mixed concerns (business logic + HTTP handling)

Refactoring goals:
- Split into smaller, focused controllers
- Extract validation to dedicated functions
- Move business logic to service layer

Approach:
- Create user.service.js for business logic
- Extract validation to validators/
- Split user.controller.js into user.controller.js, address.controller.js, payment.controller.js
- Update routes to use new controllers

Maintain:
- Backward compatibility (same API endpoints)
- Existing tests pass
- Same API contract (request/response format unchanged)
```

---

## Quick Reference

### Common Prompts

**Add endpoint:**
```
Create a [METHOD] endpoint [ROUTE] that [PURPOSE] with auth [AUTH_TYPE]
```

**Add event:**
```
Add event [EVENT_NAME] published when [TRIGGER] with data [FIELDS]
```

**Add field:**
```
Add [FIELD_NAME] field to User model, type [TYPE], validation [RULES]
```

**Add validator:**
```
Create validator for [WHAT] in validators/, rules: [RULES]
```

**Add test:**
```
Create [unit|integration] test for [FUNCTION] covering [CASES]
```

**Fix bug:**
```
Fix [ISSUE] in [FILE], expected [EXPECTED], actual [ACTUAL]
```

**Optimize:**
```
Optimize [FUNCTION] performance from [CURRENT] to [TARGET]
```

---

**Note**: Always include correlation ID, structured logging, error handling, and event publishing (where applicable) when using these prompts.
