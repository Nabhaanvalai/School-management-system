import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import apiRoutes from '../routes';
import { securityHeaders, sanitizeRequest } from '../middleware/authMiddleware';

// Create test app without starting server
const createTestApp = () => {
  const app = express();

  // Global middleware
  app.use(helmet());
  app.use(securityHeaders);
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(sanitizeRequest);

  // API routes
  app.use('/api', apiRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('Global error handler:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  });

  return app;
};

export default createTestApp;