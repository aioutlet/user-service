import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import config from './config/index.js';
import { validateConfig } from './validators/config.validator.js';
import connectDB from './database/connection.js';
import adminRoutes from './routes/admin.routes.js';
import homeRoutes from './routes/home.routes.js';
import userRoutes from './routes/user.routes.js';
import logger from './observability/index.js';
import correlationIdMiddleware from './middlewares/correlationId.middleware.js';
import rateLimitMiddleware from './middlewares/rateLimit.middleware.js';
import { health, readiness, liveness, metrics } from './controllers/operational.controller.js';

const { generalRateLimit } = rateLimitMiddleware;

const app = express();

// Validate configuration before starting the app
try {
  validateConfig(config);
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

// Apply CORS before other middlewares
app.use(
  cors({
    origin: config.security.corsOrigin,
    credentials: true,
  }),
);

app.use(correlationIdMiddleware); // Add correlation ID middleware first

// Apply general rate limiting (will be skipped for health checks automatically)
app.use(generalRateLimit);

app.use(express.json());
app.use(cookieParser());

// Connect to database
await connectDB();

// Routes
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminRoutes);

// Operational endpoints (for monitoring, load balancers, K8s probes)
app.get('/health', health); // Main health check
app.get('/health/ready', readiness); // Readiness probe
app.get('/health/live', liveness); // Liveness probe
app.get('/metrics', metrics); // Basic metrics

// Centralized error handler for consistent error responses
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      details: err.details || null,
      traceId: req.traceId || null,
    },
  });
});

app.listen(config.server.port, config.server.host, () => {
  logger.info(`User service running on ${config.server.host}:${config.server.port}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Database: ${config.database.uri.replace(/\/\/[^@]*@/, '//***:***@')}`); // Hide credentials
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
