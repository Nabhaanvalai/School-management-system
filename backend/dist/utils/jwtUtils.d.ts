import { UserRole } from '../models/User';
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
    iat?: number;
    exp?: number;
}
/**
 * JWT utility functions for token generation and validation
 */
export declare class JWTUtils {
    private static readonly ACCESS_TOKEN_SECRET;
    private static readonly REFRESH_TOKEN_SECRET;
    private static readonly ACCESS_TOKEN_EXPIRES_IN;
    private static readonly REFRESH_TOKEN_EXPIRES_IN;
    /**
     * Generate access token
     * @param payload - JWT payload containing user information
     * @returns string - Signed JWT access token
     */
    static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
    /**
     * Generate refresh token
     * @param payload - Refresh token payload
     * @returns string - Signed JWT refresh token
     */
    static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string;
    /**
     * Verify access token
     * @param token - JWT access token to verify
     * @returns JWTPayload - Decoded token payload
     * @throws Error if token is invalid or expired
     */
    static verifyAccessToken(token: string): JWTPayload;
    /**
     * Verify refresh token
     * @param token - JWT refresh token to verify
     * @returns RefreshTokenPayload - Decoded refresh token payload
     * @throws Error if token is invalid or expired
     */
    static verifyRefreshToken(token: string): RefreshTokenPayload;
    /**
     * Extract token from Authorization header
     * @param authHeader - Authorization header value
     * @returns string | null - Extracted token or null if not found
     */
    static extractTokenFromHeader(authHeader: string | undefined): string | null;
    /**
     * Generate token pair (access and refresh tokens)
     * @param userId - User ID
     * @param email - User email
     * @param role - User role
     * @param tokenVersion - Token version for refresh token
     * @returns Object containing access and refresh tokens
     */
    static generateTokenPair(userId: string, email: string, role: UserRole, tokenVersion?: number): {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
    /**
     * Decode token without verification (for debugging purposes)
     * @param token - JWT token to decode
     * @returns any - Decoded token payload
     */
    static decodeToken(token: string): any;
    /**
     * Check if token is expired
     * @param token - JWT token to check
     * @returns boolean - True if token is expired
     */
    static isTokenExpired(token: string): boolean;
}
//# sourceMappingURL=jwtUtils.d.ts.map