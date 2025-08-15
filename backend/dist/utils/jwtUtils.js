"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * JWT utility functions for token generation and validation
 */
class JWTUtils {
    /**
     * Generate access token
     * @param payload - JWT payload containing user information
     * @returns string - Signed JWT access token
     */
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.ACCESS_TOKEN_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
            issuer: 'school-management-system',
            audience: 'sms-users'
        });
    }
    /**
     * Generate refresh token
     * @param payload - Refresh token payload
     * @returns string - Signed JWT refresh token
     */
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.REFRESH_TOKEN_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
            issuer: 'school-management-system',
            audience: 'sms-users'
        });
    }
    /**
     * Verify access token
     * @param token - JWT access token to verify
     * @returns JWTPayload - Decoded token payload
     * @throws Error if token is invalid or expired
     */
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.ACCESS_TOKEN_SECRET, {
                issuer: 'school-management-system',
                audience: 'sms-users'
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Access token has expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid access token');
            }
            else {
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
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.REFRESH_TOKEN_SECRET, {
                issuer: 'school-management-system',
                audience: 'sms-users'
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Refresh token has expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            else {
                throw new Error('Refresh token verification failed');
            }
        }
    }
    /**
     * Extract token from Authorization header
     * @param authHeader - Authorization header value
     * @returns string | null - Extracted token or null if not found
     */
    static extractTokenFromHeader(authHeader) {
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
    static generateTokenPair(userId, email, role, tokenVersion = 0) {
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
    static decodeToken(token) {
        return jsonwebtoken_1.default.decode(token);
    }
    /**
     * Check if token is expired
     * @param token - JWT token to check
     * @returns boolean - True if token is expired
     */
    static isTokenExpired(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch (error) {
            return true;
        }
    }
}
exports.JWTUtils = JWTUtils;
JWTUtils.ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
JWTUtils.REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
JWTUtils.ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
JWTUtils.REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
//# sourceMappingURL=jwtUtils.js.map