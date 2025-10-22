import logger from '../shared/observability/index.js';
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
    // Generate startup correlation ID for tracing consumer initialization
    const startupCorrelationId = `consumer-startup-${Date.now()}`;

    logger.info('🚀 Starting User Service Consumer...', null, { correlationId: startupCorrelationId });
    logger.info(
      `📍 Service: ${process.env.SERVICE_NAME || 'user-service'} v${process.env.SERVICE_VERSION || '1.0.0'}`,
      null,
      { correlationId: startupCorrelationId }
    );
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, null, {
      correlationId: startupCorrelationId,
    });

    // Initialize message broker
    logger.info(`🔌 Connecting to message broker (${process.env.MESSAGE_BROKER_TYPE || 'rabbitmq'})...`, null, {
      correlationId: startupCorrelationId,
    });
    messageBroker = await MessageBrokerFactory.create();
    logger.info('✅ Message broker connected', null, { correlationId: startupCorrelationId });

    // Register event handlers
    registerEventHandlers(messageBroker);
    logger.info('📝 Event handlers registered', null, { correlationId: startupCorrelationId });

    // Start consuming messages
    await messageBroker.startConsuming();
    logger.info('👂 Consumer started consuming messages', null, { correlationId: startupCorrelationId });
    logger.info('🎯 User consumer processing: order.completed, fraud.detected, payment.milestone', null, {
      correlationId: startupCorrelationId,
    });
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
