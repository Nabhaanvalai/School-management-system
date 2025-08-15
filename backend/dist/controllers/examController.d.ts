import { Request, Response, NextFunction } from 'express';
export declare const createExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getExams: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getExamById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addSubjectToExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const removeSubjectFromExam: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getExamsByClass: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUpcomingExams: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const enterMarks: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const publishResults: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=examController.d.ts.map