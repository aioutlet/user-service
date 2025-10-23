/**
 * Tracing module exports
 * Provides centralized access to all tracing functionality
 */

// Setup (auto-initializes on import)
export { enableTracing } from './setup.js';

// Helper functions
export { getTracingContext, createOperationSpan } from './helpers.js';
