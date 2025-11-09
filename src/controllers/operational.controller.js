/**
 * Operational/Infrastructure endpoints
 * These endpoints are used by monitoring systems, load balancers, and DevOps tools
 */

import mongoose from 'mongoose';
import logger from '../core/logger.js';
import { daprClient } from '../clients/index.js';
import config from '../core/config.js';

/**
 * Create MongoDB connection URI from environment variables
 * @returns {string} - MongoDB connection URI
 */
function createMongoURI() {
  const mongoHost = process.env.MONGODB_HOST || 'localhost';
  const mongoPort = process.env.MONGODB_PORT || '27017';
  const mongoUsername = process.env.MONGO_INITDB_ROOT_USERNAME;
  const mongoPassword = process.env.MONGO_INITDB_ROOT_PASSWORD;
  const mongoDatabase = process.env.MONGO_INITDB_DATABASE;
  const mongoAuthSource = process.env.MONGODB_AUTH_SOURCE || 'admin';

  if (mongoUsername && mongoPassword) {
    return `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=${mongoAuthSource}`;
  } else {
    return `mongodb://${mongoHost}:${mongoPort}/${mongoDatabase}`;
  }
}

/**
 * Check MongoDB database health using independent connection
 * @returns {Promise<Object>} - Database health status
 */
async function checkDatabaseHealth() {
  let connection = null;
  try {
    const mongoURI = createMongoURI();

    // Create a separate connection for health checking
    connection = mongoose.createConnection(mongoURI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    // Wait for connection to be established using promise-based approach
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 6000); // Slightly longer than serverSelectionTimeoutMS

      connection.once('connected', () => {
        clearTimeout(timeout);
        resolve();
      });

      connection.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Now the connection should be ready - verify with ping
    await connection.db.admin().ping();
    return { service: 'database', status: 'healthy' };
  } catch (error) {
    return { service: 'database', status: 'unhealthy', error: error.message };
  } finally {
    // Always close the health check connection
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Get system metrics for monitoring
 * @returns {Object} - System metrics including memory and uptime
 */
function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    nodeVersion: process.version,
    platform: process.platform,
  };
}

/**
 * Perform readiness check including database and Dapr connectivity
 * @returns {Promise<Object>} - Readiness check results
 */
async function performReadinessCheck() {
  const startTime = Date.now();
  const checks = {};

  try {
    // Check database connectivity
    const dbHealth = await checkDatabaseHealth();
    checks.database = {
      status: dbHealth.status,
      ...(dbHealth.error && { error: dbHealth.error }),
      ...(dbHealth.readyState && { readyState: dbHealth.readyState }),
    };

    // Check Dapr sidecar health
    let isDaprReady = false;
    try {
      await daprClient.getMetadata();
      isDaprReady = true;
      checks.dapr = { status: 'healthy' };
    } catch (error) {
      logger.warn('Dapr health check failed', { error: error.message });
      checks.dapr = { status: 'unhealthy', error: error.message };
    }

    const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');
    const status = allHealthy ? 'ready' : 'not ready';

    return {
      status,
      timestamp: new Date().toISOString(),
      totalCheckTime: Date.now() - startTime,
      checks,
    };
  } catch (error) {
    return {
      status: 'not ready',
      timestamp: new Date().toISOString(),
      totalCheckTime: Date.now() - startTime,
      checks,
      error: error.message,
    };
  }
}

/**
 * Perform liveness check - basic application health
 * @returns {Promise<Object>} - Liveness check results
 */
async function performLivenessCheck() {
  const checks = {
    server: { status: 'alive' },
    timestamp: new Date().toISOString(),
  };

  return {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };
}

export function health(req, res) {
  res.json({
    status: 'healthy',
    service: config.service.name,
    version: config.service.version,
    environment: config.service.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dapr: {
      enabled: true,
      appId: config.dapr.appId,
      httpPort: config.dapr.httpPort,
    },
  });
}

export async function readiness(req, res) {
  try {
    const readinessResult = await performReadinessCheck();

    // Log readiness check results for monitoring
    logger.info('Readiness check performed', {
      status: readinessResult.status,
      totalCheckTime: readinessResult.totalCheckTime,
      checks: Object.keys(readinessResult.checks).reduce((acc, key) => {
        acc[key] = readinessResult.checks[key].status;
        return acc;
      }, {}),
    });

    const statusCode = readinessResult.status === 'ready' ? 200 : 503;

    res.status(statusCode).json({
      status: readinessResult.status,
      service: process.env.NAME,
      timestamp: readinessResult.timestamp,
      totalCheckTime: readinessResult.totalCheckTime,
      checks: readinessResult.checks,
      ...(readinessResult.error && { error: readinessResult.error }),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not ready',
      service: process.env.NAME,
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
      details: error.message,
    });
  }
}

export async function liveness(req, res) {
  try {
    const livenessResult = await performLivenessCheck();

    // Log liveness issues for monitoring
    if (livenessResult.status !== 'alive') {
      logger.warn('Liveness check failed', {
        status: livenessResult.status,
        checks: livenessResult.checks,
      });
    }

    const statusCode = livenessResult.status === 'alive' ? 200 : 503;

    res.status(statusCode).json({
      status: livenessResult.status,
      service: process.env.NAME,
      timestamp: livenessResult.timestamp,
      uptime: livenessResult.uptime,
      checks: livenessResult.checks,
      ...(livenessResult.error && { error: livenessResult.error }),
    });
  } catch (error) {
    logger.error('Liveness check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: process.env.NAME,
      timestamp: new Date().toISOString(),
      error: 'Liveness check failed',
      details: error.message,
    });
  }
}

export function metrics(req, res) {
  try {
    const systemMetrics = getSystemMetrics();

    res.json({
      service: process.env.NAME,
      ...systemMetrics,
    });
  } catch (error) {
    logger.error('Metrics collection failed', { error: error.message });
    res.status(500).json({
      service: process.env.NAME,
      timestamp: new Date().toISOString(),
      error: 'Metrics collection failed',
      details: error.message,
    });
  }
}
