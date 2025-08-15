import { IUser, UserRole } from '../models/User';
import { JWTPayload } from '../utils/jwtUtils';
export interface LoginResult {
    success: boolean;
    user?: {
        id: string;
        email: string;
        role: UserRole;
        profile: any;
        isActive: boolean;
    };
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
    message?: string;
}
export interface RefreshResult {
    success: boolean;
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
    message?: string;
}
export interface TokenValidationResult {
    isValid: boolean;
    payload?: JWTPayload;
    message?: string;
}
/**
 * Authentication service for handling user authentication operations
 */
export declare class AuthService {
    /**
     * Authenticate user with email and password
     * @param email - User email
     * @param password - User password
     * @returns Promise<LoginResult> - Authentication result
     */
    static login(email: string, password: string): Promise<LoginResult>;
    /**
     * Refresh access token using refresh token
     * @param refreshToken - Valid refresh token
     * @returns Promise<RefreshResult> - Token refresh result
     */
    static refreshToken(refreshToken: string): Promise<RefreshResult>;
    /**
     * Logout user by invalidating refresh token
     * @param refreshToken - Refresh token to invalidate
     * @returns Promise<boolean> - Success status
     */
    static logout(refreshToken: string): Promise<boolean>;
    /**
     * Validate access token
     * @param accessToken - Access token to validate
     * @returns TokenValidationResult - Validation result
     */
    static validateAccessToken(accessToken: string): TokenValidationResult;
    /**
     * Get user by ID (for token validation)
     * @param userId - User ID from token
     * @returns Promise<IUser | null> - User document or null
     */
    static getUserById(userId: string): Promise<IUser | null>;
    /**
     * Change user password
     * @param userId - User ID
     * @param currentPassword - Current password
     * @param newPassword - New password
     * @returns Promise<boolean> - Success status
     */
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        message?: string;
    }>;
    /**
     * Clean up expired refresh tokens (should be called periodically)
     */
    static cleanupExpiredTokens(): void;
    /**
     * Get refresh token store size (for monitoring)
     * @returns number - Number of stored refresh tokens
     */
    static getRefreshTokenCount(): number;
    /**
     * Revoke all refresh tokens for a user (useful for security)
     * @param userId - User ID
     * @returns number - Number of tokens revoked
     */
    static revokeAllUserTokens(userId: string): number;
}
//# sourceMappingURL=authService.d.ts.map