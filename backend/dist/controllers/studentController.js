"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const studentService_1 = require("../services/studentService");
/**
 * Student controller handling all student-related HTTP requests
 */
class StudentController {
    /**
     * Create a new student
     * POST /api/students
     */
    static async createStudent(req, res) {
        try {
            const result = await studentService_1.StudentService.createStudent(req.body);
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Create student controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Get students with filtering and pagination
     * GET /api/students
     */
    static async getStudents(req, res) {
        try {
            const filters = {
                standard: req.query.standard,
                section: req.query.section,
                status: req.query.status,
                search: req.query.search
            };
            const pagination = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            const result = await studentService_1.StudentService.getStudents(filters, pagination);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Get students controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Get student by ID
     * GET /api/students/:id
     */
    static async getStudentById(req, res) {
        try {
            const { id } = req.params;
            const result = await studentService_1.StudentService.getStudentById(id);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.message === 'Student not found' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Get student by ID controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Update student by ID
     * PUT /api/students/:id
     */
    static async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const result = await studentService_1.StudentService.updateStudent(id, req.body);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.message === 'Student not found' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Update student controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Transfer student to different class
     * PUT /api/students/:id/transfer
     */
    static async transferStudent(req, res) {
        try {
            const { id } = req.params;
            const { standard, section, rollNo } = req.body;
            if (!standard || !section) {
                res.status(400).json({
                    success: false,
                    message: 'Standard and section are required for transfer'
                });
                return;
            }
            const result = await studentService_1.StudentService.transferStudent(id, standard, section, rollNo);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.message === 'Student not found' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Transfer student controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Mark student as left with leaving date
     * PUT /api/students/:id/mark-left
     */
    static async markStudentAsLeft(req, res) {
        try {
            const { id } = req.params;
            const { leavingDate } = req.body;
            const result = await studentService_1.StudentService.markStudentAsLeft(id, leavingDate);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.message === 'Student not found' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Mark student as left controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Archive student (soft delete)
     * DELETE /api/students/:id
     */
    static async archiveStudent(req, res) {
        try {
            const { id } = req.params;
            const result = await studentService_1.StudentService.archiveStudent(id);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.message === 'Student not found' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Archive student controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Get student count by class
     * GET /api/students/count/by-class
     */
    static async getStudentCountByClass(req, res) {
        try {
            const result = await studentService_1.StudentService.getStudentCountByClass();
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Get student count controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Get students by class
     * GET /api/students/class/:standard/:section
     */
    static async getStudentsByClass(req, res) {
        try {
            const { standard, section } = req.params;
            const result = await studentService_1.StudentService.getStudentsByClass(standard, section);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Get students by class controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.StudentController = StudentController;
//# sourceMappingURL=studentController.js.map