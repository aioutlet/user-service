/**
 * Dapr Client Helper
 * Provides utilities for Dapr service invocation, state management, and secrets
 */
import { DaprClient, CommunicationProtocolEnum } from '@dapr/dapr';
import config from '../core/config.js';
import logger from '../core/logger.js';

class DaprClientHelper {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = new DaprClient({
        daprHost: config.dapr.host,
        daprPort: config.dapr.httpPort,
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      });
    }
    return this.client;
  }

  /**
   * Invoke another service using Dapr service invocation
   * @param {string} appId - Target service app ID
   * @param {string} methodName - Method/endpoint to invoke
   * @param {string} httpMethod - HTTP method (GET, POST, PUT, DELETE)
   * @param {object} data - Request body (for POST, PUT)
   * @param {object} metadata - Additional metadata/headers
   * @returns {Promise<any>} Response from the invoked service
   */
  async invokeService(appId, methodName, httpMethod = 'GET', data = null, metadata = {}) {
    try {
      logger.debug('Invoking service via Dapr', {
        appId,
        methodName,
        httpMethod,
        metadata,
      });

      const client = this.getClient();
      const response = await client.invoker.invoke(appId, methodName, httpMethod, data, metadata);

      logger.info('Service invocation successful', {
        appId,
        methodName,
        statusCode: response?.status || 200,
      });

      return response;
    } catch (error) {
      logger.error('Service invocation failed', {
        appId,
        methodName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get a secret from Dapr secret store
   * @param {string} storeName - Name of the secret store
   * @param {string} key - Secret key
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Secret value
   */
  async getSecret(storeName, key, metadata = {}) {
    try {
      logger.debug('Getting secret from Dapr', { storeName, key });

      const client = this.getClient();
      const secret = await client.secret.get(storeName, key, metadata);

      logger.info('Secret retrieved successfully', { storeName, key });
      return secret;
    } catch (error) {
      logger.error('Failed to get secret', {
        storeName,
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get bulk secrets from Dapr secret store
   * @param {string} storeName - Name of the secret store
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} All secrets
   */
  async getBulkSecret(storeName, metadata = {}) {
    try {
      logger.debug('Getting bulk secrets from Dapr', { storeName });

      const client = this.getClient();
      const secrets = await client.secret.getBulk(storeName, metadata);

      logger.info('Bulk secrets retrieved successfully', {
        storeName,
        count: Object.keys(secrets).length,
      });
      return secrets;
    } catch (error) {
      logger.error('Failed to get bulk secrets', {
        storeName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save state to Dapr state store
   * @param {string} storeName - Name of the state store
   * @param {string} key - State key
   * @param {any} value - State value
   * @param {object} options - State options (etag, metadata, etc.)
   * @returns {Promise<void>}
   */
  async saveState(storeName, key, value, options = {}) {
    try {
      logger.debug('Saving state to Dapr', { storeName, key });

      const client = this.getClient();
      await client.state.save(storeName, [
        {
          key,
          value,
          ...options,
        },
      ]);

      logger.info('State saved successfully', { storeName, key });
    } catch (error) {
      logger.error('Failed to save state', {
        storeName,
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get state from Dapr state store
   * @param {string} storeName - Name of the state store
   * @param {string} key - State key
   * @param {object} options - State options
   * @returns {Promise<any>} State value
   */
  async getState(storeName, key, options = {}) {
    try {
      logger.debug('Getting state from Dapr', { storeName, key });

      const client = this.getClient();
      const state = await client.state.get(storeName, key, options);

      logger.info('State retrieved successfully', { storeName, key });
      return state;
    } catch (error) {
      logger.error('Failed to get state', {
        storeName,
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete state from Dapr state store
   * @param {string} storeName - Name of the state store
   * @param {string} key - State key
   * @param {object} options - State options
   * @returns {Promise<void>}
   */
  async deleteState(storeName, key, options = {}) {
    try {
      logger.debug('Deleting state from Dapr', { storeName, key });

      const client = this.getClient();
      await client.state.delete(storeName, key, options);

      logger.info('State deleted successfully', { storeName, key });
    } catch (error) {
      logger.error('Failed to delete state', {
        storeName,
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Publish event to Dapr pub/sub
   * @param {string} pubsubName - Name of the pub/sub component
   * @param {string} topic - Topic name
   * @param {object} data - Event data
   * @returns {Promise<void>}
   */
  async publishEvent(pubsubName, topic, data) {
    try {
      logger.debug('Publishing event via Dapr', { pubsubName, topic });

      const client = this.getClient();
      await client.pubsub.publish(pubsubName, topic, data);

      logger.info('Event published successfully', { pubsubName, topic });
    } catch (error) {
      logger.error('Failed to publish event', {
        pubsubName,
        topic,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get Dapr metadata
   * @returns {Promise<object>} Dapr metadata
   */
  async getMetadata() {
    try {
      const client = this.getClient();
      const metadata = await client.metadata.get();
      return metadata;
    } catch (error) {
      logger.error('Failed to get Dapr metadata', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
export const daprClient = new DaprClientHelper();
export default daprClient;
