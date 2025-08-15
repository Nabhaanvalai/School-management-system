import { ITeacher } from '../models/Teacher';
export interface TeacherFilters {
    subjects?: string[];
    standard?: string;
    section?: string;
    salaryStatus?: 'paid' | 'unpaid';
    search?: string;
    isActive?: boolean;
}
export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
export interface TeacherServiceResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}
/**
 * Teacher service handling all teacher-related business logic
 */
export declare class TeacherService {
    /**
     * Create a new teacher
     */
    static createTeacher(teacherData: Partial<ITeacher>): Promise<TeacherServiceResult>;
    /**
     * Get teachers with filtering and pagination
     */
    static getTeachers(filters: TeacherFilters | undefined, pagination: PaginationOptions): Promise<TeacherServiceResult>;
    /**
     * Get teacher by ID
     */
    static getTeacherById(id: string): Promise<TeacherServiceResult>;
    /**
     * Update teacher by ID
     */
    static updateTeacher(id: string, updateData: Partial<ITeacher>): Promise<TeacherServiceResult>;
    /**
     * Assign teacher to class and subject
     */
    static assignTeacherToClass(teacherId: string, standard: string, section: string, subject: string, academicYear?: string): Promise<TeacherServiceResult>;
    /**
     * Remove teacher from class assignment
     */
    static removeTeacherFromClass(teacherId: string, standard: string, section: string, subject: string): Promise<TeacherServiceResult>;
    /**
     * Get teachers by subject
     */
    static getTeachersBySubject(subject: string): Promise<TeacherServiceResult>;
    /**
     * Get teachers by class
     */
    static getTeachersByClass(standard: string, section: string): Promise<TeacherServiceResult>;
    /**
     * Get teachers with unpaid salary
     */
    static getTeachersWithUnpaidSalary(): Promise<TeacherServiceResult>;
    /**
     * Update teacher salary status
     */
    static updateSalaryStatus(id: string, status: 'paid' | 'unpaid', amount?: number, month?: string, year?: number): Promise<TeacherServiceResult>;
    /**
     * Archive teacher (soft delete)
     */
    static archiveTeacher(id: string): Promise<TeacherServiceResult>;
}
//# sourceMappingURL=teacherService.d.ts.map