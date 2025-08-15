import express from 'express';
import {
  createLeaveApplication,
  getTeacherLeaveHistory,
  getAllLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  cancelLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest
} from '../controllers/leaveController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validationSchemas';

const router = express.Router();

// Validation schemas
const createLeaveValidation = [
  body('leaveType')
    .isIn(['sick', 'casual', 'maternity', 'paternity', 'emergency', 'vacation', 'other'])
    .withMessage('Invalid leave type'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('reason')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  body('isHalfDay')
    .optional()
    .isBoolean()
    .withMessage('isHalfDay must be a boolean'),
  body('halfDaySession')
    .optional()
    .isIn(['morning', 'afternoon'])
    .withMessage('Half day session must be morning or afternoon'),
  body('emergencyContact.name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name must be less than 100 characters'),
  body('emergencyContact.phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Emergency contact phone must be 10 digits'),
  body('emergencyContact.relationship')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Relationship must be less than 50 characters'),
  body('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  handleValidationErrors
];

const updateLeaveValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid leave request ID'),
  body('leaveType')
    .optional()
    .isIn(['sick', 'casual', 'maternity', 'paternity', 'emergency', 'vacation', 'other'])
    .withMessage('Invalid leave type'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('reason')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  body('isHalfDay')
    .optional()
    .isBoolean()
    .withMessage('isHalfDay must be a boolean'),
  body('halfDaySession')
    .optional()
    .isIn(['morning', 'afternoon'])
    .withMessage('Half day session must be morning or afternoon'),
  handleValidationErrors
];

const getLeaveHistoryValidation = [
  param('teacherId')
    .isMongoId()
    .withMessage('Invalid teacher ID'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const getAllLeavesValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  query('leaveType')
    .optional()
    .isIn(['sick', 'casual', 'maternity', 'paternity', 'emergency', 'vacation', 'other'])
    .withMessage('Invalid leave type'),
  query('teacherId')
    .optional()
    .isMongoId()
    .withMessage('Invalid teacher ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const leaveIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid leave request ID'),
  handleValidationErrors
];

const cancelLeaveValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid leave request ID'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must be less than 500 characters'),
  handleValidationErrors
];

const approveLeaveValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid leave request ID'),
  body('comments')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters'),
  handleValidationErrors
];

const rejectLeaveValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid leave request ID'),
  body('comments')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comments are required and must be less than 500 characters'),
  handleValidationErrors
];

// Routes

// POST /api/leave - Create leave application (Teachers only)
router.post(
  '/',
  authenticateToken,
  requireRole(['teacher']),
  createLeaveValidation,
  createLeaveApplication
);

// GET /api/leave/teacher/:teacherId - Get teacher's leave history
// Teachers can only access their own history, admins can access any teacher's history
router.get(
  '/teacher/:teacherId',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  getLeaveHistoryValidation,
  getTeacherLeaveHistory
);

// GET /api/leave - Get all leave requests (Admin only)
router.get(
  '/',
  authenticateToken,
  requireRole(['admin']),
  getAllLeavesValidation,
  getAllLeaveRequests
);

// GET /api/leave/:id - Get single leave request details
router.get(
  '/:id',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  leaveIdValidation,
  getLeaveRequestById
);

// PUT /api/leave/:id - Update leave request (Teachers can only update their own pending requests)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['teacher']),
  updateLeaveValidation,
  updateLeaveRequest
);

// PUT /api/leave/:id/cancel - Cancel leave request
router.put(
  '/:id/cancel',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  cancelLeaveValidation,
  cancelLeaveRequest
);

// PUT /api/leave/:id/approve - Approve leave request (Admin only)
router.put(
  '/:id/approve',
  authenticateToken,
  requireRole(['admin']),
  approveLeaveValidation,
  approveLeaveRequest
);

// PUT /api/leave/:id/reject - Reject leave request (Admin only)
router.put(
  '/:id/reject',
  authenticateToken,
  requireRole(['admin']),
  rejectLeaveValidation,
  rejectLeaveRequest
);

export default router;