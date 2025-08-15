"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacherController_1 = require("../controllers/teacherController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = (0, express_1.Router)();
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
router.get('/salary/unpaid', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), teacherController_1.TeacherController.getTeachersWithUnpaidSalary);
/**
 * @route   GET /api/teachers/subject/:subject
 * @desc    Get teachers by subject
 * @access  Private (Admin, Teacher)
 */
router.get('/subject/:subject', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), teacherController_1.TeacherController.getTeachersBySubject);
/**
 * @route   GET /api/teachers/class/:standard/:section
 * @desc    Get teachers assigned to a specific class
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:standard/:section', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), teacherController_1.TeacherController.getTeachersByClass);
/**
 * @route   GET /api/teachers
 * @desc    Get teachers with filtering and pagination
 * @access  Private (Admin, Teacher)
 * @query   subjects, standard, section, salaryStatus, isActive, search, page, limit, sortBy, sortOrder
 */
router.get('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.teacherFilterSchema, 'query'), teacherController_1.TeacherController.getTeachers);
/**
 * @route   POST /api/teachers
 * @desc    Create a new teacher
 * @access  Private (Admin only)
 * @body    Teacher data (employeeId, name, subjects, phone, email, address, dateOfJoining, salary)
 */
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.createTeacherSchema), teacherController_1.TeacherController.createTeacher);
/**
 * @route   GET /api/teachers/:id
 * @desc    Get teacher by ID
 * @access  Private (Admin, Teacher - own record only)
 */
router.get('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), teacherController_1.TeacherController.getTeacherById);
/**
 * @route   PUT /api/teachers/:id
 * @desc    Update teacher details
 * @access  Private (Admin only)
 * @body    Partial teacher data
 */
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.updateTeacherSchema), teacherController_1.TeacherController.updateTeacher);
/**
 * @route   POST /api/teachers/:id/assignments
 * @desc    Assign teacher to class and subject
 * @access  Private (Admin only)
 * @body    { standard: string, section: string, subject: string, academicYear?: string }
 */
router.post('/:id/assignments', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.teacherAssignmentSchema), teacherController_1.TeacherController.assignTeacherToClass);
/**
 * @route   DELETE /api/teachers/:id/assignments
 * @desc    Remove teacher from class assignment
 * @access  Private (Admin only)
 * @body    { standard: string, section: string, subject: string }
 */
router.delete('/:id/assignments', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.teacherAssignmentSchema), teacherController_1.TeacherController.removeTeacherFromClass);
/**
 * @route   PUT /api/teachers/:id/salary
 * @desc    Update teacher salary status
 * @access  Private (Admin only)
 * @body    { status: 'paid' | 'unpaid', amount?: number, month?: string, year?: number }
 */
router.put('/:id/salary', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.salaryUpdateSchema), teacherController_1.TeacherController.updateSalaryStatus);
/**
 * @route   DELETE /api/teachers/:id
 * @desc    Archive teacher (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), teacherController_1.TeacherController.archiveTeacher);
exports.default = router;
//# sourceMappingURL=teacherRoutes.js.map