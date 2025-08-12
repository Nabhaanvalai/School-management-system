import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Refresh token payload interface
export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

/**
 * JWT utility functions for token generation and validation
 */
export class JWTUtils {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Generate access token
   * @param payload - JWT payload containing user information
   * @returns string - Signed JWT access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'school-management-system',
      audience: 'sms-users'
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   * @param payload - Refresh token payload
   * @returns string - Signed JWT refresh token
   */
  static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'school-management-system',
      audience: 'sms-users'
    } as jwt.SignOptions);
  }

  /**
   * Verify access token
   * @param token - JWT access token to verify
   * @returns JWTPayload - Decoded token payload
   * @throws Error if token is invalid or expired
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'school-management-system',
        audience: 'sms-users'
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify refresh token
   * @param token - JWT refresh token to verify
   * @returns RefreshTokenPayload - Decoded refresh token payload
   * @throws Error if token is invalid or expired
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'school-management-system',
        audience: 'sms-users'
      }) as RefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Refresh token verification failed');
      }
    }
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns string | null - Extracted token or null if not found
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Generate token pair (access and refresh tokens)
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @param tokenVersion - Token version for refresh token
   * @returns Object containing access and refresh tokens
   */
  static generateTokenPair(userId: string, email: string, role: UserRole, tokenVersion: number = 0) {
    const accessToken = this.generateAccessToken({ userId, email, role });
    const refreshToken = this.generateRefreshToken({ userId, tokenVersion });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN
    };
  }

  /**
   * Decode token without verification (for debugging purposes)
   * @param token - JWT token to decode
   * @returns any - Decoded token payload
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Check if token is expired
   * @param token - JWT token to check
   * @returns boolean - True if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}