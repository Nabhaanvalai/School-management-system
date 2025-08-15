"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController_1 = require("../controllers/attendanceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Validation schemas for attendance routes
const updateAttendanceSchema = joi_1.default.object({
    status: joi_1.default.string()
        .valid('present', 'absent', 'late')
        .messages({
        'any.only': 'Status must be present, absent, or late'
    }),
    remarks: joi_1.default.string()
        .max(200)
        .allow('')
        .messages({
        'string.max': 'Remarks must be less than 200 characters'
    })
});
const attendanceQuerySchema = joi_1.default.object({
    subject: joi_1.default.string()
        .max(50)
        .messages({
        'string.max': 'Subject name cannot exceed 50 characters'
    }),
    startDate: joi_1.default.date()
        .messages({
        'date.base': 'Start date must be a valid date'
    }),
    endDate: joi_1.default.date()
        .min(joi_1.default.ref('startDate'))
        .messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date'
    }),
    academicYear: joi_1.default.string()
        .pattern(/^\d{4}-\d{4}$/)
        .messages({
        'string.pattern.base': 'Academic year must be in format "YYYY-YYYY"'
    }),
    date: joi_1.default.date()
        .messages({
        'date.base': 'Date must be a valid date'
    })
}).concat(validationSchemas_1.paginationSchema);
const classAttendanceParamsSchema = joi_1.default.object({
    classId: joi_1.default.string()
        .pattern(/^[1-9][0-2]?-[A-F]$/)
        .required()
        .messages({
        'string.pattern.base': 'Class ID must be in format "Standard-Section" (e.g., "8-A")',
        'any.required': 'Class ID is required'
    }),
    subject: joi_1.default.string()
        .min(2)
        .max(50)
        .required()
        .messages({
        'string.min': 'Subject name must be at least 2 characters long',
        'string.max': 'Subject name cannot exceed 50 characters',
        'any.required': 'Subject is required'
    })
});
const summaryQuerySchema = joi_1.default.object({
    startDate: joi_1.default.date()
        .required()
        .messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required'
    }),
    endDate: joi_1.default.date()
        .min(joi_1.default.ref('startDate'))
        .required()
        .messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date',
        'any.required': 'End date is required'
    }),
    academicYear: joi_1.default.string()
        .pattern(/^\d{4}-\d{4}$/)
        .messages({
        'string.pattern.base': 'Academic year must be in format "YYYY-YYYY"'
    })
});
const teacherRecordsQuerySchema = joi_1.default.object({
    classId: joi_1.default.string()
        .pattern(/^[1-9][0-2]?-[A-F]$/)
        .messages({
        'string.pattern.base': 'Class ID must be in format "Standard-Section" (e.g., "8-A")'
    }),
    subject: joi_1.default.string()
        .max(50)
        .messages({
        'string.max': 'Subject name cannot exceed 50 characters'
    }),
    startDate: joi_1.default.date()
        .messages({
        'date.base': 'Start date must be a valid date'
    }),
    endDate: joi_1.default.date()
        .min(joi_1.default.ref('startDate'))
        .messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date'
    }),
    academicYear: joi_1.default.string()
        .pattern(/^\d{4}-\d{4}$/)
        .messages({
        'string.pattern.base': 'Academic year must be in format "YYYY-YYYY"'
    })
}).concat(validationSchemas_1.paginationSchema);
// Mark attendance (Teachers and Admins only)
router.post('/mark', authMiddleware_1.authenticateToken, authMiddleware_1.requireTeacherOrAdmin, (0, authMiddleware_1.validateRequest)(validationSchemas_1.markAttendanceSchema, 'body'), attendanceController_1.AttendanceController.markAttendance);
// Update attendance (Teachers and Admins only)
router.put('/:id', authMiddleware_1.authenticateToken, authMiddleware_1.requireTeacherOrAdmin, (0, authMiddleware_1.validateRequest)(updateAttendanceSchema, 'body'), attendanceController_1.AttendanceController.updateAttendance);
// Get student attendance (Students can view their own, Teachers and Admins can view any)
router.get('/student/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.validateRequest)(attendanceQuerySchema, 'query'), attendanceController_1.AttendanceController.getStudentAttendance);
// Get student attendance percentage (Students can view their own, Teachers and Admins can view any)
router.get('/student/:id/percentage', authMiddleware_1.authenticateToken, (0, authMiddleware_1.validateRequest)(attendanceQuerySchema, 'query'), attendanceController_1.AttendanceController.getStudentAttendancePercentage);
// Get class attendance (Teachers and Admins only)
router.get('/class/:classId/subject/:subject', authMiddleware_1.authenticateToken, authMiddleware_1.requireTeacherOrAdmin, (0, authMiddleware_1.validateRequest)(classAttendanceParamsSchema, 'params'), (0, authMiddleware_1.validateRequest)(attendanceQuerySchema, 'query'), attendanceController_1.AttendanceController.getClassAttendance);
// Get class attendance summary (Teachers and Admins only)
router.get('/class/:classId/subject/:subject/summary', authMiddleware_1.authenticateToken, authMiddleware_1.requireTeacherOrAdmin, (0, authMiddleware_1.validateRequest)(classAttendanceParamsSchema, 'params'), (0, authMiddleware_1.validateRequest)(summaryQuerySchema, 'query'), attendanceController_1.AttendanceController.getClassAttendanceSummary);
// Get current teacher's attendance records (Teachers only)
router.get('/teacher/my-records', authMiddleware_1.authenticateToken, (0, authMiddleware_1.validateRequest)(teacherRecordsQuerySchema, 'query'), attendanceController_1.AttendanceController.getMyAttendanceRecords);
// Get specific teacher's attendance records (Admins only)
router.get('/teacher/:teacherId/records', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (0, authMiddleware_1.validateRequest)(teacherRecordsQuerySchema, 'query'), attendanceController_1.AttendanceController.getTeacherAttendanceRecords);
// Get monthly attendance summary for a student
router.get('/student/:id/monthly-summary', authMiddleware_1.authenticateToken, (0, authMiddleware_1.validateRequest)(summaryQuerySchema, 'query'), attendanceController_1.AttendanceController.getStudentMonthlySummary);
// Get yearly attendance summary for a student
router.get('/student/:id/yearly-summary', authMiddleware_1.authenticateToken, (0, authMiddleware_1.validateRequest)(summaryQuerySchema, 'query'), attendanceController_1.AttendanceController.getStudentYearlySummary);
// Get monthly attendance summary for a class and subject
router.get('/class/:classId/subject/:subject/monthly-summary', authMiddleware_1.authenticateToken, authMiddleware_1.requireTeacherOrAdmin, (0, authMiddleware_1.validateRequest)(classAttendanceParamsSchema, 'params'), (0, authMiddleware_1.validateRequest)(summaryQuerySchema, 'query'), attendanceController_1.AttendanceController.getClassMonthlySummary);
// Get yearly attendance summary for a class and subject
router.get('/class/:classId/subject/:subject/yearly-summary', authMiddleware_1.authenticateToken, authMiddleware_1.requireTeacherOrAdmin, (0, authMiddleware_1.validateRequest)(classAttendanceParamsSchema, 'params'), (0, authMiddleware_1.validateRequest)(summaryQuerySchema, 'query'), attendanceController_1.AttendanceController.getClassYearlySummary);
exports.default = router;
//# sourceMappingURL=attendanceRoutes.js.map