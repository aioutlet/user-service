/**
 * External Clients
 * Exports clients for external service communication
 */

export { default as daprClient } from './dapr.client.service.js';
export { secretManager, getDatabaseConfig, getJwtConfig } from './dapr.secret.manager.js';
