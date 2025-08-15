"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const routes_1 = __importDefault(require("../routes"));
const authMiddleware_1 = require("../middleware/authMiddleware");
// Create test app without starting server
const createTestApp = () => {
    const app = (0, express_1.default)();
    // Global middleware
    app.use((0, helmet_1.default)());
    app.use(authMiddleware_1.securityHeaders);
    app.use((0, cors_1.default)({
        origin: 'http://localhost:3000',
        credentials: true
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use(authMiddleware_1.sanitizeRequest);
    // API routes
    app.use('/api', routes_1.default);
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected'
        });
    });
    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    });
    // Global error handler
    app.use((error, req, res, next) => {
        console.error('Global error handler:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    });
    return app;
};
exports.default = createTestApp;
//# sourceMappingURL=testServer.js.map