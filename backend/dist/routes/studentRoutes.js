"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentController_1 = require("../controllers/studentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = (0, express_1.Router)();
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
router.get('/count/by-class', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), studentController_1.StudentController.getStudentCountByClass);
/**
 * @route   GET /api/students/class/:standard/:section
 * @desc    Get all students in a specific class
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:standard/:section', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), studentController_1.StudentController.getStudentsByClass);
/**
 * @route   GET /api/students
 * @desc    Get students with filtering and pagination
 * @access  Private (Admin, Teacher)
 * @query   standard, section, status, search, page, limit, sortBy, sortOrder
 */
router.get('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.studentFilterSchema, 'query'), studentController_1.StudentController.getStudents);
/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Private (Admin only)
 * @body    Student data (rollNo, name, dateOfBirth, admissionDate, standard, section, parentContact)
 */
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.createStudentSchema), studentController_1.StudentController.createStudent);
/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Private (Admin, Teacher, Student/Parent - own record only)
 */
router.get('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher', 'student', 'parent']), studentController_1.StudentController.getStudentById);
/**
 * @route   PUT /api/students/:id
 * @desc    Update student details
 * @access  Private (Admin only)
 * @body    Partial student data
 */
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.updateStudentSchema), studentController_1.StudentController.updateStudent);
/**
 * @route   PUT /api/students/:id/transfer
 * @desc    Transfer student to different class
 * @access  Private (Admin only)
 * @body    { standard: string, section: string, rollNo?: string }
 */
router.put('/:id/transfer', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), studentController_1.StudentController.transferStudent);
/**
 * @route   PUT /api/students/:id/mark-left
 * @desc    Mark student as left with leaving date
 * @access  Private (Admin only)
 * @body    { leavingDate?: string }
 */
router.put('/:id/mark-left', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), studentController_1.StudentController.markStudentAsLeft);
/**
 * @route   DELETE /api/students/:id
 * @desc    Archive student (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), studentController_1.StudentController.archiveStudent);
exports.default = router;
//# sourceMappingURL=studentRoutes.js.map