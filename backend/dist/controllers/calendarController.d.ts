import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
export declare const createCalendarEvent: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCalendarEvents: (req: Request, res: Response) => Promise<void>;
export declare const getCalendarEventById: (req: Request, res: Response) => Promise<void>;
export declare const updateCalendarEvent: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteCalendarEvent: (req: Request, res: Response) => Promise<void>;
export declare const getEventsByType: (req: Request, res: Response) => Promise<void>;
export declare const getHolidays: (req: Request, res: Response) => Promise<void>;
export declare const getUpcomingEvents: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=calendarController.d.ts.map