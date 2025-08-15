"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const attendanceService_1 = require("../services/attendanceService");
class AttendanceController {
    /**
     * Mark attendance for a student
     * POST /api/attendance/mark
     */
    static async markAttendance(req, res) {
        try {
            const { studentId, classId, subject, date, status, academicYear, remarks } = req.body;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Only teachers and admins can mark attendance
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Only teachers and admins can mark attendance'
                });
                return;
            }
            const attendanceData = {
                studentId,
                teacherId: req.user.id,
                classId,
                subject,
                date: new Date(date),
                status: status,
                academicYear,
                remarks
            };
            const attendance = await attendanceService_1.AttendanceService.markAttendance(attendanceData);
            res.status(201).json({
                success: true,
                message: 'Attendance marked successfully',
                data: attendance
            });
        }
        catch (error) {
            console.error('Error marking attendance:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to mark attendance'
            });
        }
    }
    /**
     * Update existing attendance record
     * PUT /api/attendance/:id
     */
    static async updateAttendance(req, res) {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Only teachers and admins can update attendance
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Only teachers and admins can update attendance'
                });
                return;
            }
            const updates = {};
            if (status)
                updates.status = status;
            if (remarks !== undefined)
                updates.remarks = remarks;
            const attendance = await attendanceService_1.AttendanceService.updateAttendance(id, req.user.id, updates);
            res.json({
                success: true,
                message: 'Attendance updated successfully',
                data: attendance
            });
        }
        catch (error) {
            console.error('Error updating attendance:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update attendance'
            });
        }
    }
    /**
     * Get attendance records for a specific student
     * GET /api/attendance/student/:id
     */
    static async getStudentAttendance(req, res) {
        try {
            const { id } = req.params;
            const { subject, startDate, endDate, academicYear, page = '1', limit = '10' } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Students can only view their own attendance, teachers and admins can view any
            if (req.user.role === 'student' && req.user.id !== id) {
                res.status(403).json({
                    success: false,
                    message: 'Students can only view their own attendance'
                });
                return;
            }
            const options = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            if (subject)
                options.subject = subject;
            if (startDate)
                options.startDate = new Date(startDate);
            if (endDate)
                options.endDate = new Date(endDate);
            if (academicYear)
                options.academicYear = academicYear;
            const result = await attendanceService_1.AttendanceService.getStudentAttendance(id, options);
            res.json({
                success: true,
                message: 'Student attendance retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting student attendance:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve student attendance'
            });
        }
    }
    /**
     * Get attendance records for a specific class and subject
     * GET /api/attendance/class/:classId/subject/:subject
     */
    static async getClassAttendance(req, res) {
        try {
            const { classId, subject } = req.params;
            const { date, startDate, endDate, academicYear, page = '1', limit = '50' } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Only teachers and admins can view class attendance
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Only teachers and admins can view class attendance'
                });
                return;
            }
            const options = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            if (date)
                options.date = new Date(date);
            if (startDate)
                options.startDate = new Date(startDate);
            if (endDate)
                options.endDate = new Date(endDate);
            if (academicYear)
                options.academicYear = academicYear;
            const result = await attendanceService_1.AttendanceService.getClassAttendance(classId, subject, options);
            res.json({
                success: true,
                message: 'Class attendance retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting class attendance:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve class attendance'
            });
        }
    }
    /**
     * Get attendance percentage for a student
     * GET /api/attendance/student/:id/percentage
     */
    static async getStudentAttendancePercentage(req, res) {
        try {
            const { id } = req.params;
            const { subject, academicYear, startDate, endDate } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Students can only view their own attendance, teachers and admins can view any
            if (req.user.role === 'student' && req.user.id !== id) {
                res.status(403).json({
                    success: false,
                    message: 'Students can only view their own attendance'
                });
                return;
            }
            const options = {};
            if (subject)
                options.subject = subject;
            if (academicYear)
                options.academicYear = academicYear;
            if (startDate)
                options.startDate = new Date(startDate);
            if (endDate)
                options.endDate = new Date(endDate);
            const result = await attendanceService_1.AttendanceService.calculateAttendancePercentage(id, options);
            res.json({
                success: true,
                message: 'Attendance percentage calculated successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error calculating attendance percentage:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to calculate attendance percentage'
            });
        }
    }
    /**
     * Get attendance summary for a class and subject
     * GET /api/attendance/class/:classId/subject/:subject/summary
     */
    static async getClassAttendanceSummary(req, res) {
        try {
            const { classId, subject } = req.params;
            const { startDate, endDate, academicYear } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Only teachers and admins can view class attendance summary
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Only teachers and admins can view class attendance summary'
                });
                return;
            }
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required for summary'
                });
                return;
            }
            const result = await attendanceService_1.AttendanceService.getClassAttendanceSummary(classId, subject, new Date(startDate), new Date(endDate), academicYear);
            res.json({
                success: true,
                message: 'Class attendance summary retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting class attendance summary:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve class attendance summary'
            });
        }
    }
    /**
     * Get attendance records marked by the current teacher
     * GET /api/attendance/teacher/my-records
     */
    static async getMyAttendanceRecords(req, res) {
        try {
            const { classId, subject, startDate, endDate, academicYear, page = '1', limit = '20' } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Only teachers can view their own attendance records
            if (req.user.role !== 'teacher') {
                res.status(403).json({
                    success: false,
                    message: 'Only teachers can view their attendance records'
                });
                return;
            }
            const options = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            if (classId)
                options.classId = classId;
            if (subject)
                options.subject = subject;
            if (startDate)
                options.startDate = new Date(startDate);
            if (endDate)
                options.endDate = new Date(endDate);
            if (academicYear)
                options.academicYear = academicYear;
            const result = await attendanceService_1.AttendanceService.getTeacherAttendanceRecords(req.user.id, options);
            res.json({
                success: true,
                message: 'Teacher attendance records retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting teacher attendance records:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve teacher attendance records'
            });
        }
    }
    /**
     * Get attendance records marked by a specific teacher (admin only)
     * GET /api/attendance/teacher/:teacherId/records
     */
    static async getTeacherAttendanceRecords(req, res) {
        try {
            const { teacherId } = req.params;
            const { classId, subject, startDate, endDate, academicYear, page = '1', limit = '20' } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Only admins can view any teacher's attendance records
            if (req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Only admins can view teacher attendance records'
                });
                return;
            }
            const options = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            if (classId)
                options.classId = classId;
            if (subject)
                options.subject = subject;
            if (startDate)
                options.startDate = new Date(startDate);
            if (endDate)
                options.endDate = new Date(endDate);
            if (academicYear)
                options.academicYear = academicYear;
            const result = await attendanceService_1.AttendanceService.getTeacherAttendanceRecords(teacherId, options);
            res.json({
                success: true,
                message: 'Teacher attendance records retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting teacher attendance records:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve teacher attendance records'
            });
        }
    }
    /**
     * Get monthly attendance summary for a student
     * GET /api/attendance/student/:id/monthly-summary
     */
    static async getStudentMonthlySummary(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate, academicYear } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Students can only view their own attendance, teachers and admins can view any
            if (req.user.role === 'student' && req.user.id !== id) {
                res.status(403).json({
                    success: false,
                    message: 'Students can only view their own attendance'
                });
                return;
            }
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required for monthly summary'
                });
                return;
            }
            const result = await attendanceService_1.AttendanceService.getStudentMonthlySummary(id, new Date(startDate), new Date(endDate), academicYear);
            res.json({
                success: true,
                message: 'Student monthly attendance summary retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting student monthly summary:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve student monthly summary'
            });
        }
    }
    /**
     * Get yearly attendance summary for a student
     * GET /api/attendance/student/:id/yearly-summary
     */
    static async getStudentYearlySummary(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate, academicYear } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Students can only view their own attendance, teachers and admins can view any
            if (req.user.role === 'student' && req.user.id !== id) {
                res.status(403).json({
                    success: false,
                    message: 'Students can only view their own attendance'
                });
                return;
            }
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required for yearly summary'
                });
                return;
            }
            const result = await attendanceService_1.AttendanceService.getStudentYearlySummary(id, new Date(startDate), new Date(endDate), academicYear);
            res.json({
                success: true,
                message: 'Student yearly attendance summary retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting student yearly summary:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve student yearly summary'
            });
        }
    }
    /**
     * Get monthly attendance summary for a class and subject
     * GET /api/attendance/class/:classId/subject/:subject/monthly-summary
     */
    static async getClassMonthlySummary(req, res) {
        try {
            const { classId, subject } = req.params;
            const { startDate, endDate, academicYear } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Only teachers and admins can view class attendance summary
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Only teachers and admins can view class attendance summary'
                });
                return;
            }
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required for monthly summary'
                });
                return;
            }
            const result = await attendanceService_1.AttendanceService.getClassMonthlySummary(classId, subject, new Date(startDate), new Date(endDate), academicYear);
            res.json({
                success: true,
                message: 'Class monthly attendance summary retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting class monthly summary:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve class monthly summary'
            });
        }
    }
    /**
     * Get yearly attendance summary for a class and subject
     * GET /api/attendance/class/:classId/subject/:subject/yearly-summary
     */
    static async getClassYearlySummary(req, res) {
        try {
            const { classId, subject } = req.params;
            const { startDate, endDate, academicYear } = req.query;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Only teachers and admins can view class attendance summary
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Only teachers and admins can view class attendance summary'
                });
                return;
            }
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required for yearly summary'
                });
                return;
            }
            const result = await attendanceService_1.AttendanceService.getClassYearlySummary(classId, subject, new Date(startDate), new Date(endDate), academicYear);
            res.json({
                success: true,
                message: 'Class yearly attendance summary retrieved successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error getting class yearly summary:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve class yearly summary'
            });
        }
    }
}
exports.AttendanceController = AttendanceController;
//# sourceMappingURL=attendanceController.js.map