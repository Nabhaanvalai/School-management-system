import { User, IUser, UserRole } from '../models/User';
import { JWTUtils, JWTPayload } from '../utils/jwtUtils';
import { PasswordUtils } from '../utils/passwordUtils';

// Authentication result interfaces
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

// In-memory store for refresh tokens (in production, use Redis or database)
const refreshTokenStore = new Map<string, { userId: string; tokenVersion: number; expiresAt: Date }>();

/**
 * Authentication service for handling user authentication operations
 */
export class AuthService {
  /**
   * Authenticate user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Promise<LoginResult> - Authentication result
   */
  static async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Validate input
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required'
        };
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
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
      const userId = (user._id as any).toString();
      const tokens = JWTUtils.generateTokenPair(
        userId,
        user.email,
        user.role,
        tokenVersion
      );

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
    } catch (error) {
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
  static async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      if (!refreshToken) {
        return {
          success: false,
          message: 'Refresh token is required'
        };
      }

      // Verify refresh token
      const refreshPayload = JWTUtils.verifyRefreshToken(refreshToken);
      
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
      const user = await User.findById(refreshPayload.userId);
      if (!user || !user.isActive) {
        refreshTokenStore.delete(refreshToken);
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Generate new token pair
      const newTokenVersion = Date.now();
      const userId = (user._id as any).toString();
      const tokens = JWTUtils.generateTokenPair(
        userId,
        user.email,
        user.role,
        newTokenVersion
      );

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
    } catch (error) {
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
  static async logout(refreshToken: string): Promise<boolean> {
    try {
      if (!refreshToken) {
        return false;
      }

      // Remove refresh token from store
      const deleted = refreshTokenStore.delete(refreshToken);
      return deleted;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Validate access token
   * @param accessToken - Access token to validate
   * @returns TokenValidationResult - Validation result
   */
  static validateAccessToken(accessToken: string): TokenValidationResult {
    try {
      if (!accessToken) {
        return {
          isValid: false,
          message: 'Access token is required'
        };
      }

      const payload = JWTUtils.verifyAccessToken(accessToken);
      
      return {
        isValid: true,
        payload
      };
    } catch (error) {
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
  static async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
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
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Validate new password strength
      const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.messages.join(', ')
        };
      }

      // Get user with password
      const user = await User.findById(userId).select('+password');
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
    } catch (error) {
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
  static cleanupExpiredTokens(): void {
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
  static getRefreshTokenCount(): number {
    return refreshTokenStore.size;
  }

  /**
   * Revoke all refresh tokens for a user (useful for security)
   * @param userId - User ID
   * @returns number - Number of tokens revoked
   */
  static revokeAllUserTokens(userId: string): number {
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