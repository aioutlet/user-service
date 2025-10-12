import dotenv from 'dotenv';
dotenv.config({ quiet: true });

// Industry-standard initialization pattern:
// 1. Validate configuration (uses console.log - standard for bootstrap)
import validateConfig from './validators/config.validator.js';
validateConfig();

// 2. Initialize observability (auto-initializes on import - standard Express pattern)
import './observability/logging/logger.js'; // Logger singleton
import './observability/tracing/setup.js'; // Tracing auto-init

// 3. Start the application
await import('./app.js');
