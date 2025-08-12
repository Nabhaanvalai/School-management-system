import { Router } from 'express';
import { TeacherController } from '../controllers/teacherController';
import { authenticateToken, requireRole, validateRequest } from '../middleware/authMiddleware';
import { 
  createTeacherSchema, 
  updateTeacherSchema, 
  teacherFilterSchema,
  teacherAssignmentSchema,
  salaryUpdateSchema 
} from '../middleware/validationSchemas';

const router = Router();

/**
 * Teacher Management Routes
 * Base path: /api/teachers
 * All routes require authentication
 */

/**
 * @route   GET /api/teachers/salary/unpaid
 * @desc    Get teachers with unpaid salary
 * @access  Private (Admin only)
 */
router.get(
  '/salary/unpaid',
  authenticateToken,
  requireRole(['admin']),
  TeacherController.getTeachersWithUnpaidSalary
);

/**
 * @route   GET /api/teachers/subject/:subject
 * @desc    Get teachers by subject
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/subject/:subject',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  TeacherController.getTeachersBySubject
);

/**
 * @route   GET /api/teachers/class/:standard/:section
 * @desc    Get teachers assigned to a specific class
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/class/:standard/:section',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  TeacherController.getTeachersByClass
);

/**
 * @route   GET /api/teachers
 * @desc    Get teachers with filtering and pagination
 * @access  Private (Admin, Teacher)
 * @query   subjects, standard, section, salaryStatus, isActive, search, page, limit, sortBy, sortOrder
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  validateRequest(teacherFilterSchema, 'query'),
  TeacherController.getTeachers
);

/**
 * @route   POST /api/teachers
 * @desc    Create a new teacher
 * @access  Private (Admin only)
 * @body    Teacher data (employeeId, name, subjects, phone, email, address, dateOfJoining, salary)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(createTeacherSchema),
  TeacherController.createTeacher
);

/**
 * @route   GET /api/teachers/:id
 * @desc    Get teacher by ID
 * @access  Private (Admin, Teacher - own record only)
 */
router.get(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  TeacherController.getTeacherById
);

/**
 * @route   PUT /api/teachers/:id
 * @desc    Update teacher details
 * @access  Private (Admin only)
 * @body    Partial teacher data
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(updateTeacherSchema),
  TeacherController.updateTeacher
);

/**
 * @route   POST /api/teachers/:id/assignments
 * @desc    Assign teacher to class and subject
 * @access  Private (Admin only)
 * @body    { standard: string, section: string, subject: string, academicYear?: string }
 */
router.post(
  '/:id/assignments',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(teacherAssignmentSchema),
  TeacherController.assignTeacherToClass
);

/**
 * @route   DELETE /api/teachers/:id/assignments
 * @desc    Remove teacher from class assignment
 * @access  Private (Admin only)
 * @body    { standard: string, section: string, subject: string }
 */
router.delete(
  '/:id/assignments',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(teacherAssignmentSchema),
  TeacherController.removeTeacherFromClass
);

/**
 * @route   PUT /api/teachers/:id/salary
 * @desc    Update teacher salary status
 * @access  Private (Admin only)
 * @body    { status: 'paid' | 'unpaid', amount?: number, month?: string, year?: number }
 */
router.put(
  '/:id/salary',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(salaryUpdateSchema),
  TeacherController.updateSalaryStatus
);

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Archive teacher (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  TeacherController.archiveTeacher
);

export default router;