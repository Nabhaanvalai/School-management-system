import { Request, Response } from 'express';
/**
 * Student controller handling all student-related HTTP requests
 */
export declare class StudentController {
    /**
     * Create a new student
     * POST /api/students
     */
    static createStudent(req: Request, res: Response): Promise<void>;
    /**
     * Get students with filtering and pagination
     * GET /api/students
     */
    static getStudents(req: Request, res: Response): Promise<void>;
    /**
     * Get student by ID
     * GET /api/students/:id
     */
    static getStudentById(req: Request, res: Response): Promise<void>;
    /**
     * Update student by ID
     * PUT /api/students/:id
     */
    static updateStudent(req: Request, res: Response): Promise<void>;
    /**
     * Transfer student to different class
     * PUT /api/students/:id/transfer
     */
    static transferStudent(req: Request, res: Response): Promise<void>;
    /**
     * Mark student as left with leaving date
     * PUT /api/students/:id/mark-left
     */
    static markStudentAsLeft(req: Request, res: Response): Promise<void>;
    /**
     * Archive student (soft delete)
     * DELETE /api/students/:id
     */
    static archiveStudent(req: Request, res: Response): Promise<void>;
    /**
     * Get student count by class
     * GET /api/students/count/by-class
     */
    static getStudentCountByClass(req: Request, res: Response): Promise<void>;
    /**
     * Get students by class
     * GET /api/students/class/:standard/:section
     */
    static getStudentsByClass(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=studentController.d.ts.map