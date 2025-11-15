import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import validateConfig from './validators/config.validator.js';
import config from './core/config.js';
import logger from './core/logger.js';
import connectDB from './database/db.js';
import adminRoutes from './routes/admin.routes.js';
import homeRoutes from './routes/home.routes.js';
import userRoutes from './routes/user.routes.js';
import operationalRoutes from './routes/operational.routes.js';
import traceContextMiddleware from './middlewares/traceContext.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

// Validate configuration before starting
validateConfig();
const app = express();

// Trust proxy for accurate IP address extraction
// This enables req.ip to work correctly behind reverse proxies
app.set('trust proxy', true);

app.use(traceContextMiddleware); // Add trace context middleware first
app.use(express.json());
app.use(cookieParser());

// Connect to database
await connectDB();

// Routes
app.use('', homeRoutes);
app.use('', operationalRoutes); // Operational endpoints at root level (standard practice)
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminRoutes);

// Centralized error handler for consistent error responses
app.use(errorHandler);

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
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (err) {
    logger.error('Error during graceful shutdown', { error: err.message });
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
