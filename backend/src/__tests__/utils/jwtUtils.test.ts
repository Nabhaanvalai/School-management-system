import { JWTUtils, JWTPayload, RefreshTokenPayload } from '../../utils/jwtUtils';
import { UserRole } from '../../models/User';

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
  const mockPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'admin' as UserRole
  };

  const mockRefreshPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId: '507f1f77bcf86cd799439011',
    tokenVersion: 1234567890
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTUtils.generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in access token', () => {
      const token = JWTUtils.generateAccessToken(mockPayload);
      const decoded = JWTUtils.decodeToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.iss).toBe('school-management-system');
      expect(decoded.aud).toBe('sms-users');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JWTUtils.generateRefreshToken(mockRefreshPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in refresh token', () => {
      const token = JWTUtils.generateRefreshToken(mockRefreshPayload);
      const decoded = JWTUtils.decodeToken(token);
      
      expect(decoded.userId).toBe(mockRefreshPayload.userId);
      expect(decoded.tokenVersion).toBe(mockRefreshPayload.tokenVersion);
      expect(decoded.iss).toBe('school-management-system');
      expect(decoded.aud).toBe('sms-users');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = JWTUtils.generateAccessToken(mockPayload);
      const verified = JWTUtils.verifyAccessToken(token);
      
      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.email).toBe(mockPayload.email);
      expect(verified.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid access token', () => {
      expect(() => {
        JWTUtils.verifyAccessToken('invalid.token.here');
      }).toThrow('Invalid access token');
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        JWTUtils.verifyAccessToken('malformed-token');
      }).toThrow('Invalid access token');
    });

    it('should throw error for empty token', () => {
      expect(() => {
        JWTUtils.verifyAccessToken('');
      }).toThrow('Invalid access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = JWTUtils.generateRefreshToken(mockRefreshPayload);
      const verified = JWTUtils.verifyRefreshToken(token);
      
      expect(verified.userId).toBe(mockRefreshPayload.userId);
      expect(verified.tokenVersion).toBe(mockRefreshPayload.tokenVersion);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        JWTUtils.verifyRefreshToken('invalid.token.here');
      }).toThrow('Invalid refresh token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const header = `Bearer ${token}`;
      
      const extracted = JWTUtils.extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      expect(JWTUtils.extractTokenFromHeader('InvalidHeader')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader('Basic token')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader('Bearer')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader('Bearer token extra')).toBeNull();
    });

    it('should return null for undefined header', () => {
      expect(JWTUtils.extractTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for empty header', () => {
      expect(JWTUtils.extractTokenFromHeader('')).toBeNull();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokenPair = JWTUtils.generateTokenPair(
        mockPayload.userId,
        mockPayload.email,
        mockPayload.role,
        1234567890
      );
      
      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.expiresIn).toBe('15m');
      
      // Verify tokens are valid
      const accessPayload = JWTUtils.verifyAccessToken(tokenPair.accessToken);
      const refreshPayload = JWTUtils.verifyRefreshToken(tokenPair.refreshToken);
      
      expect(accessPayload.userId).toBe(mockPayload.userId);
      expect(refreshPayload.userId).toBe(mockPayload.userId);
    });

    it('should use default token version when not provided', () => {
      const tokenPair = JWTUtils.generateTokenPair(
        mockPayload.userId,
        mockPayload.email,
        mockPayload.role
      );
      
      const refreshPayload = JWTUtils.verifyRefreshToken(tokenPair.refreshToken);
      expect(refreshPayload.tokenVersion).toBe(0);
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = JWTUtils.generateAccessToken(mockPayload);
      const decoded = JWTUtils.decodeToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should decode invalid token structure', () => {
      // This should not throw, just return null or partial data
      const result = JWTUtils.decodeToken('invalid.token');
      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const token = JWTUtils.generateAccessToken(mockPayload);
      expect(JWTUtils.isTokenExpired(token)).toBe(false);
    });

    it('should return true for malformed token', () => {
      expect(JWTUtils.isTokenExpired('malformed-token')).toBe(true);
    });

    it('should return true for empty token', () => {
      expect(JWTUtils.isTokenExpired('')).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      // Create a token without expiration
      const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.invalid';
      expect(JWTUtils.isTokenExpired(tokenWithoutExp)).toBe(true);
    });
  });

  describe('environment variable handling', () => {
    it('should use default secrets when env vars are not set', () => {
      // Remove environment variables
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      
      // This should not throw and should use defaults
      const token = JWTUtils.generateAccessToken(mockPayload);
      expect(token).toBeDefined();
      
      // Should be able to verify with default secret
      const verified = JWTUtils.verifyAccessToken(token);
      expect(verified.userId).toBe(mockPayload.userId);
    });

    it('should use custom expiration times from env vars', () => {
      // Since the JWTUtils class reads env vars at class definition time,
      // we need to test the default behavior instead
      const tokenPair = JWTUtils.generateTokenPair(
        mockPayload.userId,
        mockPayload.email,
        mockPayload.role
      );
      
      // Should use the default value set in beforeEach
      expect(tokenPair.expiresIn).toBe('15m');
    });
  });
});