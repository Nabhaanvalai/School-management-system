import { Request, Response } from 'express';
/**
 * Teacher controller handling all teacher-related HTTP requests
 */
export declare class TeacherController {
    /**
     * Create a new teacher
     * POST /api/teachers
     */
    static createTeacher(req: Request, res: Response): Promise<void>;
    /**
     * Get teachers with filtering and pagination
     * GET /api/teachers
     */
    static getTeachers(req: Request, res: Response): Promise<void>;
    /**
     * Get teacher by ID
     * GET /api/teachers/:id
     */
    static getTeacherById(req: Request, res: Response): Promise<void>;
    /**
     * Update teacher by ID
     * PUT /api/teachers/:id
     */
    static updateTeacher(req: Request, res: Response): Promise<void>;
    /**
     * Assign teacher to class and subject
     * POST /api/teachers/:id/assignments
     */
    static assignTeacherToClass(req: Request, res: Response): Promise<void>;
    /**
     * Remove teacher from class assignment
     * DELETE /api/teachers/:id/assignments
     */
    static removeTeacherFromClass(req: Request, res: Response): Promise<void>;
    /**
     * Get teachers by subject
     * GET /api/teachers/subject/:subject
     */
    static getTeachersBySubject(req: Request, res: Response): Promise<void>;
    /**
     * Get teachers by class
     * GET /api/teachers/class/:standard/:section
     */
    static getTeachersByClass(req: Request, res: Response): Promise<void>;
    /**
     * Get teachers with unpaid salary
     * GET /api/teachers/salary/unpaid
     */
    static getTeachersWithUnpaidSalary(req: Request, res: Response): Promise<void>;
    /**
     * Update teacher salary status
     * PUT /api/teachers/:id/salary
     */
    static updateSalaryStatus(req: Request, res: Response): Promise<void>;
    /**
     * Archive teacher (soft delete)
     * DELETE /api/teachers/:id
     */
    static archiveTeacher(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=teacherController.d.ts.map