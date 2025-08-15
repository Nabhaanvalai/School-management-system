"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware_1 = require("../../middleware/authMiddleware");
const jwtUtils_1 = require("../../utils/jwtUtils");
const authService_1 = require("../../services/authService");
// Mock dependencies
jest.mock('../../utils/jwtUtils');
jest.mock('../../services/authService');
const MockedJWTUtils = jwtUtils_1.JWTUtils;
const MockedAuthService = authService_1.AuthService;
// Helper functions
const createMockRequest = (overrides = {}) => ({
    headers: {},
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    ...overrides
});
const createMockResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        removeHeader: jest.fn().mockReturnThis()
    };
    return res;
};
const createMockNext = () => jest.fn();
describe('Authentication Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('authenticateToken', () => {
        it('should authenticate valid token and set user in request', async () => {
            const req = createMockRequest({
                headers: { authorization: 'Bearer valid-token' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            const mockPayload = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'admin'
            };
            MockedJWTUtils.extractTokenFromHeader.mockReturnValue('valid-token');
            MockedAuthService.validateAccessToken.mockReturnValue({
                isValid: true,
                payload: mockPayload,
                message: 'Valid token'
            });
            MockedAuthService.getUserById.mockResolvedValue({
                _id: 'user123',
                email: 'test@example.com',
                role: 'admin',
                isActive: true
            });
            await (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(req.user).toEqual({
                id: 'user123',
                email: 'test@example.com',
                role: 'admin'
            });
            expect(next).toHaveBeenCalled();
        });
        it('should return 401 when no token provided', async () => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();
            MockedJWTUtils.extractTokenFromHeader.mockReturnValue(null);
            await (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access token is required'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 401 when token is invalid', async () => {
            const req = createMockRequest({
                headers: { authorization: 'Bearer invalid-token' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            MockedJWTUtils.extractTokenFromHeader.mockReturnValue('invalid-token');
            MockedAuthService.validateAccessToken.mockReturnValue({
                isValid: false,
                payload: undefined,
                message: 'Invalid token'
            });
            await (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid token'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 401 when user is not found', async () => {
            const req = createMockRequest({
                headers: { authorization: 'Bearer valid-token' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            const mockPayload = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'admin'
            };
            MockedJWTUtils.extractTokenFromHeader.mockReturnValue('valid-token');
            MockedAuthService.validateAccessToken.mockReturnValue({
                isValid: true,
                payload: mockPayload,
                message: 'Valid token'
            });
            MockedAuthService.getUserById.mockResolvedValue(null);
            await (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found or inactive'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 401 when user is inactive', async () => {
            const req = createMockRequest({
                headers: { authorization: 'Bearer valid-token' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            const mockPayload = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'admin'
            };
            MockedJWTUtils.extractTokenFromHeader.mockReturnValue('valid-token');
            MockedAuthService.validateAccessToken.mockReturnValue({
                isValid: true,
                payload: mockPayload,
                message: 'Valid token'
            });
            MockedAuthService.getUserById.mockResolvedValue({
                _id: 'user123',
                email: 'test@example.com',
                role: 'admin',
                isActive: false // Inactive user
            });
            await (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found or inactive'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
    describe('requireRole', () => {
        it('should allow access when user has required role', () => {
            const req = createMockRequest({
                user: { id: 'user123', email: 'test@example.com', role: 'admin' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            const middleware = (0, authMiddleware_1.requireRole)(['admin', 'teacher']);
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should deny access when user does not have required role', () => {
            const req = createMockRequest({
                user: { id: 'user123', email: 'test@example.com', role: 'student' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            const middleware = (0, authMiddleware_1.requireRole)(['admin', 'teacher']);
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Insufficient permissions'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should deny access when user is not authenticated', () => {
            const req = createMockRequest(); // No user property
            const res = createMockResponse();
            const next = createMockNext();
            const middleware = (0, authMiddleware_1.requireRole)(['admin']);
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Insufficient permissions'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should allow access when user role matches one of multiple required roles', () => {
            const req = createMockRequest({
                user: { id: 'user123', email: 'test@example.com', role: 'teacher' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            const middleware = (0, authMiddleware_1.requireRole)(['admin', 'teacher', 'student']);
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
    describe('requireAdmin', () => {
        it('should allow access for admin users', () => {
            const req = createMockRequest({
                user: { id: 'user123', email: 'admin@example.com', role: 'admin' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            (0, authMiddleware_1.requireAdmin)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should deny access for non-admin users', () => {
            const req = createMockRequest({
                user: { id: 'user123', email: 'teacher@example.com', role: 'teacher' }
            });
            const res = createMockResponse();
            const next = createMockNext();
            (0, authMiddleware_1.requireAdmin)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Admin access required'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should deny access when user is not authenticated', () => {
            const req = createMockRequest(); // No user property
            const res = createMockResponse();
            const next = createMockNext();
            (0, authMiddleware_1.requireAdmin)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Admin access required'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=authMiddleware.test.js.map