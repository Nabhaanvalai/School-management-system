import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: UserRole;
            };
        }
    }
}
/**
 * Authentication middleware to verify JWT tokens
 */
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Role-based access control middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export declare const requireRole: (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Admin-only access middleware
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Teacher or Admin access middleware
 */
export declare const requireTeacherOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Any authenticated user middleware (already covered by authenticateToken)
 */
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user can access their own data or is admin
 * @param userIdParam - The parameter name in the route that contains the user ID
 */
export declare const requireOwnershipOrAdmin: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate request data against a schema
 * @param schema - Joi validation schema
 * @param target - What to validate ('body' | 'query' | 'params')
 */
export declare const validateRequest: (schema: any, target?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimit: (maxRequests?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Cleanup expired rate limit entries (should be called periodically)
 */
export declare const cleanupRateLimit: () => void;
/**
 * Security headers middleware
 */
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request sanitization middleware
 */
export declare const sanitizeRequest: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map