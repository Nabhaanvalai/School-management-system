import express from 'express';
import {
  getStudentReportCard,
  getClassPerformanceReport,
  getStudentCountReport,
  getAttendanceSummaryReport
} from '../controllers/reportController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

// Validation error handler
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation schemas
const studentIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid student ID')
];

const classPerformanceValidation = [
  query('classId')
    .matches(/^[1-9][0-2]?-[A-F]$/)
    .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
  query('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('format')
    .optional()
    .isIn(['json', 'pdf', 'excel'])
    .withMessage('Format must be one of: json, pdf, excel')
];

const studentCountValidation = [
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('format')
    .optional()
    .isIn(['json', 'pdf', 'excel'])
    .withMessage('Format must be one of: json, pdf, excel')
];

const attendanceSummaryValidation = [
  query('classId')
    .optional()
    .matches(/^[1-9][0-2]?-[A-F]$/)
    .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
  query('subject')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject name must be between 2 and 50 characters'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('format')
    .optional()
    .isIn(['json', 'pdf', 'excel'])
    .withMessage('Format must be one of: json, pdf, excel')
];

// Routes

// Get student report card (Admin, Teacher can view their class students, Student/Parent can view own)
router.get(
  '/student/:id',
  authenticateToken,
  studentIdValidation,
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('format')
    .optional()
    .isIn(['json', 'pdf'])
    .withMessage('Format must be either json or pdf'),
  handleValidationErrors,
  getStudentReportCard
);

// Get class performance report (Admin and Teachers only)
router.get(
  '/class-performance',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  classPerformanceValidation,
  handleValidationErrors,
  getClassPerformanceReport
);

// Get student count/enrollment statistics (Admin only)
router.get(
  '/student-count',
  authenticateToken,
  requireRole(['admin']),
  studentCountValidation,
  handleValidationErrors,
  getStudentCountReport
);

// Get attendance summary analytics (Admin and Teachers only)
router.get(
  '/attendance-summary',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  attendanceSummaryValidation,
  handleValidationErrors,
  getAttendanceSummaryReport
);

export default router;