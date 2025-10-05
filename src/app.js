import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

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

// Apply CORS before other middlewares
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
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

const PORT = parseInt(process.env.PORT, 10) || 3002;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`User service running on ${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Database: ${process.env.MONGODB_URI.replace(/\/\/[^@]*@/, '//***:***@')}`); // Hide credentials
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
