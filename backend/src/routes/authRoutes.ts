import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest, authenticateToken, rateLimit } from '../middleware/authMiddleware';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from '../middleware/validationSchemas';

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT tokens
 * @access  Public
 * @body    { email: string, password: string }
 */
router.post(
  '/login',
  rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validateRequest(loginSchema),
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken: string }
 */
router.post(
  '/refresh',
  rateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  validateRequest(refreshTokenSchema),
  AuthController.refresh
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Public
 * @body    { refreshToken: string }
 */
router.post(
  '/logout',
  validateRequest(refreshTokenSchema),
  AuthController.logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticateToken,
  AuthController.getProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword: string, newPassword: string }
 */
router.put(
  '/change-password',
  authenticateToken,
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);

export default router;