import { DayOfWeek } from '../models/Timetable';
export interface TimetableFilters {
    classId?: string;
    academicYear?: string;
    teacherId?: string;
    isActive?: boolean;
}
export interface TimetableServiceResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}
export interface CreateTimetableData {
    classId: string;
    academicYear?: string;
    schedule: {
        day: DayOfWeek;
        periods: {
            slot: string;
            subject: string;
            teacherId: string;
            startTime: string;
            endTime: string;
        }[];
    }[];
    createdBy: string;
}
export interface UpdateTimetableData {
    schedule?: {
        day: DayOfWeek;
        periods: {
            slot: string;
            subject: string;
            teacherId: string;
            startTime: string;
            endTime: string;
        }[];
    }[];
    isActive?: boolean;
}
/**
 * Timetable service handling all timetable-related business logic
 */
export declare class TimetableService {
    /**
     * Create a new timetable
     */
    static createTimetable(timetableData: CreateTimetableData): Promise<TimetableServiceResult>;
    /**
     * Get timetable by class ID
     */
    static getTimetableByClass(classId: string, academicYear?: string): Promise<TimetableServiceResult>;
    /**
     * Get teacher's schedule across all classes
     */
    static getTeacherSchedule(teacherId: string, academicYear?: string): Promise<TimetableServiceResult>;
    /**
     * Update timetable
     */
    static updateTimetable(timetableId: string, updateData: UpdateTimetableData, updatedBy: string): Promise<TimetableServiceResult>;
    /**
     * Get all timetables with filtering
     */
    static getTimetables(filters?: TimetableFilters): Promise<TimetableServiceResult>;
    /**
     * Delete/Deactivate timetable
     */
    static deactivateTimetable(timetableId: string): Promise<TimetableServiceResult>;
    /**
     * Get current academic year
     */
    private static getCurrentAcademicYear;
    /**
     * Check if class ID format is valid
     */
    static isValidClassId(classId: string): boolean;
    /**
     * Get available time slots for a class
     */
    static getAvailableSlots(classId: string, day: DayOfWeek, academicYear?: string): Promise<TimetableServiceResult>;
}
//# sourceMappingURL=timetableService.d.ts.map