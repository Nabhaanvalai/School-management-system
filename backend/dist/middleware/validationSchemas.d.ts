import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Validation schemas for common request types
 */
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const refreshTokenSchema: Joi.ObjectSchema<any>;
export declare const changePasswordSchema: Joi.ObjectSchema<any>;
export declare const createStudentSchema: Joi.ObjectSchema<any>;
export declare const updateStudentSchema: Joi.ObjectSchema<any>;
export declare const createTeacherSchema: Joi.ObjectSchema<any>;
export declare const markAttendanceSchema: Joi.ObjectSchema<any>;
export declare const createTimetableSchema: Joi.ObjectSchema<any>;
export declare const createExamSchema: Joi.ObjectSchema<any>;
export declare const createLeaveRequestSchema: Joi.ObjectSchema<any>;
export declare const paginationSchema: Joi.ObjectSchema<any>;
export declare const studentFilterSchema: Joi.ObjectSchema<any>;
export declare const updateTeacherSchema: Joi.ObjectSchema<any>;
export declare const teacherFilterSchema: Joi.ObjectSchema<any>;
export declare const teacherAssignmentSchema: Joi.ObjectSchema<any>;
export declare const salaryUpdateSchema: Joi.ObjectSchema<any>;
//# sourceMappingURL=validationSchemas.d.ts.map