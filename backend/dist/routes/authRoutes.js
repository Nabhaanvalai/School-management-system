"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = (0, express_1.Router)();
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
router.post('/login', (0, authMiddleware_1.rateLimit)(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
(0, authMiddleware_1.validateRequest)(validationSchemas_1.loginSchema), authController_1.AuthController.login);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken: string }
 */
router.post('/refresh', (0, authMiddleware_1.rateLimit)(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
(0, authMiddleware_1.validateRequest)(validationSchemas_1.refreshTokenSchema), authController_1.AuthController.refresh);
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Public
 * @body    { refreshToken: string }
 */
router.post('/logout', (0, authMiddleware_1.validateRequest)(validationSchemas_1.refreshTokenSchema), authController_1.AuthController.logout);
/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authMiddleware_1.authenticateToken, authController_1.AuthController.getProfile);
/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword: string, newPassword: string }
 */
router.put('/change-password', authMiddleware_1.authenticateToken, (0, authMiddleware_1.validateRequest)(validationSchemas_1.changePasswordSchema), authController_1.AuthController.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map