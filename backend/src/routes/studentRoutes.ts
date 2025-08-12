import { Router } from 'express';
import { StudentController } from '../controllers/studentController';
import { authenticateToken, requireRole, validateRequest } from '../middleware/authMiddleware';
import { createStudentSchema, updateStudentSchema, studentFilterSchema } from '../middleware/validationSchemas';

const router = Router();

/**
 * Student Management Routes
 * Base path: /api/students
 * All routes require authentication
 */

/**
 * @route   GET /api/students/count/by-class
 * @desc    Get student count aggregated by class
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/count/by-class',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  StudentController.getStudentCountByClass
);

/**
 * @route   GET /api/students/class/:standard/:section
 * @desc    Get all students in a specific class
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/class/:standard/:section',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  StudentController.getStudentsByClass
);

/**
 * @route   GET /api/students
 * @desc    Get students with filtering and pagination
 * @access  Private (Admin, Teacher)
 * @query   standard, section, status, search, page, limit, sortBy, sortOrder
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  validateRequest(studentFilterSchema, 'query'),
  StudentController.getStudents
);

/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Private (Admin only)
 * @body    Student data (rollNo, name, dateOfBirth, admissionDate, standard, section, parentContact)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(createStudentSchema),
  StudentController.createStudent
);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Private (Admin, Teacher, Student/Parent - own record only)
 */
router.get(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'teacher', 'student', 'parent']),
  StudentController.getStudentById
);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student details
 * @access  Private (Admin only)
 * @body    Partial student data
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(updateStudentSchema),
  StudentController.updateStudent
);

/**
 * @route   PUT /api/students/:id/transfer
 * @desc    Transfer student to different class
 * @access  Private (Admin only)
 * @body    { standard: string, section: string, rollNo?: string }
 */
router.put(
  '/:id/transfer',
  authenticateToken,
  requireRole(['admin']),
  StudentController.transferStudent
);

/**
 * @route   DELETE /api/students/:id
 * @desc    Archive student (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  StudentController.archiveStudent
);

export default router;