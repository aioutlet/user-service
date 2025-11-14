/**
 * Dapr Secret Management Service
 * Provides secret management using Dapr's secret store building block.
 *
 * NOTE: Environment variables are loaded in server.js before this module is imported
 */

import { DaprClient } from '@dapr/dapr';
import logger from '../core/logger.js';
import config from '../core/config.js';

class DaprSecretManager {
  constructor() {
    this.daprHost = config.dapr.host;
    this.daprPort = config.dapr.httpPort;
    this.secretStoreName = 'local-secret-store';

    logger.info('Secret manager initialized', {
      event: 'secret_manager_init',
      secretStore: this.secretStoreName,
    });
  }

  /**
   * Get a secret value from Dapr secret store
   * @param {string} secretName - Name of the secret to retrieve
   * @returns {Promise<string|null>} Secret value or null if not found
   */
  async getSecret(secretName) {
    try {
      const client = new DaprClient({
        daprHost: this.daprHost,
        daprPort: this.daprPort,
      });

      const response = await client.secret.get(this.secretStoreName, secretName);

      // Handle different response types
      if (response && typeof response === 'object') {
        // Response is typically an object like { secretName: 'value' }
        const value = response[secretName];
        if (value !== undefined && value !== null) {
          logger.debug('Retrieved secret from Dapr', {
            event: 'secret_retrieved',
            secretName,
            source: 'dapr',
            store: this.secretStoreName,
          });
          return String(value);
        }

        // If not found by key, try getting first value
        const values = Object.values(response);
        if (values.length > 0 && values[0] !== undefined) {
          logger.debug('Retrieved secret from Dapr (first value)', {
            event: 'secret_retrieved',
            secretName,
            source: 'dapr',
            store: this.secretStoreName,
          });
          return String(values[0]);
        }
      }

      // If we get here, no value was found in Dapr
      logger.error('Secret not found in Dapr store', {
        event: 'secret_not_found',
        secretName,
        store: this.secretStoreName,
      });
      return null;
    } catch (error) {
      logger.error(`Failed to get secret from Dapr: ${error.message}`, {
        event: 'secret_retrieval_error',
        secretName,
        error: error.message,
        store: this.secretStoreName,
      });
      throw error;
    }
  }

  /**
   * Get multiple secrets at once
   * @param {string[]} secretNames - List of secret names to retrieve
   * @returns {Promise<Object>} Object mapping secret names to their values
   */
  async getMultipleSecrets(secretNames) {
    const secrets = {};
    for (const name of secretNames) {
      secrets[name] = await this.getSecret(name);
    }
    return secrets;
  }

  /**
   * Get database configuration from secrets or environment variables
   * @returns {Promise<Object>} Database connection parameters
   */
  async getDatabaseConfig() {
    const [host, port, username, password, database, authSource] = await Promise.all([
      this.getSecret('MONGODB_HOST'),
      this.getSecret('MONGODB_PORT'),
      this.getSecret('MONGO_INITDB_ROOT_USERNAME'),
      this.getSecret('MONGO_INITDB_ROOT_PASSWORD'),
      this.getSecret('MONGO_INITDB_DATABASE'),
      this.getSecret('MONGODB_AUTH_SOURCE'),
    ]);

    return {
      host: host || '127.0.0.1',
      port: parseInt(port || '27018', 10),
      username: username || 'admin',
      password: password || 'admin123',
      database: database || 'user_service_db',
      authSource: authSource || 'admin',
    };
  }

  /**
   * Get JWT configuration from secrets
   * @returns {Promise<Object>} JWT configuration parameters
   */
  async getJwtConfig() {
    const secret = await this.getSecret('JWT_SECRET');

    return {
      secret: secret || 'default-secret-key',
      expire: '24h',
    };
  }
}

// Global instance
export const secretManager = new DaprSecretManager();

// Helper functions for easy access
export const getDatabaseConfig = () => secretManager.getDatabaseConfig();
export const getJwtConfig = () => secretManager.getJwtConfig();
