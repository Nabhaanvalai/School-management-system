import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
export declare const createPayment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPayments: (req: Request, res: Response) => Promise<void>;
export declare const getPaymentById: (req: Request, res: Response) => Promise<void>;
export declare const updatePaymentStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getStudentPaymentHistory: (req: Request, res: Response) => Promise<void>;
export declare const getTeacherPaymentHistory: (req: Request, res: Response) => Promise<void>;
export declare const getOverduePayments: (req: Request, res: Response) => Promise<void>;
export declare const getPaymentSummary: (req: Request, res: Response) => Promise<void>;
export declare const updatePayment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deletePayment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map