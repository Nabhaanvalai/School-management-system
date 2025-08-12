import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

/**
 * Authentication controller handling login, refresh, and logout operations
 */
export class AuthController {
  /**
   * Handle user login
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            user: result.user,
            tokens: result.tokens
          }
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message || 'Login failed'
        });
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Handle token refresh
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await AuthService.refreshToken(refreshToken);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Token refreshed successfully',
          data: {
            tokens: result.tokens
          }
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message || 'Token refresh failed'
        });
      }
    } catch (error) {
      console.error('Token refresh controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Handle user logout
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const success = await AuthService.logout(refreshToken);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Logout successful'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Logout failed - invalid or missing refresh token'
        });
      }
    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Change user password
   * PUT /api/auth/change-password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      const result = await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message || 'Password changed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Password change failed'
        });
      }
    } catch (error) {
      console.error('Change password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}