# User Service

The `user-service` is responsible for user data management, profile updates, and user account lifecycle for the AIOutlet platform. It is a core microservice in the authentication and user management architecture.

---

## Features

- User registration and profile management
- Secure password storage and update (local credentials)
- Social login support (Google, Facebook, Twitter, etc.)
- Role-based access control (RBAC)
- Email verification status
- Account activation/deactivation
- Structured logging and error handling
- Distributed tracing support

---

## Architecture

This service is built with Node.js and Express, using Passport.js for authentication strategies and Mongoose for MongoDB object modeling.

The microservice is designed to be deployed independently and can run locally, via Docker, or in Kubernetes (AKS).

---

## Getting Started

### Prerequisites

- Node.js v16+
- MongoDB instance (local, Docker, or cloud)

### Environment Variables

Create a `.env` file in the root with the following variables:

```env
PORT=5000

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
