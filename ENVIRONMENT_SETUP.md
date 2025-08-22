# User Service - Environment Management Guide

This document describes the enhanced environment management and Docker setup for the User Service.

## 🚀 Quick Start

### Development Environment

```bash
# Setup and start development environment
./.ops/setup.sh

# Or with explicit environment
./.ops/setup.sh --env=development

# View logs
docker-compose logs -f

# Stop services
./.ops/teardown.sh
```

### Other Environments

```bash
# Staging
./.ops/setup.sh --env=staging

# Production
./.ops/setup.sh --env=production
```

## 📁 Environment Configuration

### Environment Files Structure

```
user-service/
├── .env.development.template    # Development template
├── .env.staging.template       # Staging template
├── .env.production.template    # Production template
├── .env.development           # Actual dev config (gitignored)
├── .env.staging              # Actual staging config (gitignored)
└── .env.production           # Actual prod config (gitignored)
```

### First-Time Setup

1. Copy template files:

   ```bash
   cp .env.development.template .env.development
   cp .env.staging.template .env.staging
   cp .env.production.template .env.production
   ```

2. Update configuration values in each file (especially secrets!)

3. Run setup:
   ```bash
   ./.ops/setup.sh --env=development
   ```

## 🐳 Docker Compose Structure

### Multi-Environment Docker Compose

- **`docker-compose.yml`** - Base configuration
- **`docker-compose.override.yml`** - Development overrides (auto-loaded)
- **`docker-compose.staging.yml`** - Staging overrides
- **`docker-compose.production.yml`** - Production overrides

### Multi-Stage Dockerfile

- **`base`** - Common setup
- **`dependencies`** - Install all dependencies
- **`development`** - Development with hot reload
- **`build`** - Build production artifacts
- **`production`** - Optimized production image

## 🗄️ Database Management

### Database Operations

```bash
# Setup database (create indexes, collections)
./.ops/db-manage.sh setup

# Seed with sample data
./.ops/db-manage.sh seed --env=development

# Check database status
./.ops/db-manage.sh status

# Reset database (⚠️ Data loss!)
./.ops/db-manage.sh reset --force

# Create backup
./.ops/db-manage.sh backup
```

### MongoDB Container Features

- Automatic initialization scripts
- Health checks
- Persistent volumes
- Environment-specific configuration

## 🛠️ Available Scripts

### NPM Scripts

```bash
# Development
npm run dev                 # Start with hot reload
npm run docker:up           # Start with Docker (development)
npm run docker:logs         # View container logs
npm run health              # Check service health

# Testing
npm test                    # Run tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage

# Database
npm run db:setup            # Setup database
npm run db:seed             # Seed sample data
npm run db:status           # Check database status

# Docker Operations
npm run docker:build        # Build production image
npm run docker:build:dev    # Build development image
npm run docker:up:staging   # Start staging environment
npm run docker:down         # Stop all services

# Validation
npm run validate            # Validate configuration
npm run lint                # Check code style
```

### Setup Script Options

```bash
./.ops/setup.sh [options]

Options:
  --env=ENVIRONMENT     Environment (development, staging, production)
  --skip-deps          Skip dependency installation
  --skip-db            Skip database setup
  --build              Force rebuild Docker images
  --logs               Show logs after startup
  -h, --help           Show help
```

### Teardown Script Options

```bash
./.ops/teardown.sh [options]

Options:
  --env=ENVIRONMENT    Environment to teardown
  --remove-volumes     Remove persistent volumes (⚠️ Data loss!)
  --remove-images      Remove Docker images
  --force              Skip confirmations
  -h, --help           Show help
```

## 🔧 Configuration System

### Environment-Specific Loading

The service automatically loads the appropriate `.env` file based on `NODE_ENV`:

```javascript
import { config } from './config/index.js';

// Configuration is automatically loaded and validated
console.log(config.server.port); // Port from .env file
console.log(config.database.uri); // MongoDB connection string
console.log(config.jwt.secret); // JWT secret (validated)
```

### Configuration Validation

- Required environment variables are validated on startup
- Production-specific security checks
- Automatic MongoDB connection string building
- Type conversion and validation

### Configuration Structure

```javascript
{
  env: 'development',
  server: { port: 3002, host: '0.0.0.0' },
  database: { uri: 'mongodb://...', options: {...} },
  jwt: { secret: '...', expiresIn: '24h' },
  services: { auth: '...', audit: '...' },
  security: { corsOrigin: [...], bcryptRounds: 12 },
  logging: { level: 'info', toConsole: true },
  // ... more configuration
}
```

## 🌐 Network Setup

### Shared Network

All services connect to an `aioutlet-network` for inter-service communication:

```bash
# Network is automatically created by setup script
docker network create aioutlet-network
```

### Service Discovery

Services can communicate using container names:

```javascript
// In .env.development
AUTH_SERVICE_URL=http://auth-service:3001
AUDIT_SERVICE_URL=http://audit-service:3007
```

## 📊 Health Checks

### Application Health Endpoints

- **`/health`** - Main health check (includes dependencies)
- **`/health/ready`** - Readiness probe (for K8s)
- **`/health/live`** - Liveness probe (for K8s)
- **`/metrics`** - Basic metrics

### Docker Health Checks

Containers include built-in health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1
```

### Testing Health

```bash
# Quick health check
npm run health

# Or directly
curl http://localhost:3002/health
```

## 🚨 Troubleshooting

### Common Issues

#### Configuration Errors

```bash
# Validate configuration
npm run validate

# Check environment file
cat .env.development
```

#### Database Connection Issues

```bash
# Check database status
npm run db:status

# Check container logs
docker-compose logs mongo-user-service

# Restart database
docker-compose restart mongo-user-service
```

#### Service Won't Start

```bash
# Check all logs
npm run docker:logs

# Check service health
docker-compose ps

# Rebuild images
./.ops/setup.sh --build
```

#### Port Conflicts

```bash
# Check what's using the port
netstat -tlnp | grep 3002

# Change port in .env file
echo "PORT=3003" >> .env.development
```

### Environment-Specific Troubleshooting

#### Development

- Hot reload issues: Check volume mounts in `docker-compose.override.yml`
- Missing dependencies: Run `./.ops/setup.sh` again

#### Staging/Production

- Image build issues: Use `--build` flag
- Secret management: Ensure all secrets are properly set
- Performance issues: Check resource limits in compose files

## 📋 Best Practices

### Environment Management

1. **Never commit actual `.env` files** - only templates
2. **Use strong secrets** in staging/production
3. **Validate configuration** before deployment
4. **Use different database names** per environment

### Development Workflow

1. Start with `npm run docker:up` for consistency
2. Use `npm run docker:logs` to monitor services
3. Run `npm run db:status` to verify database setup
4. Use `npm run validate` before committing changes

### Production Deployment

1. Review all environment variables
2. Use external managed databases when possible
3. Configure proper logging levels
4. Set up monitoring and alerting
5. Use secrets management systems

## 🔗 Related Services

This setup pattern is designed to be consistent across all AIOutlet microservices:

- **auth-service** - Authentication & authorization
- **audit-service** - Audit logging
- **notification-service** - Notifications
- **product-service** - Product management
- **order-service** - Order processing
- **payment-service** - Payment processing

Each service follows the same environment and Docker patterns for consistency.
