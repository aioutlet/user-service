/**
 * User Service Consumer
 * Consumes messages from message broker for business events
 * This handles cross-service events that affect user state
 */

import '../shared/observability/logging/logger.js';
import '../shared/observability/tracing/setup.js';

import logger from '../shared/observability/logging/index.js';
import { registerEventHandlers } from './handlers/index.js';

// Placeholder for message broker - will be implemented
let messageBroker = null;
let isShuttingDown = false;

/**
 * Start the user consumer
 */
const startConsumer = async () => {
  try {
    logger.info('🚀 Starting User Service Consumer...');
    logger.info(`📍 Service: ${process.env.SERVICE_NAME || 'user-service'} v${process.env.SERVICE_VERSION || '1.0.0'}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // TODO: Initialize message broker when implemented
    // messageBroker = MessageBrokerFactory.create();
    // await messageBroker.connect();
    // logger.info('✅ Message broker connected');

    // TODO: Register event handlers
    // registerEventHandlers(messageBroker);
    // logger.info('📝 Event handlers registered');

    // TODO: Start consuming messages
    // await messageBroker.startConsuming();
    logger.info('👂 Consumer ready (message broker not yet implemented)');
    logger.info('🎯 User consumer will process: order.completed, fraud.detected, payment.milestone');
  } catch (error) {
    logger.error('❌ Failed to start user consumer:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    logger.warn('⚠️  Shutdown already in progress, forcing exit...');
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);

  try {
    // Close message broker connection
    if (messageBroker) {
      await messageBroker.close();
      logger.info('📦 Message broker connection closed');
    }

    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', { promise, reason });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the consumer
startConsumer();
