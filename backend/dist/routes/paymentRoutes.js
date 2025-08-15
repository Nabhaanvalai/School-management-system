"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const express_validator_1 = require("express-validator");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = express_1.default.Router();
// Validation schemas
const createPaymentValidation = [
    (0, express_validator_1.body)('paymentType')
        .isIn(['student-fee', 'teacher-salary', 'staff-salary', 'other'])
        .withMessage('Invalid payment type'),
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 0, max: 10000000 })
        .withMessage('Amount must be a positive number less than 10,000,000'),
    (0, express_validator_1.body)('dueDate')
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    (0, express_validator_1.body)('academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"')
        .custom((value) => {
        const [startYear, endYear] = value.split('-').map(Number);
        if (endYear !== startYear + 1 || startYear < 2000 || startYear > new Date().getFullYear() + 1) {
            throw new Error('Invalid academic year range');
        }
        return true;
    }),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Description must be between 5 and 500 characters'),
    (0, express_validator_1.body)('studentId')
        .optional()
        .isMongoId()
        .withMessage('Invalid student ID'),
    (0, express_validator_1.body)('teacherId')
        .optional()
        .isMongoId()
        .withMessage('Invalid teacher ID'),
    (0, express_validator_1.body)('userId')
        .optional()
        .isMongoId()
        .withMessage('Invalid user ID'),
    (0, express_validator_1.body)('feeCategory')
        .optional()
        .isIn(['tuition', 'admission', 'exam', 'transport', 'library', 'sports', 'other'])
        .withMessage('Invalid fee category'),
    (0, express_validator_1.body)('month')
        .optional()
        .isIn(['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'])
        .withMessage('Invalid month'),
    (0, express_validator_1.body)('year')
        .optional()
        .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid year'),
    (0, express_validator_1.body)('remarks')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Remarks must be less than 1000 characters'),
    validationSchemas_1.handleValidationErrors
];
const updatePaymentStatusValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid payment ID'),
    (0, express_validator_1.body)('status')
        .isIn(['pending', 'paid', 'overdue', 'cancelled'])
        .withMessage('Invalid payment status'),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isIn(['cash', 'bank-transfer', 'cheque', 'online', 'card'])
        .withMessage('Invalid payment method'),
    (0, express_validator_1.body)('transactionId')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Transaction ID must be less than 100 characters'),
    (0, express_validator_1.body)('remarks')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Remarks must be less than 1000 characters'),
    validationSchemas_1.handleValidationErrors
];
const updatePaymentValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid payment ID'),
    (0, express_validator_1.body)('amount')
        .optional()
        .isFloat({ min: 0, max: 10000000 })
        .withMessage('Amount must be a positive number less than 10,000,000'),
    (0, express_validator_1.body)('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Description must be between 5 and 500 characters'),
    (0, express_validator_1.body)('remarks')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Remarks must be less than 1000 characters'),
    validationSchemas_1.handleValidationErrors
];
const getPaymentValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid payment ID'),
    validationSchemas_1.handleValidationErrors
];
const getPaymentsValidation = [
    (0, express_validator_1.query)('paymentType')
        .optional()
        .isIn(['student-fee', 'teacher-salary', 'staff-salary', 'other'])
        .withMessage('Invalid payment type'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'paid', 'overdue', 'cancelled'])
        .withMessage('Invalid payment status'),
    (0, express_validator_1.query)('studentId')
        .optional()
        .isMongoId()
        .withMessage('Invalid student ID'),
    (0, express_validator_1.query)('teacherId')
        .optional()
        .isMongoId()
        .withMessage('Invalid teacher ID'),
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.query)('month')
        .optional()
        .isIn(['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'])
        .withMessage('Invalid month'),
    (0, express_validator_1.query)('year')
        .optional()
        .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid year'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validationSchemas_1.handleValidationErrors
];
const getStudentPaymentHistoryValidation = [
    (0, express_validator_1.param)('studentId')
        .isMongoId()
        .withMessage('Invalid student ID'),
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'paid', 'overdue', 'cancelled'])
        .withMessage('Invalid payment status'),
    validationSchemas_1.handleValidationErrors
];
const getTeacherPaymentHistoryValidation = [
    (0, express_validator_1.param)('teacherId')
        .isMongoId()
        .withMessage('Invalid teacher ID'),
    (0, express_validator_1.query)('year')
        .optional()
        .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid year'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'paid', 'overdue', 'cancelled'])
        .withMessage('Invalid payment status'),
    validationSchemas_1.handleValidationErrors
];
const getPaymentSummaryValidation = [
    (0, express_validator_1.query)('paymentType')
        .notEmpty()
        .isIn(['student-fee', 'teacher-salary', 'staff-salary', 'other'])
        .withMessage('Valid payment type is required'),
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.query)('month')
        .optional()
        .isIn(['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'])
        .withMessage('Invalid month'),
    (0, express_validator_1.query)('year')
        .optional()
        .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid year'),
    validationSchemas_1.handleValidationErrors
];
// Routes
// POST /api/payments - Create a new payment record (Admin only)
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), createPaymentValidation, paymentController_1.createPayment);
// GET /api/payments - Get payment records with filtering
router.get('/', authMiddleware_1.authenticateToken, getPaymentsValidation, paymentController_1.getPayments);
// GET /api/payments/overdue - Get overdue payments
router.get('/overdue', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, express_validator_1.query)('paymentType')
    .optional()
    .isIn(['student-fee', 'teacher-salary', 'staff-salary', 'other'])
    .withMessage('Invalid payment type'), validationSchemas_1.handleValidationErrors, paymentController_1.getOverduePayments);
// GET /api/payments/summary - Get payment summary/statistics
router.get('/summary', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), getPaymentSummaryValidation, paymentController_1.getPaymentSummary);
// GET /api/payments/student/:studentId - Get student payment history
router.get('/student/:studentId', authMiddleware_1.authenticateToken, getStudentPaymentHistoryValidation, paymentController_1.getStudentPaymentHistory);
// GET /api/payments/teacher/:teacherId - Get teacher payment history
router.get('/teacher/:teacherId', authMiddleware_1.authenticateToken, getTeacherPaymentHistoryValidation, paymentController_1.getTeacherPaymentHistory);
// GET /api/payments/:id - Get a specific payment record
router.get('/:id', authMiddleware_1.authenticateToken, getPaymentValidation, paymentController_1.getPaymentById);
// PUT /api/payments/:id/status - Update payment status (Admin only)
router.put('/:id/status', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), updatePaymentStatusValidation, paymentController_1.updatePaymentStatus);
// PUT /api/payments/:id - Update payment record (Admin only)
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), updatePaymentValidation, paymentController_1.updatePayment);
// DELETE /api/payments/:id - Delete payment record (Admin only)
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, express_validator_1.param)('id')
    .isMongoId()
    .withMessage('Invalid payment ID'), (0, express_validator_1.body)('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'), validationSchemas_1.handleValidationErrors, paymentController_1.deletePayment);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map