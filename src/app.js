import express from 'express';
import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js';
import './utils/tracing.js';
import cookieParser from 'cookie-parser';
import logger from './utils/logger.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

await connectDB();

app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'User Service API' });
});

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
