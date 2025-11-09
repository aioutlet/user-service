/**
 * User Service Event Publisher
 * Publishes CloudEvents-compliant events via Dapr pub/sub
 */
import { DaprClient } from '@dapr/dapr';
import logger from '../core/logger.js';
import config from '../core/config.js';

// Lazy initialization of Dapr client
let daprClient = null;

function isDaprEnabled() {
  return (process.env.DAPR_ENABLED || 'true').toLowerCase() === 'true';
}

function getDaprClient() {
  if (!isDaprEnabled()) {
    return null;
  }

  if (!daprClient) {
    daprClient = new DaprClient({
      daprHost: config.dapr.host,
      daprPort: config.dapr.httpPort,
    });
  }
  return daprClient;
}

/**
 * Publish user.created event
 * @param {object} user - User object that was created
 * @param {string} correlationId - Correlation ID for tracking
 * @param {string} [ipAddress] - IP address of the client making the request
 * @param {string} [userAgent] - User agent string of the client
 * @returns {Promise<void>}
 */
export async function publishUserCreated(user, correlationId, ipAddress = null, userAgent = null) {
  const client = getDaprClient();
  if (!client) {
    logger.debug('Dapr disabled, skipping event publish', {
      operation: 'event_publish',
      eventType: 'user.created',
      userId: user._id.toString(),
    });
    return;
  }

  try {
    const eventData = {
      specversion: '1.0',
      type: 'com.aioutlet.user.created',
      source: 'user-service',
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        userId: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        roles: user.roles,
        tier: user.tier,
        createdAt: user.createdAt,
      },
      metadata: {
        correlationId,
        ipAddress,
        userAgent,
        environment: config.service.nodeEnv,
      },
    };

    await client.pubsub.publish(config.dapr.pubsubName, 'user.created', eventData);

    logger.info('Published user.created event', null, {
      operation: 'event_publish',
      eventType: 'user.created',
      userId: user._id.toString(),
      correlationId,
    });
  } catch (error) {
    logger.error('Failed to publish user.created event', null, {
      operation: 'event_publish',
      eventType: 'user.created',
      userId: user._id?.toString(),
      error: error.message,
      correlationId,
    });
    // Don't throw - graceful degradation
  }
}

/**
 * Publish user.updated event
 * @param {object} user - Updated user object
 * @param {string} correlationId - Correlation ID for tracking
 * @param {string} [updatedBy] - ID of user who performed the update
 * @param {string} [ipAddress] - IP address of the client
 * @param {string} [userAgent] - User agent string
 * @returns {Promise<void>}
 */
export async function publishUserUpdated(user, correlationId, updatedBy = null, ipAddress = null, userAgent = null) {
  const client = getDaprClient();
  if (!client) {
    logger.debug('Dapr disabled, skipping event publish', {
      operation: 'event_publish',
      eventType: 'user.updated',
      userId: user._id.toString(),
    });
    return;
  }

  try {
    const eventData = {
      specversion: '1.0',
      type: 'com.aioutlet.user.updated',
      source: 'user-service',
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        userId: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        roles: user.roles,
        tier: user.tier,
        updatedAt: user.updatedAt,
        updatedBy,
      },
      metadata: {
        correlationId,
        ipAddress,
        userAgent,
        environment: config.service.nodeEnv,
      },
    };

    await client.pubsub.publish(config.dapr.pubsubName, 'user.updated', eventData);

    logger.info('Published user.updated event', null, {
      operation: 'event_publish',
      eventType: 'user.updated',
      userId: user._id.toString(),
      correlationId,
    });
  } catch (error) {
    logger.error('Failed to publish user.updated event', null, {
      operation: 'event_publish',
      eventType: 'user.updated',
      userId: user._id?.toString(),
      error: error.message,
      correlationId,
    });
    // Don't throw - graceful degradation
  }
}

/**
 * Publish user.deleted event
 * @param {string} userId - User ID
 * @param {string} correlationId - Correlation ID for tracking
 * @returns {Promise<void>}
 */
export async function publishUserDeleted(userId, correlationId) {
  const client = getDaprClient();
  if (!client) {
    logger.debug('Dapr disabled, skipping event publish', {
      operation: 'event_publish',
      eventType: 'user.deleted',
      userId,
    });
    return;
  }

  try {
    const eventData = {
      specversion: '1.0',
      type: 'com.aioutlet.user.deleted',
      source: 'user-service',
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        userId,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        correlationId,
        environment: config.service.nodeEnv,
      },
    };

    await client.pubsub.publish(config.dapr.pubsubName, 'user.deleted', eventData);

    logger.info('Published user.deleted event', null, {
      operation: 'event_publish',
      eventType: 'user.deleted',
      userId,
      correlationId,
    });
  } catch (error) {
    logger.error('Failed to publish user.deleted event', null, {
      operation: 'event_publish',
      eventType: 'user.deleted',
      userId,
      error: error.message,
      correlationId,
    });
    // Don't throw - graceful degradation
  }
}

/**
 * Publish user.logged_in event
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} correlationId - Correlation ID for tracking
 * @param {string} [ipAddress] - IP address
 * @param {string} [userAgent] - User agent
 * @returns {Promise<void>}
 */
export async function publishUserLoggedIn(userId, email, correlationId, ipAddress = null, userAgent = null) {
  const client = getDaprClient();
  if (!client) {
    logger.debug('Dapr disabled, skipping event publish', {
      operation: 'event_publish',
      eventType: 'user.logged_in',
      userId,
    });
    return;
  }

  try {
    const eventData = {
      specversion: '1.0',
      type: 'com.aioutlet.user.logged_in',
      source: 'user-service',
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        userId,
        email,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        correlationId,
        ipAddress,
        userAgent,
        environment: config.service.nodeEnv,
      },
    };

    await client.pubsub.publish(config.dapr.pubsubName, 'user.logged_in', eventData);

    logger.info('Published user.logged_in event', null, {
      operation: 'event_publish',
      eventType: 'user.logged_in',
      userId,
      correlationId,
    });
  } catch (error) {
    logger.error('Failed to publish user.logged_in event', null, {
      operation: 'event_publish',
      eventType: 'user.logged_in',
      userId,
      error: error.message,
      correlationId,
    });
    // Don't throw - graceful degradation
  }
}

/**
 * Publish user.logged_out event
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} correlationId - Correlation ID for tracking
 * @returns {Promise<void>}
 */
export async function publishUserLoggedOut(userId, email, correlationId) {
  const client = getDaprClient();
  if (!client) {
    logger.debug('Dapr disabled, skipping event publish', {
      operation: 'event_publish',
      eventType: 'user.logged_out',
      userId,
    });
    return;
  }

  try {
    const eventData = {
      specversion: '1.0',
      type: 'com.aioutlet.user.logged_out',
      source: 'user-service',
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        userId,
        email,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        correlationId,
        environment: config.service.nodeEnv,
      },
    };

    await client.pubsub.publish(config.dapr.pubsubName, 'user.logged_out', eventData);

    logger.info('Published user.logged_out event', null, {
      operation: 'event_publish',
      eventType: 'user.logged_out',
      userId,
      correlationId,
    });
  } catch (error) {
    logger.error('Failed to publish user.logged_out event', null, {
      operation: 'event_publish',
      eventType: 'user.logged_out',
      userId,
      error: error.message,
      correlationId,
    });
    // Don't throw - graceful degradation
  }
}

// Export as default object for compatibility
export default {
  publishUserCreated,
  publishUserUpdated,
  publishUserDeleted,
  publishUserLoggedIn,
  publishUserLoggedOut,
};
