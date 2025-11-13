# User Service

The `user-service` is responsible for user data management, profile updates, and user account lifecycle for the AIOutlet platform. It is a core microservice in the authentication and user management architecture.

**Architecture Pattern**: Pure Publisher (Dapr Pub/Sub)

- Publishes events via Dapr SDK to RabbitMQ backend
- No direct RabbitMQ or consumer dependencies
- Consumes events via webhooks (future implementation)

---

## Features

- User registration and profile management
- Secure password storage and update (local credentials)
- Social login support (Google, Facebook, Twitter, etc.)
- Role-based access control (RBAC)
- Email verification status
- Account activation/deactivation
- Event publishing for user lifecycle changes (created, updated, deleted)
- Structured logging and error handling
- Distributed tracing support

---

## Architecture

This service is built with Node.js and Express, using Passport.js for authentication strategies and Mongoose for MongoDB object modeling.

The microservice follows a **pure publisher pattern**, publishing events via Dapr Pub/Sub to RabbitMQ backend. This provides:

- Broker-agnostic design (easy to switch from RabbitMQ to Kafka)
- Consistent authentication and authorization
- Centralized event routing
- Simplified service architecture

The service is designed to be deployed independently and can run locally, via Docker, or in Kubernetes (AKS).

---

## Project Structure

```
src/
├── controllers/       # Request handlers for all endpoints
├── database/         # Database connection and configuration
├── middlewares/      # Express middleware (auth, error handling, etc.)
├── models/          # Mongoose schemas and models
├── observability/   # Logging, tracing, and monitoring
├── routes/          # API route definitions
├── schemas/         # Validation schemas
├── services/        # Business logic and external service clients
├── types/           # TypeScript/JSDoc type definitions
├── utils/           # Utility functions and helpers
├── validators/      # Input validation logic
├── app.js          # Express application setup
└── server.js       # Server entry point
```

---

## Getting Started

### Prerequisites

- Node.js v16+
- MongoDB instance (local, Docker, or cloud)

### Environment Variables

Create a `.env` file in the root with the following variables:

```env
PORT=1002

# MongoDB connection variables
MONGODB_CONNECTION_SCHEME=mongodb
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_DB_NAME=user-service-db
MONGODB_DB_PARAMS=

# Logging configuration
LOG_LEVEL=info
LOG_TO_CONSOLE=true
LOG_TO_FILE=false
LOG_FILE_PATH=user-service.log

# OpenTelemetry tracing config (optional, for local dev)
OTEL_SERVICE_NAME=user-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

```

---

## API Endpoints

- `POST /users` — Register a new user
- `GET /users/:id` — Get user by ID
- `PATCH /users/:id` — Update user profile
- `POST /users/:id/password` — Set or reset user password
- `POST /users/:id/password/change` — Change user password (self-service)
- `DELETE /users/:id` — Delete user account
- `GET /users/findByEmail` — Find user by email
- `GET /users/findBySocial` — Find user by social login

Some endpoints require a valid JWT in the `Authorization` header.

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests.

---

## License

MIT License

---

## Contact

For questions or support, reach out to the AIOutlet dev team.
