/**
 * Service Communication Helper with Correlation ID
 * Use this for making HTTP requests between microservices with proper correlation ID propagation
 */

import axios from 'axios';
import CorrelationIdHelper from './correlationId.helper.js';

class ServiceClient {
  constructor(baseURL, timeout = 5000) {
    this.client = axios.create({
      baseURL,
      timeout,
    });
  }

  /**
   * Make a GET request with correlation ID
   */
  async get(req, endpoint, config = {}) {
    const headers = {
      ...CorrelationIdHelper.createHeaders(req),
      ...(config.headers || {}),
    };

    return this.client.get(endpoint, {
      ...config,
      headers,
    });
  }

  /**
   * Make a POST request with correlation ID
   */
  async post(req, endpoint, data, config = {}) {
    const headers = {
      ...CorrelationIdHelper.createHeaders(req),
      ...(config.headers || {}),
    };

    return this.client.post(endpoint, data, {
      ...config,
      headers,
    });
  }

  /**
   * Make a PUT request with correlation ID
   */
  async put(req, endpoint, data, config = {}) {
    const headers = {
      ...CorrelationIdHelper.createHeaders(req),
      ...(config.headers || {}),
    };

    return this.client.put(endpoint, data, {
      ...config,
      headers,
    });
  }

  /**
   * Make a DELETE request with correlation ID
   */
  async delete(req, endpoint, config = {}) {
    const headers = {
      ...CorrelationIdHelper.createHeaders(req),
      ...(config.headers || {}),
    };

    return this.client.delete(endpoint, {
      ...config,
      headers,
    });
  }
}

export default ServiceClient;
