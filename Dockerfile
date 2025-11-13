# =============================================================================
# Multi-stage Dockerfile for Node.js User Service
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage - Common setup for all stages
# -----------------------------------------------------------------------------
FROM node:24-alpine AS base
WORKDIR /app

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S userservice -u 1001 -G nodejs

# -----------------------------------------------------------------------------
# Dependencies stage - Install all dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# Development stage - For local development with hot reload
# -----------------------------------------------------------------------------
FROM dependencies AS development

# Copy application code
COPY --chown=userservice:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R userservice:nodejs logs

# Switch to non-root user
USER userservice

# Expose port
EXPOSE 1002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:1002/readiness || exit 1

# Use dumb-init and start development server
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Build stage - Build the application
# -----------------------------------------------------------------------------
FROM dependencies AS build

# Copy source code
COPY . .

# Remove development dependencies
RUN npm ci --omit=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# Production stage - Optimized for production deployment
# -----------------------------------------------------------------------------
FROM base AS production

# Copy only production dependencies
COPY --from=build --chown=userservice:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=userservice:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R userservice:nodejs logs

# Remove unnecessary files for production
RUN rm -rf tests/ .git/ .github/ .vscode/ *.md .env.* docker-compose*

# Switch to non-root user
USER userservice

# Expose port
EXPOSE 1002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:1002/readiness || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# Labels for better image management
LABEL maintainer="AIOutlet Team"
LABEL service="user-service"
LABEL version="1.0.0"
