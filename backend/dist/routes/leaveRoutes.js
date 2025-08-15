"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const leaveController_1 = require("../controllers/leaveController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const express_validator_1 = require("express-validator");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = express_1.default.Router();
// Validation schemas
const createLeaveValidation = [
    (0, express_validator_1.body)('leaveType')
        .isIn(['sick', 'casual', 'maternity', 'paternity', 'emergency', 'vacation', 'other'])
        .withMessage('Invalid leave type'),
    (0, express_validator_1.body)('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.body)('reason')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Reason must be between 10 and 1000 characters'),
    (0, express_validator_1.body)('isHalfDay')
        .optional()
        .isBoolean()
        .withMessage('isHalfDay must be a boolean'),
    (0, express_validator_1.body)('halfDaySession')
        .optional()
        .isIn(['morning', 'afternoon'])
        .withMessage('Half day session must be morning or afternoon'),
    (0, express_validator_1.body)('emergencyContact.name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Emergency contact name must be less than 100 characters'),
    (0, express_validator_1.body)('emergencyContact.phone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Emergency contact phone must be 10 digits'),
    (0, express_validator_1.body)('emergencyContact.relationship')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Relationship must be less than 50 characters'),
    (0, express_validator_1.body)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),
    validationSchemas_1.handleValidationErrors
];
const updateLeaveValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid leave request ID'),
    (0, express_validator_1.body)('leaveType')
        .optional()
        .isIn(['sick', 'casual', 'maternity', 'paternity', 'emergency', 'vacation', 'other'])
        .withMessage('Invalid leave type'),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.body)('reason')
        .optional()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Reason must be between 10 and 1000 characters'),
    (0, express_validator_1.body)('isHalfDay')
        .optional()
        .isBoolean()
        .withMessage('isHalfDay must be a boolean'),
    (0, express_validator_1.body)('halfDaySession')
        .optional()
        .isIn(['morning', 'afternoon'])
        .withMessage('Half day session must be morning or afternoon'),
    validationSchemas_1.handleValidationErrors
];
const getLeaveHistoryValidation = [
    (0, express_validator_1.param)('teacherId')
        .isMongoId()
        .withMessage('Invalid teacher ID'),
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'approved', 'rejected', 'cancelled'])
        .withMessage('Invalid status'),
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
const getAllLeavesValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'approved', 'rejected', 'cancelled'])
        .withMessage('Invalid status'),
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),
    (0, express_validator_1.query)('leaveType')
        .optional()
        .isIn(['sick', 'casual', 'maternity', 'paternity', 'emergency', 'vacation', 'other'])
        .withMessage('Invalid leave type'),
    (0, express_validator_1.query)('teacherId')
        .optional()
        .isMongoId()
        .withMessage('Invalid teacher ID'),
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
const leaveIdValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid leave request ID'),
    validationSchemas_1.handleValidationErrors
];
const cancelLeaveValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid leave request ID'),
    (0, express_validator_1.body)('reason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Cancellation reason must be less than 500 characters'),
    validationSchemas_1.handleValidationErrors
];
const approveLeaveValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid leave request ID'),
    (0, express_validator_1.body)('comments')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Comments must be less than 500 characters'),
    validationSchemas_1.handleValidationErrors
];
const rejectLeaveValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid leave request ID'),
    (0, express_validator_1.body)('comments')
        .isLength({ min: 1, max: 500 })
        .withMessage('Comments are required and must be less than 500 characters'),
    validationSchemas_1.handleValidationErrors
];
// Routes
// POST /api/leave - Create leave application (Teachers only)
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['teacher']), createLeaveValidation, leaveController_1.createLeaveApplication);
// GET /api/leave/teacher/:teacherId - Get teacher's leave history
// Teachers can only access their own history, admins can access any teacher's history
router.get('/teacher/:teacherId', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['teacher', 'admin']), getLeaveHistoryValidation, leaveController_1.getTeacherLeaveHistory);
// GET /api/leave - Get all leave requests (Admin only)
router.get('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), getAllLeavesValidation, leaveController_1.getAllLeaveRequests);
// GET /api/leave/:id - Get single leave request details
router.get('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['teacher', 'admin']), leaveIdValidation, leaveController_1.getLeaveRequestById);
// PUT /api/leave/:id - Update leave request (Teachers can only update their own pending requests)
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['teacher']), updateLeaveValidation, leaveController_1.updateLeaveRequest);
// PUT /api/leave/:id/cancel - Cancel leave request
router.put('/:id/cancel', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['teacher', 'admin']), cancelLeaveValidation, leaveController_1.cancelLeaveRequest);
// PUT /api/leave/:id/approve - Approve leave request (Admin only)
router.put('/:id/approve', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), approveLeaveValidation, leaveController_1.approveLeaveRequest);
// PUT /api/leave/:id/reject - Reject leave request (Admin only)
router.put('/:id/reject', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), rejectLeaveValidation, leaveController_1.rejectLeaveRequest);
exports.default = router;
//# sourceMappingURL=leaveRoutes.js.map