/**
 * Operational/Infrastructure endpoints
 * These endpoints are used by monitoring systems, load balancers, and DevOps tools
 */

import { performReadinessCheck, performLivenessCheck, getSystemMetrics } from '../utils/healthChecks.js';
import logger from '../utils/logger.js';

export function health(req, res) {
  res.json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
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
      service: 'user-service',
      timestamp: readinessResult.timestamp,
      totalCheckTime: readinessResult.totalCheckTime,
      checks: readinessResult.checks,
      ...(readinessResult.error && { error: readinessResult.error }),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not ready',
      service: 'user-service',
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
      service: 'user-service',
      timestamp: livenessResult.timestamp,
      uptime: livenessResult.uptime,
      checks: livenessResult.checks,
      ...(livenessResult.error && { error: livenessResult.error }),
    });
  } catch (error) {
    logger.error('Liveness check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'user-service',
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
      service: 'user-service',
      ...systemMetrics,
    });
  } catch (error) {
    logger.error('Metrics collection failed', { error: error.message });
    res.status(500).json({
      service: 'user-service',
      timestamp: new Date().toISOString(),
      error: 'Metrics collection failed',
      details: error.message,
    });
  }
}
