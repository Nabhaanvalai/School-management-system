import { IStudent } from '../models/Student';
export interface StudentFilters {
    standard?: string;
    section?: string;
    status?: 'active' | 'left';
    search?: string;
}
export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
export interface StudentServiceResult {
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
 * Student service handling all student-related business logic
 */
export declare class StudentService {
    /**
     * Create a new student
     */
    static createStudent(studentData: Partial<IStudent>): Promise<StudentServiceResult>;
    /**
     * Get students with filtering and pagination
     */
    static getStudents(filters: StudentFilters | undefined, pagination: PaginationOptions): Promise<StudentServiceResult>;
    /**
     * Get student by ID
     */
    static getStudentById(id: string): Promise<StudentServiceResult>;
    /**
     * Update student by ID
     */
    static updateStudent(id: string, updateData: Partial<IStudent>): Promise<StudentServiceResult>;
    /**
     * Transfer student to different standard/section
     */
    static transferStudent(id: string, newStandard: string, newSection: string, newRollNo?: string): Promise<StudentServiceResult>;
    /**
     * Mark student as left with specific leaving date
     */
    static markStudentAsLeft(id: string, leavingDate?: string): Promise<StudentServiceResult>;
    /**
     * Archive student (soft delete)
     */
    static archiveStudent(id: string): Promise<StudentServiceResult>;
    /**
     * Get student count by class with detailed statistics
     */
    static getStudentCountByClass(): Promise<StudentServiceResult>;
    /**
     * Get students by class
     */
    static getStudentsByClass(standard: string, section: string): Promise<StudentServiceResult>;
}
//# sourceMappingURL=studentService.d.ts.map