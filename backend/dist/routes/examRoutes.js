"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const examController_1 = require("../controllers/examController");
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
const createExamValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Exam name must be between 3 and 100 characters'),
    (0, express_validator_1.body)('academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"')
        .custom((value) => {
        const [startYear, endYear] = value.split('-').map(Number);
        if (endYear !== startYear + 1) {
            throw new Error('Academic year end year must be start year + 1');
        }
        if (startYear < 2000 || startYear > new Date().getFullYear() + 1) {
            throw new Error('Academic year start year must be between 2000 and next year');
        }
        return true;
    }),
    (0, express_validator_1.body)('classId')
        .matches(/^[1-9][0-2]?-[A-F]$/)
        .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
    (0, express_validator_1.body)('examType')
        .isIn(['unit-test', 'mid-term', 'final', 'annual'])
        .withMessage('Exam type must be one of: unit-test, mid-term, final, annual'),
    (0, express_validator_1.body)('subjects')
        .optional()
        .isArray()
        .withMessage('Subjects must be an array'),
    (0, express_validator_1.body)('subjects.*.subject')
        .if((0, express_validator_1.body)('subjects').exists())
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Subject name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('subjects.*.date')
        .if((0, express_validator_1.body)('subjects').exists())
        .isISO8601()
        .withMessage('Subject date must be a valid date')
        .custom((value) => {
        if (new Date(value) < new Date()) {
            throw new Error('Exam date cannot be in the past');
        }
        return true;
    }),
    (0, express_validator_1.body)('subjects.*.syllabus')
        .if((0, express_validator_1.body)('subjects').exists())
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Syllabus must be less than 1000 characters'),
    (0, express_validator_1.body)('subjects.*.maxMarks')
        .if((0, express_validator_1.body)('subjects').exists())
        .isInt({ min: 1, max: 1000 })
        .withMessage('Maximum marks must be between 1 and 1000'),
    (0, express_validator_1.body)('subjects.*.duration')
        .if((0, express_validator_1.body)('subjects').exists())
        .isInt({ min: 15, max: 480 })
        .withMessage('Duration must be between 15 and 480 minutes'),
    (0, express_validator_1.body)('subjects.*.startTime')
        .if((0, express_validator_1.body)('subjects').exists())
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Start time must be in HH:MM format'),
    (0, express_validator_1.body)('subjects.*.endTime')
        .if((0, express_validator_1.body)('subjects').exists())
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('End time must be in HH:MM format')
];
const updateExamValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Exam name must be between 3 and 100 characters'),
    (0, express_validator_1.body)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.body)('classId')
        .optional()
        .matches(/^[1-9][0-2]?-[A-F]$/)
        .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
    (0, express_validator_1.body)('examType')
        .optional()
        .isIn(['unit-test', 'mid-term', 'final', 'annual'])
        .withMessage('Exam type must be one of: unit-test, mid-term, final, annual'),
    (0, express_validator_1.body)('subjects')
        .optional()
        .isArray()
        .withMessage('Subjects must be an array')
];
const addSubjectValidation = [
    (0, express_validator_1.body)('subject')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Subject name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('date')
        .isISO8601()
        .withMessage('Date must be a valid date')
        .custom((value) => {
        if (new Date(value) < new Date()) {
            throw new Error('Exam date cannot be in the past');
        }
        return true;
    }),
    (0, express_validator_1.body)('syllabus')
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Syllabus must be less than 1000 characters'),
    (0, express_validator_1.body)('maxMarks')
        .isInt({ min: 1, max: 1000 })
        .withMessage('Maximum marks must be between 1 and 1000'),
    (0, express_validator_1.body)('duration')
        .isInt({ min: 15, max: 480 })
        .withMessage('Duration must be between 15 and 480 minutes'),
    (0, express_validator_1.body)('startTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Start time must be in HH:MM format'),
    (0, express_validator_1.body)('endTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('End time must be in HH:MM format')
];
const mongoIdValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid exam ID')
];
const classIdValidation = [
    (0, express_validator_1.param)('classId')
        .matches(/^[1-9][0-2]?-[A-F]$/)
        .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")')
];
const enterMarksValidation = [
    (0, express_validator_1.body)('studentMarks')
        .isArray({ min: 1 })
        .withMessage('Student marks must be a non-empty array'),
    (0, express_validator_1.body)('studentMarks.*.studentId')
        .isMongoId()
        .withMessage('Student ID must be a valid MongoDB ObjectId'),
    (0, express_validator_1.body)('studentMarks.*.marks')
        .isArray({ min: 1 })
        .withMessage('Marks must be a non-empty array'),
    (0, express_validator_1.body)('studentMarks.*.marks.*.subject')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Subject name is required'),
    (0, express_validator_1.body)('studentMarks.*.marks.*.marksObtained')
        .isNumeric({ no_symbols: false })
        .isFloat({ min: 0 })
        .withMessage('Marks obtained must be a non-negative number'),
    (0, express_validator_1.body)('studentMarks.*.marks.*.remarks')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Remarks must be less than 200 characters')
];
// Routes
// Create a new exam (Admin only)
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), createExamValidation, handleValidationErrors, examController_1.createExam);
// Get all exams with filtering
router.get('/', authMiddleware_1.authenticateToken, examController_1.getExams);
// Get upcoming exams
router.get('/upcoming', authMiddleware_1.authenticateToken, (0, express_validator_1.query)('classId')
    .optional()
    .matches(/^[1-9][0-2]?-[A-F]$/)
    .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'), (0, express_validator_1.query)('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'), handleValidationErrors, examController_1.getUpcomingExams);
// Get exams by class
router.get('/class/:classId', authMiddleware_1.authenticateToken, classIdValidation, (0, express_validator_1.query)('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'), handleValidationErrors, examController_1.getExamsByClass);
// Get a specific exam by ID
router.get('/:id', authMiddleware_1.authenticateToken, mongoIdValidation, handleValidationErrors, examController_1.getExamById);
// Update an exam (Admin only)
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), mongoIdValidation, updateExamValidation, handleValidationErrors, examController_1.updateExam);
// Delete an exam (Admin only)
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), mongoIdValidation, handleValidationErrors, examController_1.deleteExam);
// Add subject to an exam (Admin only)
router.post('/:id/subjects', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), mongoIdValidation, addSubjectValidation, handleValidationErrors, examController_1.addSubjectToExam);
// Remove subject from an exam (Admin only)
router.delete('/:id/subjects/:subject', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), mongoIdValidation, (0, express_validator_1.param)('subject')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Subject name is required'), handleValidationErrors, examController_1.removeSubjectFromExam);
// Enter marks for students in an exam (Admin only)
router.post('/:id/marks', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), mongoIdValidation, enterMarksValidation, handleValidationErrors, examController_1.enterMarks);
// Publish exam results (Admin only)
router.post('/:id/publish', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), mongoIdValidation, handleValidationErrors, examController_1.publishResults);
exports.default = router;
//# sourceMappingURL=examRoutes.js.map