"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const studentRoutes_1 = __importDefault(require("./studentRoutes"));
const teacherRoutes_1 = __importDefault(require("./teacherRoutes"));
const attendanceRoutes_1 = __importDefault(require("./attendanceRoutes"));
const timetableRoutes_1 = __importDefault(require("./timetableRoutes"));
const examRoutes_1 = __importDefault(require("./examRoutes"));
const reportRoutes_1 = __importDefault(require("./reportRoutes"));
const calendarRoutes_1 = __importDefault(require("./calendarRoutes"));
const paymentRoutes_1 = __importDefault(require("./paymentRoutes"));
const leaveRoutes_1 = __importDefault(require("./leaveRoutes"));
const router = (0, express_1.Router)();
/**
 * API Routes
 * Base path: /api
 */
// Authentication routes
router.use('/auth', authRoutes_1.default);
// Student management routes
router.use('/students', studentRoutes_1.default);
// Teacher management routes
router.use('/teachers', teacherRoutes_1.default);
// Attendance management routes
router.use('/attendance', attendanceRoutes_1.default);
// Timetable management routes
router.use('/timetable', timetableRoutes_1.default);
// Exam management routes
router.use('/exams', examRoutes_1.default);
// Report management routes
router.use('/reports', reportRoutes_1.default);
// Calendar management routes
router.use('/calendar', calendarRoutes_1.default);
// Payment management routes
router.use('/payments', paymentRoutes_1.default);
// Leave management routes
router.use('/leave', leaveRoutes_1.default);
// Health check for API
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map