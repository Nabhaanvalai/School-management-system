import { Router } from 'express';
import { TimetableController } from '../controllers/timetableController';
import { authenticateToken, requireRole, validateRequest } from '../middleware/authMiddleware';
import { createTimetableSchema } from '../middleware/validationSchemas';

const router = Router();

/**
 * Timetable Management Routes
 * Base path: /api/timetable
 * All routes require authentication
 */

/**
 * @route   GET /api/timetable/class/:classId/available-slots/:day
 * @desc    Get available time slots for a class on a specific day
 * @access  Private (Admin, Teacher)
 * @params  classId (e.g., "8-A"), day (monday-friday)
 * @query   academicYear (optional)
 */
router.get(
  '/class/:classId/available-slots/:day',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  TimetableController.getAvailableSlots
);

/**
 * @route   GET /api/timetable/class/:classId
 * @desc    Get timetable for a specific class
 * @access  Private (Admin, Teacher, Student/Parent - for their class only)
 * @params  classId (e.g., "8-A")
 * @query   academicYear (optional)
 */
router.get(
  '/class/:classId',
  authenticateToken,
  requireRole(['admin', 'teacher', 'student', 'parent']),
  TimetableController.getTimetableByClass
);

/**
 * @route   GET /api/timetable/teacher/:teacherId
 * @desc    Get teacher's schedule across all classes
 * @access  Private (Admin, Teacher - own schedule only)
 * @params  teacherId
 * @query   academicYear (optional)
 */
router.get(
  '/teacher/:teacherId',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  TimetableController.getTeacherSchedule
);

/**
 * @route   GET /api/timetable
 * @desc    Get all timetables with filtering options
 * @access  Private (Admin, Teacher)
 * @query   classId, academicYear, teacherId, isActive
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  TimetableController.getTimetables
);

/**
 * @route   POST /api/timetable
 * @desc    Create a new timetable for a class
 * @access  Private (Admin only)
 * @body    { classId, academicYear, schedule }
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(createTimetableSchema),
  TimetableController.createTimetable
);

/**
 * @route   PUT /api/timetable/:id
 * @desc    Update an existing timetable
 * @access  Private (Admin only)
 * @params  id (timetable ID)
 * @body    { schedule, isActive }
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  TimetableController.updateTimetable
);

/**
 * @route   DELETE /api/timetable/:id
 * @desc    Deactivate a timetable (soft delete)
 * @access  Private (Admin only)
 * @params  id (timetable ID)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  TimetableController.deactivateTimetable
);

export default router;