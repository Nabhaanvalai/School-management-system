"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid student ID')
];
const classPerformanceValidation = [
    (0, express_validator_1.query)('classId')
        .matches(/^[1-9][0-2]?-[A-F]$/)
        .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
    (0, express_validator_1.query)('academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.query)('format')
        .optional()
        .isIn(['json', 'pdf', 'excel'])
        .withMessage('Format must be one of: json, pdf, excel')
];
const studentCountValidation = [
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.query)('format')
        .optional()
        .isIn(['json', 'pdf', 'excel'])
        .withMessage('Format must be one of: json, pdf, excel')
];
const attendanceSummaryValidation = [
    (0, express_validator_1.query)('classId')
        .optional()
        .matches(/^[1-9][0-2]?-[A-F]$/)
        .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
    (0, express_validator_1.query)('subject')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Subject name must be between 2 and 50 characters'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in ISO 8601 format'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be in ISO 8601 format'),
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.query)('format')
        .optional()
        .isIn(['json', 'pdf', 'excel'])
        .withMessage('Format must be one of: json, pdf, excel')
];
// Routes
// Get student report card (Admin, Teacher can view their class students, Student/Parent can view own)
router.get('/student/:id', authMiddleware_1.authenticateToken, studentIdValidation, (0, express_validator_1.query)('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'), (0, express_validator_1.query)('format')
    .optional()
    .isIn(['json', 'pdf'])
    .withMessage('Format must be either json or pdf'), handleValidationErrors, reportController_1.getStudentReportCard);
// Get class performance report (Admin and Teachers only)
router.get('/class-performance', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), classPerformanceValidation, handleValidationErrors, reportController_1.getClassPerformanceReport);
// Get student count/enrollment statistics (Admin only)
router.get('/student-count', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), studentCountValidation, handleValidationErrors, reportController_1.getStudentCountReport);
// Get attendance summary analytics (Admin and Teachers only)
router.get('/attendance-summary', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), attendanceSummaryValidation, handleValidationErrors, reportController_1.getAttendanceSummaryReport);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map