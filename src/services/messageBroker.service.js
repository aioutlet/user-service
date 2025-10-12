import axios from 'axios';
import config from '../config/index.js';
import logger from '../observability/logging/index.js';

/**
 * Message Broker Service
 * Handles publishing events to the centralized message broker service
 * This provides an abstraction layer between microservices and the actual message broker (RabbitMQ/Kafka/etc)
 */
class MessageBrokerService {
  constructor() {
    this.baseURL =
      config.messageBroker?.serviceUrl || process.env.MESSAGE_BROKER_SERVICE_URL || 'http://localhost:4000';
    this.apiKey = config.messageBroker?.apiKey || process.env.MESSAGE_BROKER_API_KEY || 'dev-api-key-12345';
    this.serviceName = config.serviceName || 'user-service';
    this.timeout = 5000; // 5 second timeout
    this.enabled = process.env.MESSAGE_BROKER_ENABLED !== 'false'; // Default to enabled
  }

  /**
   * Publish an event to the message broker
   * @param {string} topic - The routing key/topic (e.g., 'user.user.created')
   * @param {object} data - The event payload
   * @param {string} correlationId - Correlation ID for tracing
   * @param {number} priority - Message priority (0-10, higher is more important)
   * @returns {Promise<object|null>} Response data or null if failed
   */
  async publishEvent(topic, data, correlationId = null, priority = 0) {
    if (!this.enabled) {
      logger.debug('Message broker is disabled, skipping event publish', { topic });
      return null;
    }

    try {
      const payload = {
        topic,
        data,
        correlationId: correlationId || this.generateCorrelationId(),
        priority,
        timestamp: new Date().toISOString(),
        source: this.serviceName,
      };

      logger.debug('Publishing event to message broker', {
        topic,
        correlationId: payload.correlationId,
        dataKeys: Object.keys(data),
      });

      const response = await axios.post(`${this.baseURL}/api/v1/publish`, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-Service-Name': this.serviceName,
          'X-Correlation-Id': payload.correlationId,
          'Content-Type': 'application/json',
        },
        timeout: this.timeout,
      });

      logger.info('Event published successfully', {
        topic,
        messageId: response.data?.messageId,
        correlationId: payload.correlationId,
        status: response.status,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to publish event to message broker', {
        topic,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        correlationId,
        details: error.response?.data,
      });

      // Don't throw - just log the error
      // This prevents event publishing failures from breaking the main application flow
      return null;
    }
  }

  /**
   * Publish user.created event
   * @param {object} userData - The created user data
   * @param {string} correlationId - Correlation ID for tracing
   * @returns {Promise<object|null>}
   */
  async publishUserCreated(userData, correlationId = null) {
    return this.publishEvent(
      'user.user.created',
      {
        userId: userData._id?.toString() || userData.id?.toString(),
        email: userData.email,
        name: userData.name,
        isEmailVerified: userData.isEmailVerified || false,
        role: userData.role || 'user',
        createdAt: userData.createdAt || new Date().toISOString(),
      },
      correlationId,
      1 // Higher priority for user creation
    );
  }

  /**
   * Publish user.updated event
   * @param {object} userData - The updated user data
   * @param {Array<string>} updatedFields - List of fields that were updated
   * @param {string} correlationId - Correlation ID for tracing
   * @returns {Promise<object|null>}
   */
  async publishUserUpdated(userData, updatedFields = [], correlationId = null) {
    return this.publishEvent(
      'user.user.updated',
      {
        userId: userData._id?.toString() || userData.id?.toString(),
        email: userData.email,
        name: userData.name,
        updatedFields,
        updatedAt: userData.updatedAt || new Date().toISOString(),
      },
      correlationId,
      0
    );
  }

  /**
   * Publish user.deleted event
   * @param {string} userId - The ID of the deleted user
   * @param {string} correlationId - Correlation ID for tracing
   * @returns {Promise<object|null>}
   */
  async publishUserDeleted(userId, correlationId = null) {
    return this.publishEvent(
      'user.user.deleted',
      {
        userId: userId.toString(),
        deletedAt: new Date().toISOString(),
      },
      correlationId,
      0
    );
  }

  /**
   * Publish user.email.verified event
   * @param {string} userId - The ID of the user
   * @param {string} email - The verified email
   * @param {string} correlationId - Correlation ID for tracing
   * @returns {Promise<object|null>}
   */
  async publishUserEmailVerified(userId, email, correlationId = null) {
    return this.publishEvent(
      'user.email.verified',
      {
        userId: userId.toString(),
        email,
        verifiedAt: new Date().toISOString(),
      },
      correlationId,
      1
    );
  }

  /**
   * Publish user.password.changed event
   * @param {string} userId - The ID of the user
   * @param {string} correlationId - Correlation ID for tracing
   * @returns {Promise<object|null>}
   */
  async publishUserPasswordChanged(userId, correlationId = null) {
    return this.publishEvent(
      'user.password.changed',
      {
        userId: userId.toString(),
        changedAt: new Date().toISOString(),
      },
      correlationId,
      1
    );
  }

  /**
   * Generate a correlation ID if not provided
   * @returns {string}
   */
  generateCorrelationId() {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if message broker is healthy
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 3000,
      });
      return response.status === 200;
    } catch (error) {
      logger.warn('Message broker health check failed', {
        error: error.message,
      });
      return false;
    }
  }
}

// Export singleton instance
export default new MessageBrokerService();
