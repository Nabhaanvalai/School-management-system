import { IAttendance, AttendanceStatus } from '../models/Attendance';
import mongoose from 'mongoose';
export interface MarkAttendanceRequest {
    studentId: string;
    teacherId: string;
    classId: string;
    subject: string;
    date: Date;
    status: AttendanceStatus;
    academicYear: string;
    remarks?: string;
}
export interface AttendanceValidationResult {
    isValid: boolean;
    message?: string;
}
export declare class AttendanceService {
    /**
     * Validate if teacher is authorized to mark attendance for the given class and subject
     */
    static validateTeacherAuthorization(teacherId: string, classId: string, subject: string, academicYear?: string): Promise<AttendanceValidationResult>;
    /**
     * Validate if student exists and belongs to the specified class
     */
    static validateStudentClass(studentId: string, classId: string): Promise<AttendanceValidationResult>;
    /**
     * Mark attendance for a student
     */
    static markAttendance(attendanceData: MarkAttendanceRequest): Promise<IAttendance>;
    /**
     * Update existing attendance record
     */
    static updateAttendance(attendanceId: string, teacherId: string, updates: Partial<Pick<IAttendance, 'status' | 'remarks'>>): Promise<IAttendance>;
    /**
     * Get attendance records for a specific student
     */
    static getStudentAttendance(studentId: string, options?: {
        subject?: string;
        startDate?: Date;
        endDate?: Date;
        academicYear?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        records: (mongoose.Document<unknown, {}, IAttendance, {}, {}> & IAttendance & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get attendance records for a specific class and subject
     */
    static getClassAttendance(classId: string, subject: string, options?: {
        date?: Date;
        startDate?: Date;
        endDate?: Date;
        academicYear?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        records: (mongoose.Document<unknown, {}, IAttendance, {}, {}> & IAttendance & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Calculate attendance percentage for a student
     */
    static calculateAttendancePercentage(studentId: string, options?: {
        subject?: string;
        academicYear?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        totalDays: number;
        presentDays: number;
        absentDays: number;
        percentage: number;
    }>;
    /**
     * Get attendance summary for a class and subject
     */
    static getClassAttendanceSummary(classId: string, subject: string, startDate: Date, endDate: Date, academicYear?: string): Promise<{
        counts: {
            present: number;
            absent: number;
            late: number;
            total: number;
        };
        percentages: {
            present: number;
            absent: number;
            late: number;
        };
        dateRange: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    /**
     * Get attendance records marked by a specific teacher
     */
    static getTeacherAttendanceRecords(teacherId: string, options?: {
        classId?: string;
        subject?: string;
        startDate?: Date;
        endDate?: Date;
        academicYear?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        records: (mongoose.Document<unknown, {}, IAttendance, {}, {}> & IAttendance & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get monthly attendance summary for a student
     */
    static getStudentMonthlySummary(studentId: string, startDate: Date, endDate: Date, academicYear?: string): Promise<{
        dateRange: {
            startDate: Date;
            endDate: Date;
        };
        monthlyData: any;
    }>;
    /**
     * Get yearly attendance summary for a student
     */
    static getStudentYearlySummary(studentId: string, startDate: Date, endDate: Date, academicYear?: string): Promise<{
        dateRange: {
            startDate: Date;
            endDate: Date;
        };
        yearlyData: any;
    }>;
    /**
     * Get monthly attendance summary for a class and subject
     */
    static getClassMonthlySummary(classId: string, subject: string, startDate: Date, endDate: Date, academicYear?: string): Promise<{
        classId: string;
        subject: string;
        dateRange: {
            startDate: Date;
            endDate: Date;
        };
        monthlyData: any[];
    }>;
    /**
     * Get yearly attendance summary for a class and subject
     */
    static getClassYearlySummary(classId: string, subject: string, startDate: Date, endDate: Date, academicYear?: string): Promise<{
        classId: string;
        subject: string;
        dateRange: {
            startDate: Date;
            endDate: Date;
        };
        yearlyData: any[];
    }>;
}
//# sourceMappingURL=attendanceService.d.ts.map