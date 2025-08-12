import express from 'express';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import adminRoutes from './routes/admin.routes.js';
import homeRoutes from './routes/home.routes.js';
import userRoutes from './routes/user.routes.js';
import logger from './utils/logger.js';
import correlationIdMiddleware from './middlewares/correlationId.middleware.js';
import './utils/tracing.js';

const app = express();
app.use(correlationIdMiddleware); // Add correlation ID middleware first
app.use(express.json());
app.use(cookieParser());

await connectDB();

app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminRoutes);

// Centralized error handler for consistent error responses
app.use((err, req, res, next) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`User service running on port ${PORT}`));
