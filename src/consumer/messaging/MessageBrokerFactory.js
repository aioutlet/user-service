/**
 * Message Broker Factory
 * Creates the appropriate message broker instance based on configuration
 */

import logger from '../../shared/observability/logging/index.js';
import RabbitMQBroker from './brokers/RabbitMQBroker.js';
import KafkaBroker from './brokers/KafkaBroker.js';

export class MessageBrokerFactory {
  /**
   * Create a message broker instance based on environment configuration
   * @returns {IMessageBroker}
   */
  static create() {
    const brokerType = process.env.MESSAGE_BROKER_TYPE || 'rabbitmq';

    logger.info(`Creating message broker: ${brokerType}`);

    switch (brokerType.toLowerCase()) {
      case 'rabbitmq':
        const rabbitmqUrl = process.env.RABBITMQ_URL;
        if (!rabbitmqUrl) {
          throw new Error('RABBITMQ_URL environment variable is required when MESSAGE_BROKER_TYPE=rabbitmq');
        }
        return new RabbitMQBroker(rabbitmqUrl);

      case 'kafka':
        const kafkaBrokers = process.env.KAFKA_BROKERS;
        if (!kafkaBrokers) {
          throw new Error('KAFKA_BROKERS environment variable is required when MESSAGE_BROKER_TYPE=kafka');
        }
        return new KafkaBroker(kafkaBrokers.split(','));

      case 'azure-servicebus':
        throw new Error(
          'Azure Service Bus broker not yet implemented. Please use RabbitMQ (MESSAGE_BROKER_TYPE=rabbitmq)'
        );

      default:
        throw new Error(`Unsupported message broker type: ${brokerType}. Supported types: rabbitmq, kafka`);
    }
  }
}

export default MessageBrokerFactory;
