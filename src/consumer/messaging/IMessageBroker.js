/**
 * Message Broker Interface
 * Defines the contract for all message broker implementations (RabbitMQ, Kafka, etc.)
 * This abstraction allows easy switching between different message brokers without changing business logic.
 */

class IMessageBroker {
  /**
   * Connect to the message broker
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect() method must be implemented');
  }

  /**
   * Start consuming messages from configured queues/topics
   * @returns {Promise<void>}
   */
  async startConsuming() {
    throw new Error('startConsuming() method must be implemented');
  }

  /**
   * Register an event handler for a specific event type
   * @param {string} eventType - The event type/routing key
   * @param {Function} handler - The handler function (eventData, correlationId) => Promise<void>
   * @returns {void}
   */
  registerEventHandler(eventType, handler) {
    throw new Error('registerEventHandler() method must be implemented');
  }

  /**
   * Close the message broker connection
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('close() method must be implemented');
  }

  /**
   * Check if the message broker connection is healthy
   * @returns {boolean}
   */
  isHealthy() {
    throw new Error('isHealthy() method must be implemented');
  }

  /**
   * Get message broker statistics (optional)
   * @returns {Promise<Object>|null}
   */
  async getStats() {
    return null; // Optional implementation
  }
}

export default IMessageBroker;
