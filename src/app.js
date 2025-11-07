import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import validateConfig, { getConfigArray } from './validators/config.validator.js';
import config from './core/config.js';
import logger from './core/logger.js';
import connectDB from './database/db.js';
import adminRoutes from './routes/admin.routes.js';
import homeRoutes from './routes/home.routes.js';
import userRoutes from './routes/user.routes.js';
import operationalRoutes from './routes/operational.routes.js';
import correlationIdMiddleware from './middlewares/correlationId.middleware.js';

// Validate configuration before starting
validateConfig();
const app = express();

// Trust proxy for accurate IP address extraction
// This enables req.ip to work correctly behind reverse proxies
app.set('trust proxy', true);

// Apply CORS before other middlewares
const corsOrigins = getConfigArray('CORS_ORIGINS');

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(correlationIdMiddleware); // Add correlation ID middleware first
app.use(express.json());
app.use(cookieParser());

// Connect to database
await connectDB();

// Routes
app.use('/api', homeRoutes);
app.use('/api', operationalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminRoutes);

// Centralized error handler for consistent error responses
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const correlationId = req.correlationId || 'no-correlation';

  // Log the error with full details
  logger.error(`Request failed: ${req.method} ${req.originalUrl} - ${err.message || 'Unknown error'}`, {
    correlationId,
    method: req.method,
    url: req.originalUrl,
    status,
    errorCode: err.code || 'INTERNAL_ERROR',
    errorMessage: err.message,
    errorStack: err.stack,
    userId: req.user?._id,
  });

  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      details: err.details || null,
      traceId: req.traceId || null,
    },
  });
});

const PORT = config.service.port;
const HOST = config.service.host;

app.listen(PORT, HOST, () => {
  logger.info(`User service running on ${HOST}:${PORT} in ${config.service.nodeEnv} mode`, {
    service: config.service.name,
    version: config.service.version,
    dapr: {
      enabled: true,
      appId: config.dapr.appId,
      httpPort: config.dapr.httpPort,
    },
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
