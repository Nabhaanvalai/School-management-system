import express from 'express';
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  addSubjectToExam,
  removeSubjectFromExam,
  getExamsByClass,
  getUpcomingExams,
  enterMarks,
  publishResults
} from '../controllers/examController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { body, param, query, validationResult } from 'express-validator';
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
const createExamValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Exam name must be between 3 and 100 characters'),
  body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"')
    .custom((value: string) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1) {
        throw new Error('Academic year end year must be start year + 1');
      }
      if (startYear < 2000 || startYear > new Date().getFullYear() + 1) {
        throw new Error('Academic year start year must be between 2000 and next year');
      }
      return true;
    }),
  body('classId')
    .matches(/^[1-9][0-2]?-[A-F]$/)
    .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
  body('examType')
    .isIn(['unit-test', 'mid-term', 'final', 'annual'])
    .withMessage('Exam type must be one of: unit-test, mid-term, final, annual'),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array'),
  body('subjects.*.subject')
    .if(body('subjects').exists())
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject name must be between 2 and 50 characters'),
  body('subjects.*.date')
    .if(body('subjects').exists())
    .isISO8601()
    .withMessage('Subject date must be a valid date')
    .custom((value: string) => {
      if (new Date(value) < new Date()) {
        throw new Error('Exam date cannot be in the past');
      }
      return true;
    }),
  body('subjects.*.syllabus')
    .if(body('subjects').exists())
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Syllabus must be less than 1000 characters'),
  body('subjects.*.maxMarks')
    .if(body('subjects').exists())
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maximum marks must be between 1 and 1000'),
  body('subjects.*.duration')
    .if(body('subjects').exists())
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('subjects.*.startTime')
    .if(body('subjects').exists())
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('subjects.*.endTime')
    .if(body('subjects').exists())
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

const updateExamValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Exam name must be between 3 and 100 characters'),
  body('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  body('classId')
    .optional()
    .matches(/^[1-9][0-2]?-[A-F]$/)
    .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
  body('examType')
    .optional()
    .isIn(['unit-test', 'mid-term', 'final', 'annual'])
    .withMessage('Exam type must be one of: unit-test, mid-term, final, annual'),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array')
];

const addSubjectValidation = [
  body('subject')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject name must be between 2 and 50 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date')
    .custom((value: string) => {
      if (new Date(value) < new Date()) {
        throw new Error('Exam date cannot be in the past');
      }
      return true;
    }),
  body('syllabus')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Syllabus must be less than 1000 characters'),
  body('maxMarks')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maximum marks must be between 1 and 1000'),
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid exam ID')
];

const classIdValidation = [
  param('classId')
    .matches(/^[1-9][0-2]?-[A-F]$/)
    .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")')
];

const enterMarksValidation = [
  body('studentMarks')
    .isArray({ min: 1 })
    .withMessage('Student marks must be a non-empty array'),
  body('studentMarks.*.studentId')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),
  body('studentMarks.*.marks')
    .isArray({ min: 1 })
    .withMessage('Marks must be a non-empty array'),
  body('studentMarks.*.marks.*.subject')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Subject name is required'),
  body('studentMarks.*.marks.*.marksObtained')
    .isNumeric({ no_symbols: false })
    .isFloat({ min: 0 })
    .withMessage('Marks obtained must be a non-negative number'),
  body('studentMarks.*.marks.*.remarks')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Remarks must be less than 200 characters')
];

// Routes

// Create a new exam (Admin only)
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  createExamValidation,
  handleValidationErrors,
  createExam
);

// Get all exams with filtering
router.get(
  '/',
  authenticateToken,
  getExams
);

// Get upcoming exams
router.get(
  '/upcoming',
  authenticateToken,
  query('classId')
    .optional()
    .matches(/^[1-9][0-2]?-[A-F]$/)
    .withMessage('Class ID must be in format "Standard-Section" (e.g., "8-A")'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  handleValidationErrors,
  getUpcomingExams
);

// Get exams by class
router.get(
  '/class/:classId',
  authenticateToken,
  classIdValidation,
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  handleValidationErrors,
  getExamsByClass
);

// Get a specific exam by ID
router.get(
  '/:id',
  authenticateToken,
  mongoIdValidation,
  handleValidationErrors,
  getExamById
);

// Update an exam (Admin only)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  mongoIdValidation,
  updateExamValidation,
  handleValidationErrors,
  updateExam
);

// Delete an exam (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  mongoIdValidation,
  handleValidationErrors,
  deleteExam
);

// Add subject to an exam (Admin only)
router.post(
  '/:id/subjects',
  authenticateToken,
  requireRole(['admin']),
  mongoIdValidation,
  addSubjectValidation,
  handleValidationErrors,
  addSubjectToExam
);

// Remove subject from an exam (Admin only)
router.delete(
  '/:id/subjects/:subject',
  authenticateToken,
  requireRole(['admin']),
  mongoIdValidation,
  param('subject')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Subject name is required'),
  handleValidationErrors,
  removeSubjectFromExam
);

// Enter marks for students in an exam (Admin only)
router.post(
  '/:id/marks',
  authenticateToken,
  requireRole(['admin']),
  mongoIdValidation,
  enterMarksValidation,
  handleValidationErrors,
  enterMarks
);

// Publish exam results (Admin only)
router.post(
  '/:id/publish',
  authenticateToken,
  requireRole(['admin']),
  mongoIdValidation,
  handleValidationErrors,
  publishResults
);

export default router;