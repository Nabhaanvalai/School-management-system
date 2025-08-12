/**
 * Integration tests for authentication middleware
 * These tests verify that the middleware functions work correctly
 */

import { Request, Response, NextFunction } from 'express';
import {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacherOrAdmin,
  securityHeaders,
  sanitizeRequest,
  rateLimit
} from '../../middleware/authMiddleware';

// Mock Express objects
const mockRequest = (overrides: any = {}): Partial<Request> => ({
  headers: {},
  body: {},
  query: {},
  params: {},
  ip: '127.0.0.1',
  ...overrides
});

const mockResponse = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.removeHeader = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('Authentication Middleware Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('securityHeaders middleware', () => {
    it('should set security headers correctly', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      securityHeaders(req, res, next);

      expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('sanitizeRequest middleware', () => {
    it('should sanitize XSS attempts in request body', () => {
      const req = mockRequest({
        body: {
          name: 'John<script>alert("xss")</script>',
          email: 'john@example.com',
          description: 'Test<script>malicious()</script>content'
        }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      sanitizeRequest(req, res, next);

      expect(req.body.name).toBe('John');
      expect(req.body.email).toBe('john@example.com');
      expect(req.body.description).toBe('Testcontent');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize XSS attempts in query parameters', () => {
      const req = mockRequest({
        query: {
          search: 'test<script>alert("xss")</script>',
          filter: 'normal_value'
        }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      sanitizeRequest(req, res, next);

      expect(req.query.search).toBe('test');
      expect(req.query.filter).toBe('normal_value');
      expect(next).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      const req = mockRequest({
        body: {
          user: {
            name: 'John<script>alert("nested")</script>',
            profile: {
              bio: 'Bio<script>nested()</script>text'
            }
          }
        }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      sanitizeRequest(req, res, next);

      expect(req.body.user.name).toBe('John');
      expect(req.body.user.profile.bio).toBe('Biotext');
      expect(next).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      const req = mockRequest({
        body: {
          items: [
            'item1<script>alert("xss")</script>',
            'item2',
            'item3<script>malicious()</script>'
          ]
        }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      sanitizeRequest(req, res, next);

      expect(req.body.items).toEqual(['item1', 'item2', 'item3']);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('rateLimit middleware', () => {
    it('should allow requests within limit', () => {
      const req = mockRequest({ ip: '192.168.1.1' }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      const middleware = rateLimit(5, 60000); // 5 requests per minute

      // First request should pass
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding limit', () => {
      const req = mockRequest({ ip: '192.168.1.2' }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      const middleware = rateLimit(2, 60000); // 2 requests per minute

      // First two requests should pass
      middleware(req, res, next);
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);

      // Third request should be blocked
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: expect.any(Number)
      });
      expect(next).toHaveBeenCalledTimes(2); // Should not call next for blocked request
    });
  });

  describe('requireRole middleware', () => {
    it('should allow access for users with correct role', () => {
      const req = mockRequest({
        user: { id: '123', email: 'admin@test.com', role: 'admin' }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      const middleware = requireRole(['admin', 'teacher']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for users without correct role', () => {
      const req = mockRequest({
        user: { id: '123', email: 'student@test.com', role: 'student' }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      const middleware = requireRole(['admin', 'teacher']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated users', () => {
      const req = mockRequest() as Request; // No user property
      const res = mockResponse() as Response;
      const next = jest.fn();

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin middleware', () => {
    it('should allow access for admin users', () => {
      const req = mockRequest({
        user: { id: '123', email: 'admin@test.com', role: 'admin' }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-admin users', () => {
      const req = mockRequest({
        user: { id: '123', email: 'teacher@test.com', role: 'teacher' }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireTeacherOrAdmin middleware', () => {
    it('should allow access for teacher users', () => {
      const req = mockRequest({
        user: { id: '123', email: 'teacher@test.com', role: 'teacher' }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      requireTeacherOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for admin users', () => {
      const req = mockRequest({
        user: { id: '123', email: 'admin@test.com', role: 'admin' }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      requireTeacherOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for student users', () => {
      const req = mockRequest({
        user: { id: '123', email: 'student@test.com', role: 'student' }
      }) as Request;
      const res = mockResponse() as Response;
      const next = jest.fn();

      requireTeacherOrAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});