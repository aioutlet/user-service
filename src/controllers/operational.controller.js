/**
 * Operational/Infrastructure endpoints
 * These endpoints are used by monitoring systems, load balancers, and DevOps tools
 */

import { checkDatabaseHealth } from '../utils/dependencyHealthChecker.js';
import logger from '../observability/index.js';

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
 * Perform readiness check including database connectivity
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
    service: process.env.SERVICE_NAME || 'user-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
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
      service: process.env.SERVICE_NAME,
      timestamp: readinessResult.timestamp,
      totalCheckTime: readinessResult.totalCheckTime,
      checks: readinessResult.checks,
      ...(readinessResult.error && { error: readinessResult.error }),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not ready',
      service: process.env.SERVICE_NAME,
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
      service: process.env.SERVICE_NAME,
      timestamp: livenessResult.timestamp,
      uptime: livenessResult.uptime,
      checks: livenessResult.checks,
      ...(livenessResult.error && { error: livenessResult.error }),
    });
  } catch (error) {
    logger.error('Liveness check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: process.env.SERVICE_NAME,
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
      service: process.env.SERVICE_NAME,
      ...systemMetrics,
    });
  } catch (error) {
    logger.error('Metrics collection failed', { error: error.message });
    res.status(500).json({
      service: process.env.SERVICE_NAME,
      timestamp: new Date().toISOString(),
      error: 'Metrics collection failed',
      details: error.message,
    });
  }
}
