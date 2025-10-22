/**
 * Kafka Broker Implementation (Placeholder)
 * Implements the IMessageBroker interface for Kafka
 */

import logger from '../../../shared/observability/logging/index.js';
import IMessageBroker from '../IMessageBroker.js';

class KafkaBroker extends IMessageBroker {
  constructor(brokers) {
    super();
    this.brokers = brokers;
    this.isConnected = false;
  }

  async connect() {
    logger.warn('Kafka broker implementation is not yet complete');
    throw new Error('Kafka broker not yet implemented. Please use RabbitMQ (MESSAGE_BROKER_TYPE=rabbitmq)');
  }

  async startConsuming() {
    throw new Error('Kafka broker not yet implemented');
  }

  registerEventHandler(_eventType, _handler) {
    throw new Error('Kafka broker not yet implemented');
  }

  async close() {
    logger.info('Kafka broker close (not implemented)');
  }

  isHealthy() {
    return false;
  }
}

export default KafkaBroker;
