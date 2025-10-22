/**
 * User Service Consumer
 * Consumes messages from message broker for business events
 * This handles cross-service events that affect user state
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config({ debug: false });

import '../shared/observability/logging/logger.js';
import '../shared/observability/tracing/setup.js';

import logger from '../shared/observability/logging/index.js';
import { MessageBrokerFactory } from './messaging/MessageBrokerFactory.js';
import { registerEventHandlers } from './handlers/index.js';

// Message broker instance
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

    // Initialize message broker
    logger.info(`🔌 Connecting to message broker (${process.env.MESSAGE_BROKER_TYPE || 'rabbitmq'})...`);
    messageBroker = MessageBrokerFactory.create();
    await messageBroker.connect();
    logger.info('✅ Message broker connected');

    // Register event handlers
    registerEventHandlers(messageBroker);
    logger.info('📝 Event handlers registered');

    // Start consuming messages
    await messageBroker.startConsuming();
    logger.info('👂 Consumer started consuming messages');
    logger.info('🎯 User consumer processing: order.completed, fraud.detected, payment.milestone');
  } catch (error) {
    logger.error('❌ Failed to start user consumer:', { error: error.message, stack: error.stack });
    console.error('Consumer startup error:', error);
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
