/**
 * RabbitMQ Broker Implementation
 * Implements the IMessageBroker interface for RabbitMQ
 */

import amqp from 'amqplib';
import logger from '../../../shared/observability/logging/index.js';
import IMessageBroker from '../IMessageBroker.js';

class RabbitMQBroker extends IMessageBroker {
  constructor(rabbitmqUrl) {
    super();
    this.rabbitmqUrl = rabbitmqUrl;
    this.connection = null;
    this.channel = null;
    this.eventHandlers = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    // Queue configuration from environment
    this.exchange = process.env.RABBITMQ_EXCHANGE || 'aioutlet.events';
    this.queues = {
      orderCompleted: process.env.RABBITMQ_QUEUE_ORDER_COMPLETED || 'order.completed',
      fraudDetected: process.env.RABBITMQ_QUEUE_FRAUD_DETECTED || 'fraud.detected',
      paymentMilestone: process.env.RABBITMQ_QUEUE_PAYMENT_MILESTONE || 'payment.milestone',
    };
  }

  /**
   * Connect to RabbitMQ
   */
  async connect() {
    try {
      if (this.isConnected) {
        logger.info('RabbitMQ already connected');
        return;
      }

      logger.info('Connecting to RabbitMQ...', {
        url: this.rabbitmqUrl.replace(/\/\/[^@]*@/, '//***:***@'),
      });

      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      this.isConnected = true;
      logger.info('RabbitMQ connected successfully');

      // Set up connection error handlers
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.channel.on('error', (err) => {
        logger.error('RabbitMQ channel error:', err);
      });

      this.channel.on('close', () => {
        logger.warn('RabbitMQ channel closed');
      });

      // Set up exchanges and queues
      await this.setupTopology();
      this.reconnectAttempts = 0;
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Set up RabbitMQ exchanges and queues
   */
  async setupTopology() {
    try {
      // Assert exchange
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      // Assert queues and bind to routing keys
      const queueBindings = [
        { queue: this.queues.orderCompleted, routingKey: 'order.completed' },
        { queue: this.queues.fraudDetected, routingKey: 'fraud.detected' },
        { queue: this.queues.paymentMilestone, routingKey: 'payment.milestone' },
      ];

      for (const { queue, routingKey } of queueBindings) {
        await this.channel.assertQueue(queue, { durable: true });
        await this.channel.bindQueue(queue, this.exchange, routingKey);
        logger.debug(`Bound queue ${queue} to routing key ${routingKey}`);
      }

      logger.info('RabbitMQ exchanges and queues setup completed');
    } catch (error) {
      logger.error('Failed to setup RabbitMQ topology:', error);
      throw error;
    }
  }

  /**
   * Register an event handler
   */
  registerEventHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
    logger.debug(`Registered handler for event type: ${eventType}`);
  }

  /**
   * Start consuming messages
   */
  async startConsuming() {
    if (!this.isConnected) {
      logger.warn('Cannot start consuming - RabbitMQ not connected');
      return;
    }

    try {
      // Start consuming from each queue
      for (const [, queueName] of Object.entries(this.queues)) {
        await this.startConsumer(queueName);
        logger.info(`Started consuming from queue: ${queueName}`);
      }

      logger.info('RabbitMQ consumers started successfully');
    } catch (error) {
      logger.error('Failed to start consuming:', error);
      throw error;
    }
  }

  /**
   * Start a consumer for a specific queue
   */
  async startConsumer(queueName) {
    const routingKey = this.getRoutingKeyFromQueue(queueName);

    await this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          const correlationId = msg.properties.correlationId || 'unknown';

          logger.debug(`Received message from ${queueName}:`, {
            routingKey: msg.fields.routingKey,
            correlationId,
            contentKeys: Object.keys(content),
          });

          // Find and execute handler
          const handler = this.eventHandlers.get(routingKey);
          if (handler) {
            await handler(content, correlationId);
            this.channel.ack(msg);
            logger.debug(`Message processed successfully: ${routingKey}`);
          } else {
            logger.warn(`No handler found for event type: ${routingKey}`);
            this.channel.ack(msg); // Ack to prevent redelivery
          }
        } catch (error) {
          logger.error(`Error processing message from ${queueName}:`, error);
          this.channel.nack(msg, false, false); // Dead letter the message
        }
      }
    });
  }

  /**
   * Get routing key from queue name
   */
  getRoutingKeyFromQueue(queueName) {
    const queueToRouting = {
      [this.queues.orderCompleted]: 'order.completed',
      [this.queues.fraudDetected]: 'fraud.detected',
      [this.queues.paymentMilestone]: 'payment.milestone',
    };
    return queueToRouting[queueName] || queueName;
  }

  /**
   * Close RabbitMQ connection
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        logger.info('RabbitMQ channel closed');
      }

      if (this.connection) {
        await this.connection.close();
        logger.info('RabbitMQ connection closed');
      }

      this.isConnected = false;
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
    }
  }

  /**
   * Check if connection is healthy
   */
  isHealthy() {
    return this.isConnected && this.connection && !this.connection.connection.closing;
  }

  /**
   * Get RabbitMQ statistics
   */
  async getStats() {
    if (!this.isHealthy()) {
      return null;
    }

    return {
      connected: this.isConnected,
      exchange: this.exchange,
      queues: this.queues,
      registeredHandlers: Array.from(this.eventHandlers.keys()),
    };
  }
}

export default RabbitMQBroker;
