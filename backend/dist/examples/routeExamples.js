"use strict";
/**
 * Example routes demonstrating authentication middleware usage
 * This file shows how to use the implemented middleware in actual routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = (0, express_1.Router)();
// Apply security headers to all routes
router.use(authMiddleware_1.securityHeaders);
// Apply request sanitization to all routes
router.use(authMiddleware_1.sanitizeRequest);
// Apply rate limiting to all routes (100 requests per 15 minutes)
router.use((0, authMiddleware_1.rateLimit)(100, 15 * 60 * 1000));
/**
 * Public route - no authentication required
 */
router.get('/public/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});
/**
 * Login route - validates request body but no authentication required
 */
router.post('/auth/login', (0, authMiddleware_1.validateRequest)(validationSchemas_1.loginSchema), (req, res) => {
    // Login logic would go here
    res.json({ message: 'Login endpoint - request validated' });
});
/**
 * Protected route - requires authentication
 */
router.get('/protected/profile', authMiddleware_1.authenticateToken, (req, res) => {
    // User is guaranteed to be authenticated here
    res.json({
        message: 'Protected route accessed',
        user: req.user
    });
});
/**
 * Admin-only route - requires admin role
 */
router.get('/admin/users', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => {
    // Only admin users can access this route
    res.json({
        message: 'Admin route accessed',
        user: req.user
    });
});
/**
 * Teacher or Admin route - requires teacher or admin role
 */
router.get('/teacher/classes', authMiddleware_1.authenticateToken, authMiddleware_1.requireTeacherOrAdmin, (req, res) => {
    // Teachers and admins can access this route
    res.json({
        message: 'Teacher/Admin route accessed',
        user: req.user
    });
});
/**
 * Admin route with request validation
 */
router.post('/admin/students', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (0, authMiddleware_1.validateRequest)(validationSchemas_1.createStudentSchema), (req, res) => {
    // Only admins can create students, and request is validated
    res.json({
        message: 'Student creation endpoint',
        user: req.user,
        validatedData: req.body
    });
});
/**
 * Route with custom rate limiting (stricter for sensitive operations)
 */
router.post('/admin/delete-user/:id', (0, authMiddleware_1.rateLimit)(5, 60 * 1000), // Only 5 requests per minute for delete operations
authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => {
    // Highly restricted admin operation
    res.json({
        message: 'Delete user endpoint (rate limited)',
        userId: req.params.id,
        user: req.user
    });
});
exports.default = router;
//# sourceMappingURL=routeExamples.js.map