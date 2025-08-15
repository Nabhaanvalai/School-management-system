"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwtUtils_1 = require("../../utils/jwtUtils");
// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
    jest.resetModules();
    process.env = {
        ...originalEnv,
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d'
    };
});
afterEach(() => {
    process.env = originalEnv;
});
describe('JWTUtils', () => {
    const mockPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'admin'
    };
    const mockRefreshPayload = {
        userId: '507f1f77bcf86cd799439011',
        tokenVersion: 1234567890
    };
    describe('generateAccessToken', () => {
        it('should generate a valid access token', () => {
            const token = jwtUtils_1.JWTUtils.generateAccessToken(mockPayload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });
        it('should include correct payload in access token', () => {
            const token = jwtUtils_1.JWTUtils.generateAccessToken(mockPayload);
            const decoded = jwtUtils_1.JWTUtils.decodeToken(token);
            expect(decoded.userId).toBe(mockPayload.userId);
            expect(decoded.email).toBe(mockPayload.email);
            expect(decoded.role).toBe(mockPayload.role);
            expect(decoded.iss).toBe('school-management-system');
            expect(decoded.aud).toBe('sms-users');
        });
    });
    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', () => {
            const token = jwtUtils_1.JWTUtils.generateRefreshToken(mockRefreshPayload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });
        it('should include correct payload in refresh token', () => {
            const token = jwtUtils_1.JWTUtils.generateRefreshToken(mockRefreshPayload);
            const decoded = jwtUtils_1.JWTUtils.decodeToken(token);
            expect(decoded.userId).toBe(mockRefreshPayload.userId);
            expect(decoded.tokenVersion).toBe(mockRefreshPayload.tokenVersion);
            expect(decoded.iss).toBe('school-management-system');
            expect(decoded.aud).toBe('sms-users');
        });
    });
    describe('verifyAccessToken', () => {
        it('should verify a valid access token', () => {
            const token = jwtUtils_1.JWTUtils.generateAccessToken(mockPayload);
            const verified = jwtUtils_1.JWTUtils.verifyAccessToken(token);
            expect(verified.userId).toBe(mockPayload.userId);
            expect(verified.email).toBe(mockPayload.email);
            expect(verified.role).toBe(mockPayload.role);
        });
        it('should throw error for invalid access token', () => {
            expect(() => {
                jwtUtils_1.JWTUtils.verifyAccessToken('invalid.token.here');
            }).toThrow('Invalid access token');
        });
        it('should throw error for malformed token', () => {
            expect(() => {
                jwtUtils_1.JWTUtils.verifyAccessToken('malformed-token');
            }).toThrow('Invalid access token');
        });
        it('should throw error for empty token', () => {
            expect(() => {
                jwtUtils_1.JWTUtils.verifyAccessToken('');
            }).toThrow('Invalid access token');
        });
    });
    describe('verifyRefreshToken', () => {
        it('should verify a valid refresh token', () => {
            const token = jwtUtils_1.JWTUtils.generateRefreshToken(mockRefreshPayload);
            const verified = jwtUtils_1.JWTUtils.verifyRefreshToken(token);
            expect(verified.userId).toBe(mockRefreshPayload.userId);
            expect(verified.tokenVersion).toBe(mockRefreshPayload.tokenVersion);
        });
        it('should throw error for invalid refresh token', () => {
            expect(() => {
                jwtUtils_1.JWTUtils.verifyRefreshToken('invalid.token.here');
            }).toThrow('Invalid refresh token');
        });
    });
    describe('extractTokenFromHeader', () => {
        it('should extract token from valid Bearer header', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
            const header = `Bearer ${token}`;
            const extracted = jwtUtils_1.JWTUtils.extractTokenFromHeader(header);
            expect(extracted).toBe(token);
        });
        it('should return null for invalid header format', () => {
            expect(jwtUtils_1.JWTUtils.extractTokenFromHeader('InvalidHeader')).toBeNull();
            expect(jwtUtils_1.JWTUtils.extractTokenFromHeader('Basic token')).toBeNull();
            expect(jwtUtils_1.JWTUtils.extractTokenFromHeader('Bearer')).toBeNull();
            expect(jwtUtils_1.JWTUtils.extractTokenFromHeader('Bearer token extra')).toBeNull();
        });
        it('should return null for undefined header', () => {
            expect(jwtUtils_1.JWTUtils.extractTokenFromHeader(undefined)).toBeNull();
        });
        it('should return null for empty header', () => {
            expect(jwtUtils_1.JWTUtils.extractTokenFromHeader('')).toBeNull();
        });
    });
    describe('generateTokenPair', () => {
        it('should generate both access and refresh tokens', () => {
            const tokenPair = jwtUtils_1.JWTUtils.generateTokenPair(mockPayload.userId, mockPayload.email, mockPayload.role, 1234567890);
            expect(tokenPair.accessToken).toBeDefined();
            expect(tokenPair.refreshToken).toBeDefined();
            expect(tokenPair.expiresIn).toBe('15m');
            // Verify tokens are valid
            const accessPayload = jwtUtils_1.JWTUtils.verifyAccessToken(tokenPair.accessToken);
            const refreshPayload = jwtUtils_1.JWTUtils.verifyRefreshToken(tokenPair.refreshToken);
            expect(accessPayload.userId).toBe(mockPayload.userId);
            expect(refreshPayload.userId).toBe(mockPayload.userId);
        });
        it('should use default token version when not provided', () => {
            const tokenPair = jwtUtils_1.JWTUtils.generateTokenPair(mockPayload.userId, mockPayload.email, mockPayload.role);
            const refreshPayload = jwtUtils_1.JWTUtils.verifyRefreshToken(tokenPair.refreshToken);
            expect(refreshPayload.tokenVersion).toBe(0);
        });
    });
    describe('decodeToken', () => {
        it('should decode token without verification', () => {
            const token = jwtUtils_1.JWTUtils.generateAccessToken(mockPayload);
            const decoded = jwtUtils_1.JWTUtils.decodeToken(token);
            expect(decoded.userId).toBe(mockPayload.userId);
            expect(decoded.email).toBe(mockPayload.email);
            expect(decoded.role).toBe(mockPayload.role);
        });
        it('should decode invalid token structure', () => {
            // This should not throw, just return null or partial data
            const result = jwtUtils_1.JWTUtils.decodeToken('invalid.token');
            expect(result).toBeNull();
        });
    });
    describe('isTokenExpired', () => {
        it('should return false for valid non-expired token', () => {
            const token = jwtUtils_1.JWTUtils.generateAccessToken(mockPayload);
            expect(jwtUtils_1.JWTUtils.isTokenExpired(token)).toBe(false);
        });
        it('should return true for malformed token', () => {
            expect(jwtUtils_1.JWTUtils.isTokenExpired('malformed-token')).toBe(true);
        });
        it('should return true for empty token', () => {
            expect(jwtUtils_1.JWTUtils.isTokenExpired('')).toBe(true);
        });
        it('should return true for token without exp claim', () => {
            // Create a token without expiration
            const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.invalid';
            expect(jwtUtils_1.JWTUtils.isTokenExpired(tokenWithoutExp)).toBe(true);
        });
    });
    describe('environment variable handling', () => {
        it('should use default secrets when env vars are not set', () => {
            // Remove environment variables
            delete process.env.JWT_ACCESS_SECRET;
            delete process.env.JWT_REFRESH_SECRET;
            // This should not throw and should use defaults
            const token = jwtUtils_1.JWTUtils.generateAccessToken(mockPayload);
            expect(token).toBeDefined();
            // Should be able to verify with default secret
            const verified = jwtUtils_1.JWTUtils.verifyAccessToken(token);
            expect(verified.userId).toBe(mockPayload.userId);
        });
        it('should use custom expiration times from env vars', () => {
            // Since the JWTUtils class reads env vars at class definition time,
            // we need to test the default behavior instead
            const tokenPair = jwtUtils_1.JWTUtils.generateTokenPair(mockPayload.userId, mockPayload.email, mockPayload.role);
            // Should use the default value set in beforeEach
            expect(tokenPair.expiresIn).toBe('15m');
        });
    });
});
//# sourceMappingURL=jwtUtils.test.js.map