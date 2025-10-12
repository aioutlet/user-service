import { trace } from '@opentelemetry/api';
import { enableTracing } from './setup.js';

/**
 * Tracing helper functions
 * All environment variables are already validated by config.validator.js
 */

/**
 * Get current trace and span IDs from OpenTelemetry context
 * @returns {Object} Object containing traceId and spanId
 */
export function getTracingContext() {
  if (!enableTracing) {
    return { traceId: null, spanId: null };
  }

  try {
    const span = trace.getActiveSpan();
    if (!span) {
      return { traceId: null, spanId: null };
    }

    const spanContext = span.spanContext();
    return {
      traceId: spanContext.traceId || null,
      spanId: spanContext.spanId || null,
    };
  } catch (error) {
    // If OpenTelemetry is not properly initialized, return nulls
    console.debug('Failed to get tracing context:', error.message);
    return { traceId: null, spanId: null };
  }
}

/**
 * Create a new span for operation tracking
 * @param {string} operationName - Name of the operation
 * @param {Object} [attributes] - Additional attributes for the span
 * @returns {Object} Span object with context
 */
export function createOperationSpan(operationName, attributes = {}) {
  if (!enableTracing) {
    return {
      span: null,
      traceId: null,
      spanId: null,
      end: () => {},
      setStatus: () => {},
      addEvent: () => {},
    };
  }

  try {
    // Use validated environment variables directly
    const serviceName = process.env.SERVICE_NAME || 'user-service';
    const serviceVersion = process.env.SERVICE_VERSION || '1.0.0';

    const tracer = trace.getTracer(serviceName, serviceVersion);
    const span = tracer.startSpan(operationName, {
      attributes: {
        'service.name': serviceName,
        'service.version': serviceVersion,
        ...attributes,
      },
    });

    return {
      span,
      traceId: span.spanContext().traceId,
      spanId: span.spanContext().spanId,
      end: () => span.end(),
      setStatus: (code, message) => span.setStatus({ code, message }),
      addEvent: (name, attributes) => span.addEvent(name, attributes),
    };
  } catch (error) {
    // Return a no-op span if tracing fails
    console.debug('Failed to create operation span:', error.message);
    return {
      span: null,
      traceId: null,
      spanId: null,
      end: () => {},
      setStatus: () => {},
      addEvent: () => {},
    };
  }
}
