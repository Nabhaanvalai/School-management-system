import { Request, Response } from 'express';
export declare class AttendanceController {
    /**
     * Mark attendance for a student
     * POST /api/attendance/mark
     */
    static markAttendance(req: Request, res: Response): Promise<void>;
    /**
     * Update existing attendance record
     * PUT /api/attendance/:id
     */
    static updateAttendance(req: Request, res: Response): Promise<void>;
    /**
     * Get attendance records for a specific student
     * GET /api/attendance/student/:id
     */
    static getStudentAttendance(req: Request, res: Response): Promise<void>;
    /**
     * Get attendance records for a specific class and subject
     * GET /api/attendance/class/:classId/subject/:subject
     */
    static getClassAttendance(req: Request, res: Response): Promise<void>;
    /**
     * Get attendance percentage for a student
     * GET /api/attendance/student/:id/percentage
     */
    static getStudentAttendancePercentage(req: Request, res: Response): Promise<void>;
    /**
     * Get attendance summary for a class and subject
     * GET /api/attendance/class/:classId/subject/:subject/summary
     */
    static getClassAttendanceSummary(req: Request, res: Response): Promise<void>;
    /**
     * Get attendance records marked by the current teacher
     * GET /api/attendance/teacher/my-records
     */
    static getMyAttendanceRecords(req: Request, res: Response): Promise<void>;
    /**
     * Get attendance records marked by a specific teacher (admin only)
     * GET /api/attendance/teacher/:teacherId/records
     */
    static getTeacherAttendanceRecords(req: Request, res: Response): Promise<void>;
    /**
     * Get monthly attendance summary for a student
     * GET /api/attendance/student/:id/monthly-summary
     */
    static getStudentMonthlySummary(req: Request, res: Response): Promise<void>;
    /**
     * Get yearly attendance summary for a student
     * GET /api/attendance/student/:id/yearly-summary
     */
    static getStudentYearlySummary(req: Request, res: Response): Promise<void>;
    /**
     * Get monthly attendance summary for a class and subject
     * GET /api/attendance/class/:classId/subject/:subject/monthly-summary
     */
    static getClassMonthlySummary(req: Request, res: Response): Promise<void>;
    /**
     * Get yearly attendance summary for a class and subject
     * GET /api/attendance/class/:classId/subject/:subject/yearly-summary
     */
    static getClassYearlySummary(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=attendanceController.d.ts.map