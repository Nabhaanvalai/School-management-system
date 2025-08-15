"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timetableController_1 = require("../controllers/timetableController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = (0, express_1.Router)();
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
router.get('/class/:classId/available-slots/:day', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), timetableController_1.TimetableController.getAvailableSlots);
/**
 * @route   GET /api/timetable/class/:classId
 * @desc    Get timetable for a specific class
 * @access  Private (Admin, Teacher, Student/Parent - for their class only)
 * @params  classId (e.g., "8-A")
 * @query   academicYear (optional)
 */
router.get('/class/:classId', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher', 'student', 'parent']), timetableController_1.TimetableController.getTimetableByClass);
/**
 * @route   GET /api/timetable/teacher/:teacherId
 * @desc    Get teacher's schedule across all classes
 * @access  Private (Admin, Teacher - own schedule only)
 * @params  teacherId
 * @query   academicYear (optional)
 */
router.get('/teacher/:teacherId', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), timetableController_1.TimetableController.getTeacherSchedule);
/**
 * @route   GET /api/timetable
 * @desc    Get all timetables with filtering options
 * @access  Private (Admin, Teacher)
 * @query   classId, academicYear, teacherId, isActive
 */
router.get('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin', 'teacher']), timetableController_1.TimetableController.getTimetables);
/**
 * @route   POST /api/timetable
 * @desc    Create a new timetable for a class
 * @access  Private (Admin only)
 * @body    { classId, academicYear, schedule }
 */
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, authMiddleware_1.validateRequest)(validationSchemas_1.createTimetableSchema), timetableController_1.TimetableController.createTimetable);
/**
 * @route   PUT /api/timetable/:id
 * @desc    Update an existing timetable
 * @access  Private (Admin only)
 * @params  id (timetable ID)
 * @body    { schedule, isActive }
 */
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), timetableController_1.TimetableController.updateTimetable);
/**
 * @route   DELETE /api/timetable/:id
 * @desc    Deactivate a timetable (soft delete)
 * @access  Private (Admin only)
 * @params  id (timetable ID)
 */
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), timetableController_1.TimetableController.deactivateTimetable);
exports.default = router;
//# sourceMappingURL=timetableRoutes.js.map