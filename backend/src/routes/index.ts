import { Router } from 'express';
import authRoutes from './authRoutes';
import studentRoutes from './studentRoutes';

const router = Router();

/**
 * API Routes
 * Base path: /api
 */

// Authentication routes
router.use('/auth', authRoutes);

// Student management routes
router.use('/students', studentRoutes);

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