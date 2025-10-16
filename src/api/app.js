import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { getConfigArray } from '../shared/validators/config.validator.js';
import connectDB from '../shared/database/db.js';
import adminRoutes from './routes/admin.routes.js';
import homeRoutes from './routes/home.routes.js';
import userRoutes from './routes/user.routes.js';
import operationalRoutes from './routes/operational.routes.js';
import logger from '../shared/observability/index.js';
import correlationIdMiddleware from './middlewares/correlationId.middleware.js';

// Config validation already done in server.js before this module loads
const app = express();

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
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminRoutes);
app.use('/', operationalRoutes);

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
  logger.info(`User service running on ${HOST}:${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
