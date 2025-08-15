"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = require("../models/User");
const jwtUtils_1 = require("../utils/jwtUtils");
const passwordUtils_1 = require("../utils/passwordUtils");
// In-memory store for refresh tokens (in production, use Redis or database)
const refreshTokenStore = new Map();
/**
 * Authentication service for handling user authentication operations
 */
class AuthService {
    /**
     * Authenticate user with email and password
     * @param email - User email
     * @param password - User password
     * @returns Promise<LoginResult> - Authentication result
     */
    static async login(email, password) {
        try {
            // Validate input
            if (!email || !password) {
                return {
                    success: false,
                    message: 'Email and password are required'
                };
            }
            // Find user by email
            const user = await User_1.User.findOne({ email: email.toLowerCase() }).select('+password');
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            // Check if user is active
            if (!user.isActive) {
                return {
                    success: false,
                    message: 'Account is deactivated. Please contact administrator.'
                };
            }
            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            // Generate token version for refresh token
            const tokenVersion = Date.now();
            // Generate tokens
            const userId = user._id.toString();
            const tokens = jwtUtils_1.JWTUtils.generateTokenPair(userId, user.email, user.role, tokenVersion);
            // Store refresh token
            const refreshTokenExpiry = new Date();
            refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
            refreshTokenStore.set(tokens.refreshToken, {
                userId,
                tokenVersion,
                expiresAt: refreshTokenExpiry
            });
            return {
                success: true,
                user: {
                    id: userId,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                    isActive: user.isActive
                },
                tokens
            };
        }
        catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Authentication failed. Please try again.'
            };
        }
    }
    /**
     * Refresh access token using refresh token
     * @param refreshToken - Valid refresh token
     * @returns Promise<RefreshResult> - Token refresh result
     */
    static async refreshToken(refreshToken) {
        try {
            if (!refreshToken) {
                return {
                    success: false,
                    message: 'Refresh token is required'
                };
            }
            // Verify refresh token
            const refreshPayload = jwtUtils_1.JWTUtils.verifyRefreshToken(refreshToken);
            // Check if refresh token exists in store
            const storedToken = refreshTokenStore.get(refreshToken);
            if (!storedToken) {
                return {
                    success: false,
                    message: 'Invalid refresh token'
                };
            }
            // Check if token is expired
            if (storedToken.expiresAt < new Date()) {
                refreshTokenStore.delete(refreshToken);
                return {
                    success: false,
                    message: 'Refresh token has expired'
                };
            }
            // Verify token version matches
            if (storedToken.tokenVersion !== refreshPayload.tokenVersion) {
                refreshTokenStore.delete(refreshToken);
                return {
                    success: false,
                    message: 'Invalid refresh token version'
                };
            }
            // Get user details
            const user = await User_1.User.findById(refreshPayload.userId);
            if (!user || !user.isActive) {
                refreshTokenStore.delete(refreshToken);
                return {
                    success: false,
                    message: 'User not found or inactive'
                };
            }
            // Generate new token pair
            const newTokenVersion = Date.now();
            const userId = user._id.toString();
            const tokens = jwtUtils_1.JWTUtils.generateTokenPair(userId, user.email, user.role, newTokenVersion);
            // Remove old refresh token and store new one
            refreshTokenStore.delete(refreshToken);
            const newRefreshTokenExpiry = new Date();
            newRefreshTokenExpiry.setDate(newRefreshTokenExpiry.getDate() + 7);
            refreshTokenStore.set(tokens.refreshToken, {
                userId,
                tokenVersion: newTokenVersion,
                expiresAt: newRefreshTokenExpiry
            });
            return {
                success: true,
                tokens
            };
        }
        catch (error) {
            console.error('Token refresh error:', error);
            return {
                success: false,
                message: 'Token refresh failed'
            };
        }
    }
    /**
     * Logout user by invalidating refresh token
     * @param refreshToken - Refresh token to invalidate
     * @returns Promise<boolean> - Success status
     */
    static async logout(refreshToken) {
        try {
            if (!refreshToken) {
                return false;
            }
            // Remove refresh token from store
            const deleted = refreshTokenStore.delete(refreshToken);
            return deleted;
        }
        catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }
    /**
     * Validate access token
     * @param accessToken - Access token to validate
     * @returns TokenValidationResult - Validation result
     */
    static validateAccessToken(accessToken) {
        try {
            if (!accessToken) {
                return {
                    isValid: false,
                    message: 'Access token is required'
                };
            }
            const payload = jwtUtils_1.JWTUtils.verifyAccessToken(accessToken);
            return {
                isValid: true,
                payload
            };
        }
        catch (error) {
            return {
                isValid: false,
                message: error instanceof Error ? error.message : 'Token validation failed'
            };
        }
    }
    /**
     * Get user by ID (for token validation)
     * @param userId - User ID from token
     * @returns Promise<IUser | null> - User document or null
     */
    static async getUserById(userId) {
        try {
            return await User_1.User.findById(userId);
        }
        catch (error) {
            console.error('Get user by ID error:', error);
            return null;
        }
    }
    /**
     * Change user password
     * @param userId - User ID
     * @param currentPassword - Current password
     * @param newPassword - New password
     * @returns Promise<boolean> - Success status
     */
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            // Validate new password strength
            const passwordValidation = passwordUtils_1.PasswordUtils.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: passwordValidation.messages.join(', ')
                };
            }
            // Get user with password
            const user = await User_1.User.findById(userId).select('+password');
            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            // Verify current password
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return {
                    success: false,
                    message: 'Current password is incorrect'
                };
            }
            // Update password
            user.password = newPassword;
            await user.save();
            return {
                success: true,
                message: 'Password changed successfully'
            };
        }
        catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: 'Password change failed'
            };
        }
    }
    /**
     * Clean up expired refresh tokens (should be called periodically)
     */
    static cleanupExpiredTokens() {
        const now = new Date();
        for (const [token, data] of refreshTokenStore.entries()) {
            if (data.expiresAt < now) {
                refreshTokenStore.delete(token);
            }
        }
    }
    /**
     * Get refresh token store size (for monitoring)
     * @returns number - Number of stored refresh tokens
     */
    static getRefreshTokenCount() {
        return refreshTokenStore.size;
    }
    /**
     * Revoke all refresh tokens for a user (useful for security)
     * @param userId - User ID
     * @returns number - Number of tokens revoked
     */
    static revokeAllUserTokens(userId) {
        let revokedCount = 0;
        for (const [token, data] of refreshTokenStore.entries()) {
            if (data.userId === userId) {
                refreshTokenStore.delete(token);
                revokedCount++;
            }
        }
        return revokedCount;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map