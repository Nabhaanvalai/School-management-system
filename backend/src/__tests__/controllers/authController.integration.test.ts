import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import { User } from '../../models/User';
import { PasswordUtils } from '../../utils/passwordUtils';

// Mock mongoose connection for testing
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
    close: jest.fn()
  }
}));

describe('Authentication Controller Integration Tests', () => {
  let testUser: any;
  let validRefreshToken: string;

  beforeAll(async () => {
    // Mock successful database connection
    (mongoose.connect as jest.Mock).mockResolvedValue({});
  });

  beforeEach(async () => {
    // Mock User model methods
    const hashedPassword = await PasswordUtils.hashPassword('testPassword123');
    testUser = {
      _id: 'test-user-id',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'admin',
      profile: {
        name: 'Test Admin',
        phone: '1234567890',
        address: 'Test Address'
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: jest.fn().mockImplementation(async (password: string) => {
        return await PasswordUtils.comparePassword(password, hashedPassword);
      }),
      save: jest.fn().mockResolvedValue(testUser)
    };

    // Mock User.findOne to return our test user
    jest.spyOn(User, 'findOne').mockImplementation((query: any) => {
      if (query.email === 'test@example.com') {
        return {
          select: jest.fn().mockResolvedValue(testUser)
        } as any;
      }
      return {
        select: jest.fn().mockResolvedValue(null)
      } as any;
    });

    // Mock User.findById
    jest.spyOn(User, 'findById').mockImplementation((id: string) => {
      if (id === 'test-user-id') {
        return Promise.resolve(testUser) as any;
      }
      return Promise.resolve(null) as any;
    });

    // Mock User.findByIdAndUpdate
    jest.spyOn(User, 'findByIdAndUpdate').mockImplementation((id: string, update: any) => {
      if (id === 'test-user-id') {
        Object.assign(testUser, update);
        return Promise.resolve(testUser) as any;
      }
      return Promise.resolve(null) as any;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
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
          user: {
            email: 'test@example.com',
            role: 'admin',
            isActive: true
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(String)
          }
        }
      });

      // Store refresh token for other tests
      validRefreshToken = response.body.data.tokens.refreshToken;
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testPassword123'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid email or password'
      });
    });

    it('should fail with invalid password', async () => {
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

    it('should fail with inactive user', async () => {
      // Deactivate the user
      await User.findByIdAndUpdate(testUser._id, { isActive: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
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
    beforeEach(async () => {
      // Login to get a valid refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123'
        });
      
      validRefreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validRefreshToken
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(String)
          }
        }
      });
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String)
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

    it('should fail with expired refresh token', async () => {
      // First logout to invalidate the token
      await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: validRefreshToken
        });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validRefreshToken
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid refresh token'
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Login to get a valid refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123'
        });
      
      validRefreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should logout successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: validRefreshToken
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful'
      });
    });

    it('should fail with invalid refresh token', async () => {
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

    it('should handle already logged out token gracefully', async () => {
      // First logout
      await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: validRefreshToken
        })
        .expect(200);

      // Try to logout again with same token
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: validRefreshToken
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Logout failed - invalid or missing refresh token'
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123'
        });
      
      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should get profile successfully with valid access token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            email: 'test@example.com',
            role: 'admin',
            isActive: true,
            profile: {
              name: 'Test Admin',
              phone: '1234567890',
              address: 'Test Address'
            }
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
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String)
      });
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token is required'
      });
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123'
        });
      
      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should change password successfully with valid data', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'testPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password changed successfully'
      });

      // Verify old password no longer works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123'
        })
        .expect(401);

      // Verify new password works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123'
        })
        .expect(200);
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
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

    it('should fail with weak new password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'testPassword123',
          newPassword: 'weak'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({
          currentPassword: 'testPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token is required'
      });
    });

    it('should fail with missing current password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
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
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'testPassword123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed'
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login endpoint', async () => {
      // Make 5 failed login attempts (the rate limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongPassword'
          })
          .expect(401);
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword'
        })
        .expect(429);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }, 10000); // Increase timeout for this test
  });

  describe('API Health Check', () => {
    it('should return API health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'API is running',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });
});