import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import httpMocks from 'node-mocks-http';

// Mock dependencies
const mockJwtVerify = jest.fn();
const mockUserFindById = jest.fn();
const mockGetJwtConfig = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockJwtVerify,
  },
}));

jest.unstable_mockModule('../../../src/models/user.model.js', () => ({
  default: {
    findById: mockUserFindById,
  },
}));

jest.unstable_mockModule('../../../src/services/dapr.secretManager.js', () => ({
  getJwtConfig: mockGetJwtConfig,
}));

// Import after mocking
const authMiddleware = await import('../../../src/middlewares/auth.middleware.js');
const { requireAuth, optionalAuth } = authMiddleware;

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetJwtConfig.mockResolvedValue({ secret: 'test-secret' });
  });

  describe('requireAuth', () => {
    it('should authenticate valid token from Authorization header', async () => {
      const token = 'valid-token';
      const decoded = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['user'],
        name: 'Test User',
        emailVerified: true,
      };
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        isActive: true,
      };

      mockJwtVerify.mockReturnValue(decoded);
      mockUserFindById.mockResolvedValue(mockUser);

      const req = httpMocks.createRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(mockJwtVerify).toHaveBeenCalledWith(token, 'test-secret');
      expect(mockUserFindById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });

    it('should authenticate valid token from cookie', async () => {
      const token = 'valid-token';
      const decoded = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['user'],
      };
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        isActive: true,
      };

      mockJwtVerify.mockReturnValue(decoded);
      mockUserFindById.mockResolvedValue(mockUser);

      const req = httpMocks.createRequest({
        cookies: { jwt: token },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(mockJwtVerify).toHaveBeenCalledWith(token, 'test-secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 401 if no token provided', async () => {
      const req = httpMocks.createRequest({
        headers: {},
        cookies: {},
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining('No token found'),
        })
      );
    });

    it('should return 401 if token is invalid', async () => {
      const token = 'invalid-token';
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = httpMocks.createRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining('Invalid or expired token'),
        })
      );
    });

    it('should return 403 if user account is deactivated', async () => {
      const token = 'valid-token';
      const decoded = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['user'],
      };
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        isActive: false,
      };

      mockJwtVerify.mockReturnValue(decoded);
      mockUserFindById.mockResolvedValue(mockUser);

      const req = httpMocks.createRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: expect.stringContaining('Account deactivated'),
        })
      );
    });

    it('should continue with JWT claims if user not found in database', async () => {
      const token = 'valid-token';
      const decoded = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['admin'],
        name: 'Admin User',
        emailVerified: true,
      };

      mockJwtVerify.mockReturnValue(decoded);
      mockUserFindById.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(req.user).toEqual({
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['admin'],
        name: 'Admin User',
        emailVerified: true,
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle database errors gracefully', async () => {
      const token = 'valid-token';
      const decoded = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['user'],
      };

      mockJwtVerify.mockReturnValue(decoded);
      mockUserFindById.mockRejectedValue(new Error('Database error'));

      const req = httpMocks.createRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      // Should continue with JWT claims despite DB error
      expect(next).toHaveBeenCalledWith();
      expect(req.user._id).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', async () => {
      const token = 'valid-token';
      const decoded = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['user'],
      };

      mockJwtVerify.mockReturnValue(decoded);
      mockUserFindById.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user if no token provided', async () => {
      const req = httpMocks.createRequest({
        headers: {},
        cookies: {},
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user if token is invalid', async () => {
      const token = 'invalid-token';
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = httpMocks.createRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });
  });
});
