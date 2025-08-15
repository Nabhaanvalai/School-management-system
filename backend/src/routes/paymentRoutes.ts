import express from 'express';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  getStudentPaymentHistory,
  getTeacherPaymentHistory,
  getOverduePayments,
  getPaymentSummary,
  updatePayment,
  deletePayment
} from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validationSchemas';

const router = express.Router();

// Validation schemas
const createPaymentValidation = [
  body('paymentType')
    .isIn(['student-fee', 'teacher-salary', 'staff-salary', 'other'])
    .withMessage('Invalid payment type'),
  body('amount')
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('Amount must be a positive number less than 10,000,000'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"')
    .custom((value) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1 || startYear < 2000 || startYear > new Date().getFullYear() + 1) {
        throw new Error('Invalid academic year range');
      }
      return true;
    }),
  body('description')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  body('studentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('teacherId')
    .optional()
    .isMongoId()
    .withMessage('Invalid teacher ID'),
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('feeCategory')
    .optional()
    .isIn(['tuition', 'admission', 'exam', 'transport', 'library', 'sports', 'other'])
    .withMessage('Invalid fee category'),
  body('month')
    .optional()
    .isIn(['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'])
    .withMessage('Invalid month'),
  body('year')
    .optional()
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must be less than 1000 characters'),
  handleValidationErrors
];

const updatePaymentStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('status')
    .isIn(['pending', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid payment status'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank-transfer', 'cheque', 'online', 'card'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must be less than 100 characters'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must be less than 1000 characters'),
  handleValidationErrors
];

const updatePaymentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('amount')
    .optional()
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('Amount must be a positive number less than 10,000,000'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must be less than 1000 characters'),
  handleValidationErrors
];

const getPaymentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  handleValidationErrors
];

const getPaymentsValidation = [
  query('paymentType')
    .optional()
    .isIn(['student-fee', 'teacher-salary', 'staff-salary', 'other'])
    .withMessage('Invalid payment type'),
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid payment status'),
  query('studentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('teacherId')
    .optional()
    .isMongoId()
    .withMessage('Invalid teacher ID'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('month')
    .optional()
    .isIn(['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'])
    .withMessage('Invalid month'),
  query('year')
    .optional()
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year'),
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

const getStudentPaymentHistoryValidation = [
  param('studentId')
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid payment status'),
  handleValidationErrors
];

const getTeacherPaymentHistoryValidation = [
  param('teacherId')
    .isMongoId()
    .withMessage('Invalid teacher ID'),
  query('year')
    .optional()
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year'),
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid payment status'),
  handleValidationErrors
];

const getPaymentSummaryValidation = [
  query('paymentType')
    .notEmpty()
    .isIn(['student-fee', 'teacher-salary', 'staff-salary', 'other'])
    .withMessage('Valid payment type is required'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('month')
    .optional()
    .isIn(['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'])
    .withMessage('Invalid month'),
  query('year')
    .optional()
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year'),
  handleValidationErrors
];

// Routes

// POST /api/payments - Create a new payment record (Admin only)
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  createPaymentValidation,
  createPayment
);

// GET /api/payments - Get payment records with filtering
router.get(
  '/',
  authenticateToken,
  getPaymentsValidation,
  getPayments
);

// GET /api/payments/overdue - Get overdue payments
router.get(
  '/overdue',
  authenticateToken,
  requireRole(['admin']),
  query('paymentType')
    .optional()
    .isIn(['student-fee', 'teacher-salary', 'staff-salary', 'other'])
    .withMessage('Invalid payment type'),
  handleValidationErrors,
  getOverduePayments
);

// GET /api/payments/summary - Get payment summary/statistics
router.get(
  '/summary',
  authenticateToken,
  requireRole(['admin']),
  getPaymentSummaryValidation,
  getPaymentSummary
);

// GET /api/payments/student/:studentId - Get student payment history
router.get(
  '/student/:studentId',
  authenticateToken,
  getStudentPaymentHistoryValidation,
  getStudentPaymentHistory
);

// GET /api/payments/teacher/:teacherId - Get teacher payment history
router.get(
  '/teacher/:teacherId',
  authenticateToken,
  getTeacherPaymentHistoryValidation,
  getTeacherPaymentHistory
);

// GET /api/payments/:id - Get a specific payment record
router.get(
  '/:id',
  authenticateToken,
  getPaymentValidation,
  getPaymentById
);

// PUT /api/payments/:id/status - Update payment status (Admin only)
router.put(
  '/:id/status',
  authenticateToken,
  requireRole(['admin']),
  updatePaymentStatusValidation,
  updatePaymentStatus
);

// PUT /api/payments/:id - Update payment record (Admin only)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  updatePaymentValidation,
  updatePayment
);

// DELETE /api/payments/:id - Delete payment record (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  param('id')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  handleValidationErrors,
  deletePayment
);

export default router;