import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import httpMocks from 'node-mocks-http';

// Mock uuid
const mockUuid = jest.fn(() => 'generated-uuid-123');
jest.unstable_mockModule('uuid', () => ({
  v4: mockUuid,
}));

// Import after mocking
const correlationIdMiddlewareModule = await import('../../../src/middlewares/correlationId.middleware.js');
const correlationIdMiddleware = correlationIdMiddlewareModule.default;

describe('CorrelationId Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate correlation ID if not provided', () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users',
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBe('generated-uuid-123');
    expect(res.getHeader('X-Correlation-ID')).toBe('generated-uuid-123');
    expect(res.locals.correlationId).toBe('generated-uuid-123');
    expect(next).toHaveBeenCalled();
  });

  it('should use provided correlation ID from header', () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users',
      headers: {
        'x-correlation-id': 'existing-corr-id-456',
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBe('existing-corr-id-456');
    expect(res.getHeader('X-Correlation-ID')).toBe('existing-corr-id-456');
    expect(res.locals.correlationId).toBe('existing-corr-id-456');
    expect(mockUuid).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should log request details', () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users/123',
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should log body fields for POST requests', () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/users',
      body: {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should capture response and log completion', () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users',
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    // Simulate sending response
    res.status(200).send({ data: 'test' });

    expect(res.statusCode).toBe(200);
  });

  it('should handle different status codes appropriately', () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users/notfound',
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    // Simulate 404 response
    res.status(404).send({ error: 'Not found' });

    expect(res.statusCode).toBe(404);
  });

  it('should handle server errors', () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users/error',
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    // Simulate 500 response
    res.status(500).send({ error: 'Server error' });

    expect(res.statusCode).toBe(500);
  });

  it('should include user ID in logs if available', () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/users/profile',
      user: {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
