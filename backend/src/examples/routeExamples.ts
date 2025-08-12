/**
 * Example routes demonstrating authentication middleware usage
 * This file shows how to use the implemented middleware in actual routes
 */

import { Router, Request, Response } from 'express';
import {
  authenticateToken,
  requireAdmin,
  requireTeacherOrAdmin,
  validateRequest,
  securityHeaders,
  sanitizeRequest,
  rateLimit
} from '../middleware/authMiddleware';
import { loginSchema, createStudentSchema } from '../middleware/validationSchemas';

const router = Router();

// Apply security headers to all routes
router.use(securityHeaders);

// Apply request sanitization to all routes
router.use(sanitizeRequest);

// Apply rate limiting to all routes (100 requests per 15 minutes)
router.use(rateLimit(100, 15 * 60 * 1000));

/**
 * Public route - no authentication required
 */
router.get('/public/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

/**
 * Login route - validates request body but no authentication required
 */
router.post('/auth/login', validateRequest(loginSchema), (req: Request, res: Response) => {
  // Login logic would go here
  res.json({ message: 'Login endpoint - request validated' });
});

/**
 * Protected route - requires authentication
 */
router.get('/protected/profile', authenticateToken, (req: Request, res: Response) => {
  // User is guaranteed to be authenticated here
  res.json({
    message: 'Protected route accessed',
    user: req.user
  });
});

/**
 * Admin-only route - requires admin role
 */
router.get('/admin/users', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  // Only admin users can access this route
  res.json({
    message: 'Admin route accessed',
    user: req.user
  });
});

/**
 * Teacher or Admin route - requires teacher or admin role
 */
router.get('/teacher/classes', authenticateToken, requireTeacherOrAdmin, (req: Request, res: Response) => {
  // Teachers and admins can access this route
  res.json({
    message: 'Teacher/Admin route accessed',
    user: req.user
  });
});

/**
 * Admin route with request validation
 */
router.post('/admin/students', 
  authenticateToken, 
  requireAdmin, 
  validateRequest(createStudentSchema), 
  (req: Request, res: Response) => {
    // Only admins can create students, and request is validated
    res.json({
      message: 'Student creation endpoint',
      user: req.user,
      validatedData: req.body
    });
  }
);

/**
 * Route with custom rate limiting (stricter for sensitive operations)
 */
router.post('/admin/delete-user/:id',
  rateLimit(5, 60 * 1000), // Only 5 requests per minute for delete operations
  authenticateToken,
  requireAdmin,
  (req: Request, res: Response) => {
    // Highly restricted admin operation
    res.json({
      message: 'Delete user endpoint (rate limited)',
      userId: req.params.id,
      user: req.user
    });
  }
);

export default router;