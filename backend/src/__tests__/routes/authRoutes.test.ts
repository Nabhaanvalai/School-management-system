import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '../../routes/authRoutes';
import { AuthService } from '../../services/authService';
import { securityHeaders, sanitizeRequest } from '../../middleware/authMiddleware';

// Mock the rate limiting middleware to avoid interference in tests
jest.mock('../../middleware/authMiddleware', () => ({
  ...jest.requireActual('../../middleware/authMiddleware'),
  rateLimit: () => (req: any, res: any, next: any) => next()
}));

// Mock the AuthService
jest.mock('../../services/authService');
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Create test app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(securityHeaders);
  app.use(cors());
  app.use(express.json());
  app.use(sanitizeRequest);
  
  // Routes
  app.use('/api/auth', authRoutes);
  
  return app;
};

describe('Authentication Routes Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockLoginResult = {
        success: true,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'admin' as const,
          profile: { name: 'Test User' },
          isActive: true
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: '15m'
        }
      };

      mockAuthService.login.mockResolvedValue(mockLoginResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: mockLoginResult.user,
          tokens: mockLoginResult.tokens
        }
      });

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'testPassword123');
    });

    it('should fail with invalid credentials', async () => {
      const mockLoginResult = {
        success: false,
        message: 'Invalid email or password'
      };

      mockAuthService.login.mockResolvedValue(mockLoginResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid email or password'
      });
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'testPassword123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testPassword123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const mockRefreshResult = {
        success: true,
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: '15m'
        }
      };

      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResult);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: mockRefreshResult.tokens
        }
      });

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should fail with invalid refresh token', async () => {
      const mockRefreshResult = {
        success: false,
        message: 'Invalid refresh token'
      };

      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResult);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid refresh token'
      });
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      mockAuthService.logout.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: 'valid-refresh-token'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful'
      });

      expect(mockAuthService.logout).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should fail with invalid refresh token', async () => {
      mockAuthService.logout.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Logout failed - invalid or missing refresh token'
      });
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get profile successfully with valid access token', async () => {
      const mockUser = {
        _id: 'test-user-id',
        email: 'test@example.com',
        role: 'admin' as const,
        profile: { name: 'Test User' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the authentication middleware by setting req.user
      mockAuthService.validateAccessToken.mockReturnValue({
        isValid: true,
        payload: {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'admin'
        }
      });

      mockAuthService.getUserById.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: mockUser._id,
            email: mockUser.email,
            role: mockUser.role,
            profile: mockUser.profile,
            isActive: mockUser.isActive
          }
        }
      });
    });

    it('should fail without access token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token is required'
      });
    });

    it('should fail with invalid access token', async () => {
      mockAuthService.validateAccessToken.mockReturnValue({
        isValid: false,
        message: 'Invalid access token'
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid access token'
      });
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully with valid data', async () => {
      const mockChangePasswordResult = {
        success: true,
        message: 'Password changed successfully'
      };

      // Mock authentication
      mockAuthService.validateAccessToken.mockReturnValue({
        isValid: true,
        payload: {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'admin'
        }
      });

      mockAuthService.getUserById.mockResolvedValue({
        _id: 'test-user-id',
        isActive: true
      } as any);

      mockAuthService.changePassword.mockResolvedValue(mockChangePasswordResult);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password changed successfully'
      });

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'test-user-id',
        'oldPassword123',
        'NewPassword123'
      );
    });

    it('should fail with incorrect current password', async () => {
      const mockChangePasswordResult = {
        success: false,
        message: 'Current password is incorrect'
      };

      // Mock authentication
      mockAuthService.validateAccessToken.mockReturnValue({
        isValid: true,
        payload: {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'admin'
        }
      });

      mockAuthService.getUserById.mockResolvedValue({
        _id: 'test-user-id',
        isActive: true
      } as any);

      mockAuthService.changePassword.mockResolvedValue(mockChangePasswordResult);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          currentPassword: 'wrongPassword',
          newPassword: 'NewPassword123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Current password is incorrect'
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token is required'
      });
    });

    it('should fail with missing current password', async () => {
      // Mock authentication
      mockAuthService.validateAccessToken.mockReturnValue({
        isValid: true,
        payload: {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'admin'
        }
      });

      mockAuthService.getUserById.mockResolvedValue({
        _id: 'test-user-id',
        isActive: true
      } as any);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          newPassword: 'NewPassword123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });

    it('should fail with missing new password', async () => {
      // Mock authentication
      mockAuthService.validateAccessToken.mockReturnValue({
        isValid: true,
        payload: {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'admin'
        }
      });

      mockAuthService.getUserById.mockResolvedValue({
        _id: 'test-user-id',
        isActive: true
      } as any);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          currentPassword: 'oldPassword123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully in login', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123'
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should handle service errors gracefully in refresh', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token'
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should handle service errors gracefully in logout', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: 'valid-refresh-token'
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Internal server error'
      });
    });
  });
});