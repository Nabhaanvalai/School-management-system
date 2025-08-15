import { Request, Response } from 'express';
/**
 * Authentication controller handling login, refresh, and logout operations
 */
export declare class AuthController {
    /**
     * Handle user login
     * POST /api/auth/login
     */
    static login(req: Request, res: Response): Promise<void>;
    /**
     * Handle token refresh
     * POST /api/auth/refresh
     */
    static refresh(req: Request, res: Response): Promise<void>;
    /**
     * Handle user logout
     * POST /api/auth/logout
     */
    static logout(req: Request, res: Response): Promise<void>;
    /**
     * Get current user profile
     * GET /api/auth/profile
     */
    static getProfile(req: Request, res: Response): Promise<void>;
    /**
     * Change user password
     * PUT /api/auth/change-password
     */
    static changePassword(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=authController.d.ts.map