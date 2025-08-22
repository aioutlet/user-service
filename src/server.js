import dotenv from 'dotenv';

/**
 * Load environment configuration
 */
const loadEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  // For production, environment variables are set directly in the cloud platform
  if (env === 'production') {
    console.log('✅ Production mode - using environment variables from cloud platform');
    return;
  }

  // For test environment, try to load .env.test, fallback to .env
  let envFile = '.env';
  if (env === 'test') {
    envFile = '.env.test';
  }

  const result = dotenv.config({ path: envFile });

  if (result.error) {
    // If .env.test fails, try fallback to .env for tests
    if (env === 'test') {
      const fallbackResult = dotenv.config({ path: '.env' });
      if (fallbackResult.error) {
        console.error('❌ Error: Could not load .env.test or .env file for testing');
        process.exit(1);
      } else {
        console.log('✅ Loaded configuration from .env file (test fallback)');
      }
    } else {
      console.error('❌ Error: Could not load .env file for local development');
      console.error('Please create a .env file in the project root or set environment variables manually');
      process.exit(1);
    }
  } else {
    console.log(`✅ Loaded configuration from ${envFile} file`);
  }
};

// Load environment configuration first
loadEnvironmentConfig();

// Now import and start the application
import('./app.js');
