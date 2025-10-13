/**
 * Operational/Infrastructure endpoints
 * These endpoints are used by monitoring systems, load balancers, and DevOps tools
 */

import { performReadinessCheck, performLivenessCheck, getSystemMetrics } from '../../shared/utils/healthChecks.js';
import logger from '../../shared/observability/index.js';

export function health(req, res) {
  res.json({
    status: 'healthy',
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
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
