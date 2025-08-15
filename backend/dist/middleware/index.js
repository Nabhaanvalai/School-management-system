"use strict";
/**
 * Middleware exports for easy importing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRequest = exports.securityHeaders = exports.cleanupRateLimit = exports.rateLimit = exports.validateRequest = exports.requireOwnershipOrAdmin = exports.optionalAuth = exports.requireAuth = exports.requireTeacherOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
var authMiddleware_1 = require("./authMiddleware");
Object.defineProperty(exports, "authenticateToken", { enumerable: true, get: function () { return authMiddleware_1.authenticateToken; } });
Object.defineProperty(exports, "requireRole", { enumerable: true, get: function () { return authMiddleware_1.requireRole; } });
Object.defineProperty(exports, "requireAdmin", { enumerable: true, get: function () { return authMiddleware_1.requireAdmin; } });
Object.defineProperty(exports, "requireTeacherOrAdmin", { enumerable: true, get: function () { return authMiddleware_1.requireTeacherOrAdmin; } });
Object.defineProperty(exports, "requireAuth", { enumerable: true, get: function () { return authMiddleware_1.requireAuth; } });
Object.defineProperty(exports, "optionalAuth", { enumerable: true, get: function () { return authMiddleware_1.optionalAuth; } });
Object.defineProperty(exports, "requireOwnershipOrAdmin", { enumerable: true, get: function () { return authMiddleware_1.requireOwnershipOrAdmin; } });
Object.defineProperty(exports, "validateRequest", { enumerable: true, get: function () { return authMiddleware_1.validateRequest; } });
Object.defineProperty(exports, "rateLimit", { enumerable: true, get: function () { return authMiddleware_1.rateLimit; } });
Object.defineProperty(exports, "cleanupRateLimit", { enumerable: true, get: function () { return authMiddleware_1.cleanupRateLimit; } });
Object.defineProperty(exports, "securityHeaders", { enumerable: true, get: function () { return authMiddleware_1.securityHeaders; } });
Object.defineProperty(exports, "sanitizeRequest", { enumerable: true, get: function () { return authMiddleware_1.sanitizeRequest; } });
__exportStar(require("./validationSchemas"), exports);
//# sourceMappingURL=index.js.map