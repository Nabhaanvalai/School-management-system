"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRequest = exports.securityHeaders = exports.cleanupRateLimit = exports.rateLimit = exports.validateRequest = exports.requireOwnershipOrAdmin = exports.optionalAuth = exports.requireAuth = exports.requireTeacherOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jwtUtils_1 = require("../utils/jwtUtils");
const authService_1 = require("../services/authService");
/**
 * Authentication middleware to verify JWT tokens
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = jwtUtils_1.JWTUtils.extractTokenFromHeader(authHeader);
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
            return;
        }
        // Validate the token
        const validationResult = authService_1.AuthService.validateAccessToken(token);
        if (!validationResult.isValid || !validationResult.payload) {
            res.status(401).json({
                success: false,
                message: validationResult.message || 'Invalid access token'
            });
            return;
        }
        // Verify user still exists and is active
        const user = await authService_1.AuthService.getUserById(validationResult.payload.userId);
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
            return;
        }
        // Add user information to request object
        req.user = {
            id: validationResult.payload.userId,
            email: validationResult.payload.email,
            role: validationResult.payload.role
        };
        next();
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Role-based access control middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            // Check if user has required role
            if (!allowedRoles.includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Role authorization error:', error);
            res.status(403).json({
                success: false,
                message: 'Authorization failed'
            });
        }
    };
};
exports.requireRole = requireRole;
/**
 * Admin-only access middleware
 */
exports.requireAdmin = (0, exports.requireRole)(['admin']);
/**
 * Teacher or Admin access middleware
 */
exports.requireTeacherOrAdmin = (0, exports.requireRole)(['teacher', 'admin']);
/**
 * Any authenticated user middleware (already covered by authenticateToken)
 */
exports.requireAuth = exports.authenticateToken;
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = jwtUtils_1.JWTUtils.extractTokenFromHeader(authHeader);
        if (token) {
            const validationResult = authService_1.AuthService.validateAccessToken(token);
            if (validationResult.isValid && validationResult.payload) {
                const user = await authService_1.AuthService.getUserById(validationResult.payload.userId);
                if (user && user.isActive) {
                    req.user = {
                        id: validationResult.payload.userId,
                        email: validationResult.payload.email,
                        role: validationResult.payload.role
                    };
                }
            }
        }
        next();
    }
    catch (error) {
        // Don't fail on optional auth errors, just continue without user
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Middleware to check if user can access their own data or is admin
 * @param userIdParam - The parameter name in the route that contains the user ID
 */
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const targetUserId = req.params[userIdParam];
            // Admin can access any user's data
            if (req.user.role === 'admin') {
                next();
                return;
            }
            // User can only access their own data
            if (req.user.id === targetUserId) {
                next();
                return;
            }
            res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own data.'
            });
        }
        catch (error) {
            console.error('Ownership authorization error:', error);
            res.status(403).json({
                success: false,
                message: 'Authorization failed'
            });
        }
    };
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
/**
 * Middleware to validate request data against a schema
 * @param schema - Joi validation schema
 * @param target - What to validate ('body' | 'query' | 'params')
 */
const validateRequest = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            const dataToValidate = req[target];
            const { error, value } = schema.validate(dataToValidate, {
                abortEarly: false,
                stripUnknown: true
            });
            if (error) {
                const errorMessages = error.details.map((detail) => detail.message);
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errorMessages
                });
                return;
            }
            // Replace request data with validated and sanitized data
            req[target] = value;
            next();
        }
        catch (error) {
            console.error('Request validation error:', error);
            res.status(400).json({
                success: false,
                message: 'Request validation failed'
            });
        }
    };
};
exports.validateRequest = validateRequest;
/**
 * Rate limiting middleware (basic implementation)
 * In production, use a proper rate limiting library like express-rate-limit
 */
const requestCounts = new Map();
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        try {
            const clientId = req.ip || 'unknown';
            const now = Date.now();
            const clientData = requestCounts.get(clientId);
            if (!clientData || now > clientData.resetTime) {
                // Reset or initialize counter
                requestCounts.set(clientId, {
                    count: 1,
                    resetTime: now + windowMs
                });
                next();
                return;
            }
            if (clientData.count >= maxRequests) {
                res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
                });
                return;
            }
            // Increment counter
            clientData.count++;
            next();
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            next(); // Don't block requests on rate limiting errors
        }
    };
};
exports.rateLimit = rateLimit;
/**
 * Cleanup expired rate limit entries (should be called periodically)
 */
const cleanupRateLimit = () => {
    const now = Date.now();
    requestCounts.forEach((data, clientId) => {
        if (now > data.resetTime) {
            requestCounts.delete(clientId);
        }
    });
};
exports.cleanupRateLimit = cleanupRateLimit;
/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
    try {
        // Basic XSS protection - remove script tags and javascript: protocols
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                return value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            }
            if (typeof value === 'object' && value !== null) {
                const sanitized = Array.isArray(value) ? [] : {};
                for (const key in value) {
                    sanitized[key] = sanitizeValue(value[key]);
                }
                return sanitized;
            }
            return value;
        };
        // Sanitize request body
        if (req.body) {
            req.body = sanitizeValue(req.body);
        }
        // Sanitize query parameters
        if (req.query) {
            req.query = sanitizeValue(req.query);
        }
        next();
    }
    catch (error) {
        console.error('Request sanitization error:', error);
        next(); // Don't block requests on sanitization errors
    }
};
exports.sanitizeRequest = sanitizeRequest;
//# sourceMappingURL=authMiddleware.js.map