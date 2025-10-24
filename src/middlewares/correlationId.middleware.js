import { v4 as uuidv4 } from 'uuid';
import logger from '../observability/index.js';

/**
 * Middleware to handle correlation IDs for distributed tracing
 * Also logs request/response details for better debugging
 */
const correlationIdMiddleware = (req, res, next) => {
  // Get correlation ID from header or generate new one
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  const startTime = Date.now();

  // Set correlation ID in request object for use in controllers/services
  req.correlationId = correlationId;

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Add to locals for access in templates/views if needed
  res.locals.correlationId = correlationId;

  // Log incoming request with body preview for POST/PUT/PATCH
  const bodyPreview =
    ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body ? Object.keys(req.body).join(', ') : undefined;

  logger.info(`→ ${req.method} ${req.originalUrl}`, {
    correlationId,
    method: req.method,
    url: req.originalUrl,
    bodyFields: bodyPreview,
    userId: req.user?.id,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[level](`← ${req.method} ${req.originalUrl} ${statusCode} (${duration}ms)`, {
      correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration,
      userId: req.user?.id,
    });

    return originalSend.call(this, data);
  };

  next();
};

export default correlationIdMiddleware;
