import { Request, Response } from 'express';
/**
 * Timetable controller handling all timetable-related HTTP requests
 */
export declare class TimetableController {
    /**
     * Create a new timetable
     * POST /api/timetable
     */
    static createTimetable(req: Request, res: Response): Promise<void>;
    /**
     * Get timetable by class ID
     * GET /api/timetable/class/:classId
     */
    static getTimetableByClass(req: Request, res: Response): Promise<void>;
    /**
     * Get teacher's schedule
     * GET /api/timetable/teacher/:teacherId
     */
    static getTeacherSchedule(req: Request, res: Response): Promise<void>;
    /**
     * Get all timetables with filtering
     * GET /api/timetable
     */
    static getTimetables(req: Request, res: Response): Promise<void>;
    /**
     * Update timetable
     * PUT /api/timetable/:id
     */
    static updateTimetable(req: Request, res: Response): Promise<void>;
    /**
     * Deactivate timetable
     * DELETE /api/timetable/:id
     */
    static deactivateTimetable(req: Request, res: Response): Promise<void>;
    /**
     * Get available time slots for a class
     * GET /api/timetable/class/:classId/available-slots/:day
     */
    static getAvailableSlots(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=timetableController.d.ts.map