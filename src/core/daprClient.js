/**
 * Dapr Client Helper
 * Provides utilities for Dapr metadata operations
 */
import { DaprClient, CommunicationProtocolEnum } from '@dapr/dapr';
import config from './config.js';
import logger from './logger.js';

class DaprClientService {
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
export const daprClient = new DaprClientService();
export default daprClient;
