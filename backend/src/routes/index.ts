import { Router } from 'express';
import authRoutes from './authRoutes';
import studentRoutes from './studentRoutes';
import teacherRoutes from './teacherRoutes';
import attendanceRoutes from './attendanceRoutes';
import timetableRoutes from './timetableRoutes';
import examRoutes from './examRoutes';
import reportRoutes from './reportRoutes';
import calendarRoutes from './calendarRoutes';
import paymentRoutes from './paymentRoutes';
import leaveRoutes from './leaveRoutes';

const router = Router();

/**
 * API Routes
 * Base path: /api
 */

// Authentication routes
router.use('/auth', authRoutes);

// Student management routes
router.use('/students', studentRoutes);

// Teacher management routes
router.use('/teachers', teacherRoutes);

// Attendance management routes
router.use('/attendance', attendanceRoutes);

// Timetable management routes
router.use('/timetable', timetableRoutes);

// Exam management routes
router.use('/exams', examRoutes);

// Report management routes
router.use('/reports', reportRoutes);

// Calendar management routes
router.use('/calendar', calendarRoutes);

// Payment management routes
router.use('/payments', paymentRoutes);

// Leave management routes
router.use('/leave', leaveRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;