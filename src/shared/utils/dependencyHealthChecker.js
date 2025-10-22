import mongoose from 'mongoose';

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
export async function checkDatabaseHealth() {
  let connection = null;
  try {
    const mongoURI = createMongoURI();
    console.log(`[DB] Checking database health at ${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`);
    console.log(`[DB] Using MongoDB URI: ${mongoURI.replace(/:([^:@]{1,})+@/, ':***@')}`); // Hide password in logs

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
    console.log('[DB] ✅ Database connection is healthy');
    return { service: 'database', status: 'healthy' };
  } catch (error) {
    console.error(`[DB] ❌ Database health check failed: ${error.message}`);
    return { service: 'database', status: 'unhealthy', error: error.message };
  } finally {
    // Always close the health check connection
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error(`[DB] Warning: Failed to close health check connection: ${closeError.message}`);
      }
    }
  }
}

/**
 * Check health of service dependencies without blocking startup
 * @param {Object} dependencies - Object with service names as keys and health URLs as values
 * @param {number} timeout - Timeout for each health check in ms
 * @returns {Promise<Array>} - Array of health check results
 */
export async function checkDependencyHealth(dependencies, timeout = 5000) {
  console.log('[DEPS] 🔍 Checking dependency health...');

  // Check database health first
  const dbHealth = await checkDatabaseHealth();
  const healthChecks = [Promise.resolve(dbHealth)];

  // Add external service health checks
  const serviceChecks = Object.entries(dependencies).map(async ([serviceName, healthUrl]) => {
    try {
      console.log(`[DEPS] Checking ${serviceName} health at ${healthUrl}`);

      // Create fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(healthUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        method: 'GET',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`[DEPS] ✅ ${serviceName} is healthy`);
        return { service: serviceName, status: 'healthy', url: healthUrl };
      } else {
        console.error(`[DEPS] ⚠️ ${serviceName} returned status ${response.status}`);
        return { service: serviceName, status: 'unhealthy', url: healthUrl, statusCode: response.status };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[DEPS] ⏰ ${serviceName} health check timed out after ${timeout}ms`);
        return { service: serviceName, status: 'timeout', error: 'timeout' };
      } else {
        console.error(`[DEPS] ❌ ${serviceName} is not reachable: ${error.message}`);
        return { service: serviceName, status: 'unreachable', error: error.message };
      }
    }
  });

  healthChecks.push(...serviceChecks);
  const results = await Promise.allSettled(healthChecks);

  // Summary logging
  const healthyServices = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'healthy').length;
  const totalServices = results.length;

  if (healthyServices === totalServices) {
    console.log(`[DEPS] 🎉 All ${totalServices} dependencies are healthy`);
  } else {
    console.error(`[DEPS] ⚠️ ${healthyServices}/${totalServices} dependencies are healthy`);
  }

  return results.map((r) => (r.status === 'fulfilled' ? r.value : { error: r.reason }));
}

/**
 * Get dependency URLs from environment variables
 * Uses standardized _HEALTH_URL variables for complete health endpoint URLs
 * @returns {Object} - Object with service names as keys and health URLs as values
 */
export function getDependencies() {
  const dependencies = {};

  // Add message broker if configured (primary dependency for user-service)
  if (process.env.MESSAGE_BROKER_HEALTH_URL) {
    dependencies['message-broker'] = process.env.MESSAGE_BROKER_HEALTH_URL;
  }

  return dependencies;
}
