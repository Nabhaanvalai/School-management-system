import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { 
  authenticateToken, 
  requireTeacherOrAdmin, 
  requireAdmin,
  validateRequest 
} from '../middleware/authMiddleware';
import { markAttendanceSchema, paginationSchema } from '../middleware/validationSchemas';
import Joi from 'joi';

const router = Router();

// Validation schemas for attendance routes
const updateAttendanceSchema = Joi.object({
  status: Joi.string()
    .valid('present', 'absent', 'late')
    .messages({
      'any.only': 'Status must be present, absent, or late'
    }),
  remarks: Joi.string()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Remarks must be less than 200 characters'
    })
});

const attendanceQuerySchema = Joi.object({
  subject: Joi.string()
    .max(50)
    .messages({
      'string.max': 'Subject name cannot exceed 50 characters'
    }),
  startDate: Joi.date()
    .messages({
      'date.base': 'Start date must be a valid date'
    }),
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date'
    }),
  academicYear: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      'string.pattern.base': 'Academic year must be in format "YYYY-YYYY"'
    }),
  date: Joi.date()
    .messages({
      'date.base': 'Date must be a valid date'
    })
}).concat(paginationSchema);

const classAttendanceParamsSchema = Joi.object({
  classId: Joi.string()
    .pattern(/^[1-9][0-2]?-[A-F]$/)
    .required()
    .messages({
      'string.pattern.base': 'Class ID must be in format "Standard-Section" (e.g., "8-A")',
      'any.required': 'Class ID is required'
    }),
  subject: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Subject name must be at least 2 characters long',
      'string.max': 'Subject name cannot exceed 50 characters',
      'any.required': 'Subject is required'
    })
});

const summaryQuerySchema = Joi.object({
  startDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required'
    }),
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date',
      'any.required': 'End date is required'
    }),
  academicYear: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      'string.pattern.base': 'Academic year must be in format "YYYY-YYYY"'
    })
});

const teacherRecordsQuerySchema = Joi.object({
  classId: Joi.string()
    .pattern(/^[1-9][0-2]?-[A-F]$/)
    .messages({
      'string.pattern.base': 'Class ID must be in format "Standard-Section" (e.g., "8-A")'
    }),
  subject: Joi.string()
    .max(50)
    .messages({
      'string.max': 'Subject name cannot exceed 50 characters'
    }),
  startDate: Joi.date()
    .messages({
      'date.base': 'Start date must be a valid date'
    }),
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date'
    }),
  academicYear: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      'string.pattern.base': 'Academic year must be in format "YYYY-YYYY"'
    })
}).concat(paginationSchema);

// Mark attendance (Teachers and Admins only)
router.post(
  '/mark',
  authenticateToken,
  requireTeacherOrAdmin,
  validateRequest(markAttendanceSchema, 'body'),
  AttendanceController.markAttendance
);

// Update attendance (Teachers and Admins only)
router.put(
  '/:id',
  authenticateToken,
  requireTeacherOrAdmin,
  validateRequest(updateAttendanceSchema, 'body'),
  AttendanceController.updateAttendance
);

// Get student attendance (Students can view their own, Teachers and Admins can view any)
router.get(
  '/student/:id',
  authenticateToken,
  validateRequest(attendanceQuerySchema, 'query'),
  AttendanceController.getStudentAttendance
);

// Get student attendance percentage (Students can view their own, Teachers and Admins can view any)
router.get(
  '/student/:id/percentage',
  authenticateToken,
  validateRequest(attendanceQuerySchema, 'query'),
  AttendanceController.getStudentAttendancePercentage
);

// Get class attendance (Teachers and Admins only)
router.get(
  '/class/:classId/subject/:subject',
  authenticateToken,
  requireTeacherOrAdmin,
  validateRequest(classAttendanceParamsSchema, 'params'),
  validateRequest(attendanceQuerySchema, 'query'),
  AttendanceController.getClassAttendance
);

// Get class attendance summary (Teachers and Admins only)
router.get(
  '/class/:classId/subject/:subject/summary',
  authenticateToken,
  requireTeacherOrAdmin,
  validateRequest(classAttendanceParamsSchema, 'params'),
  validateRequest(summaryQuerySchema, 'query'),
  AttendanceController.getClassAttendanceSummary
);

// Get current teacher's attendance records (Teachers only)
router.get(
  '/teacher/my-records',
  authenticateToken,
  validateRequest(teacherRecordsQuerySchema, 'query'),
  AttendanceController.getMyAttendanceRecords
);

// Get specific teacher's attendance records (Admins only)
router.get(
  '/teacher/:teacherId/records',
  authenticateToken,
  requireAdmin,
  validateRequest(teacherRecordsQuerySchema, 'query'),
  AttendanceController.getTeacherAttendanceRecords
);

// Get monthly attendance summary for a student
router.get(
  '/student/:id/monthly-summary',
  authenticateToken,
  validateRequest(summaryQuerySchema, 'query'),
  AttendanceController.getStudentMonthlySummary
);

// Get yearly attendance summary for a student
router.get(
  '/student/:id/yearly-summary',
  authenticateToken,
  validateRequest(summaryQuerySchema, 'query'),
  AttendanceController.getStudentYearlySummary
);

// Get monthly attendance summary for a class and subject
router.get(
  '/class/:classId/subject/:subject/monthly-summary',
  authenticateToken,
  requireTeacherOrAdmin,
  validateRequest(classAttendanceParamsSchema, 'params'),
  validateRequest(summaryQuerySchema, 'query'),
  AttendanceController.getClassMonthlySummary
);

// Get yearly attendance summary for a class and subject
router.get(
  '/class/:classId/subject/:subject/yearly-summary',
  authenticateToken,
  requireTeacherOrAdmin,
  validateRequest(classAttendanceParamsSchema, 'params'),
  validateRequest(summaryQuerySchema, 'query'),
  AttendanceController.getClassYearlySummary
);

export default router;