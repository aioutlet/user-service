/**
 * User Service API Server
 * HTTP API for user management operations
 */

import dotenv from 'dotenv';
dotenv.config({ quiet: true });

// Industry-standard initialization pattern:
// 1. Validate configuration (uses console.log - standard for bootstrap)
import validateConfig from '../shared/validators/config.validator.js';
validateConfig();

// 2. Initialize observability (auto-initializes on import - standard Express pattern)
import '../shared/observability/logging/logger.js'; // Logger singleton
import '../shared/observability/tracing/setup.js'; // Tracing auto-init

// 3. Start the application
await import('./app.js');
