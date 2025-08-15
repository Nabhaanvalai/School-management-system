"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableController = void 0;
const timetableService_1 = require("../services/timetableService");
/**
 * Timetable controller handling all timetable-related HTTP requests
 */
class TimetableController {
    /**
     * Create a new timetable
     * POST /api/timetable
     */
    static async createTimetable(req, res) {
        try {
            const timetableData = {
                ...req.body,
                createdBy: req.user?.id
            };
            const result = await timetableService_1.TimetableService.createTimetable(timetableData);
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.error === 'TIMETABLE_EXISTS' ? 409 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Create timetable controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Get timetable by class ID
     * GET /api/timetable/class/:classId
     */
    static async getTimetableByClass(req, res) {
        try {
            const { classId } = req.params;
            const academicYear = req.query.academicYear;
            // Validate class ID format
            if (!timetableService_1.TimetableService.isValidClassId(classId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid class ID format. Expected format: "Standard-Section" (e.g., "8-A")'
                });
                return;
            }
            const result = await timetableService_1.TimetableService.getTimetableByClass(classId, academicYear);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Get timetable by class controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Get teacher's schedule
     * GET /api/timetable/teacher/:teacherId
     */
    static async getTeacherSchedule(req, res) {
        try {
            const { teacherId } = req.params;
            const academicYear = req.query.academicYear;
            const result = await timetableService_1.TimetableService.getTeacherSchedule(teacherId, academicYear);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.error === 'TEACHER_NOT_FOUND' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Get teacher schedule controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Get all timetables with filtering
     * GET /api/timetable
     */
    static async getTimetables(req, res) {
        try {
            const filters = {
                classId: req.query.classId,
                academicYear: req.query.academicYear,
                teacherId: req.query.teacherId,
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
            };
            const result = await timetableService_1.TimetableService.getTimetables(filters);
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
            console.error('Get timetables controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Update timetable
     * PUT /api/timetable/:id
     */
    static async updateTimetable(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedBy = req.user?.id || '';
            const result = await timetableService_1.TimetableService.updateTimetable(id, updateData, updatedBy);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Update timetable controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Deactivate timetable
     * DELETE /api/timetable/:id
     */
    static async deactivateTimetable(req, res) {
        try {
            const { id } = req.params;
            const result = await timetableService_1.TimetableService.deactivateTimetable(id);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            }
            else {
                const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        }
        catch (error) {
            console.error('Deactivate timetable controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    /**
     * Get available time slots for a class
     * GET /api/timetable/class/:classId/available-slots/:day
     */
    static async getAvailableSlots(req, res) {
        try {
            const { classId, day } = req.params;
            const academicYear = req.query.academicYear;
            // Validate class ID format
            if (!timetableService_1.TimetableService.isValidClassId(classId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid class ID format. Expected format: "Standard-Section" (e.g., "8-A")'
                });
                return;
            }
            // Validate day
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            if (!validDays.includes(day.toLowerCase())) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday'
                });
                return;
            }
            const result = await timetableService_1.TimetableService.getAvailableSlots(classId, day.toLowerCase(), academicYear);
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
            console.error('Get available slots controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.TimetableController = TimetableController;
//# sourceMappingURL=timetableController.js.map