import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../models/User';
import paymentRoutes from '../../routes/paymentRoutes';
import { JWTUtils } from '../../utils/jwtUtils';

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

describe('Payment Routes', () => {
  let mongoServer: MongoMemoryServer;
  let adminUser: any;
  let teacherUser: any;
  let adminToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedPassword',
      role: 'admin',
      profile: {
        name: 'Admin User',
        phone: '1234567890'
      }
    });

    teacherUser = await User.create({
      email: 'teacher@test.com',
      password: 'hashedPassword',
      role: 'teacher',
      profile: {
        name: 'Teacher User',
        phone: '1234567891'
      }
    });

    adminToken = JWTUtils.generateAccessToken({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role
    });
    teacherToken = JWTUtils.generateAccessToken({
      userId: teacherUser._id.toString(),
      email: teacherUser.email,
      role: teacherUser.role
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Route validation', () => {
    it('should validate payment creation data', async () => {
      const invalidData = {
        paymentType: 'invalid-type',
        amount: -100, // Negative amount
        dueDate: 'invalid-date',
        academicYear: 'invalid-year',
        description: 'A' // Too short
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate academic year format', async () => {
      const invalidData = {
        paymentType: 'student-fee',
        amount: 5000,
        dueDate: '2024-06-01',
        academicYear: '2024', // Invalid format
        description: 'Valid description'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate payment status values', async () => {
      const invalidData = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439011/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate payment method values', async () => {
      const invalidData = {
        status: 'paid',
        paymentMethod: 'invalid-method'
      };

      const response = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439011/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate fee category values', async () => {
      const invalidData = {
        paymentType: 'student-fee',
        amount: 5000,
        dueDate: '2024-06-01',
        academicYear: '2023-2024',
        description: 'Valid description',
        feeCategory: 'invalid-category'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate month values', async () => {
      const invalidData = {
        paymentType: 'teacher-salary',
        amount: 50000,
        dueDate: '2024-06-01',
        academicYear: '2023-2024',
        description: 'Valid description',
        month: 'InvalidMonth'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate year range', async () => {
      const invalidData = {
        paymentType: 'teacher-salary',
        amount: 50000,
        dueDate: '2024-06-01',
        academicYear: '2023-2024',
        description: 'Valid description',
        year: 1999 // Too old
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate MongoDB ObjectId for payment ID', async () => {
      const response = await request(app)
        .get('/api/payments/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate MongoDB ObjectId for student ID', async () => {
      const response = await request(app)
        .get('/api/payments/student/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate MongoDB ObjectId for teacher ID', async () => {
      const response = await request(app)
        .get('/api/payments/teacher/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/payments?page=0&limit=101&year=1999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate payment summary requires payment type', async () => {
      const response = await request(app)
        .get('/api/payments/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'get', path: '/api/payments' },
        { method: 'post', path: '/api/payments' },
        { method: 'get', path: '/api/payments/overdue' },
        { method: 'get', path: '/api/payments/summary?paymentType=student-fee' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method as keyof typeof request](route.path);
        expect(response.status).toBe(401);
      }
    });

    it('should require admin role for create, update, delete operations', async () => {
      const validData = {
        paymentType: 'student-fee',
        amount: 5000,
        dueDate: '2024-06-01',
        academicYear: '2023-2024',
        description: 'Test payment'
      };

      // Test POST
      const postResponse = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(validData);
      expect(postResponse.status).toBe(403);

      // Test PUT status
      const putStatusResponse = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439011/status')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'paid', paymentMethod: 'cash' });
      expect(putStatusResponse.status).toBe(403);

      // Test PUT update
      const putResponse = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ amount: 6000 });
      expect(putResponse.status).toBe(403);

      // Test DELETE
      const deleteResponse = await request(app)
        .delete('/api/payments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(deleteResponse.status).toBe(403);
    });

    it('should require admin role for overdue payments and summary', async () => {
      // Test overdue payments
      const overdueResponse = await request(app)
        .get('/api/payments/overdue')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(overdueResponse.status).toBe(403);

      // Test payment summary
      const summaryResponse = await request(app)
        .get('/api/payments/summary?paymentType=student-fee')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(summaryResponse.status).toBe(403);
    });

    it('should allow all authenticated users to read payment records', async () => {
      const readRoutes = [
        '/api/payments',
        '/api/payments/student/507f1f77bcf86cd799439011',
        '/api/payments/teacher/507f1f77bcf86cd799439011',
        '/api/payments/507f1f77bcf86cd799439011'
      ];

      for (const route of readRoutes) {
        const response = await request(app)
          .get(route)
          .set('Authorization', `Bearer ${teacherToken}`);
        
        // Should not be 401 (unauthorized) or 403 (forbidden)
        // May be 404 (not found) or 400 (bad request) due to fake IDs
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      }
    });
  });

  describe('Route parameter validation', () => {
    it('should validate date range in query parameters', async () => {
      const response = await request(app)
        .get('/api/payments?startDate=invalid-date&endDate=2024-06-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/payments?page=-1&limit=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate amount range', async () => {
      const invalidData = {
        paymentType: 'student-fee',
        amount: 20000000, // Too high
        dueDate: '2024-06-01',
        academicYear: '2023-2024',
        description: 'Test payment'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate description length', async () => {
      const invalidData = {
        paymentType: 'student-fee',
        amount: 5000,
        dueDate: '2024-06-01',
        academicYear: '2023-2024',
        description: 'A'.repeat(501) // Too long
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate remarks length', async () => {
      const invalidData = {
        paymentType: 'student-fee',
        amount: 5000,
        dueDate: '2024-06-01',
        academicYear: '2023-2024',
        description: 'Valid description',
        remarks: 'A'.repeat(1001) // Too long
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate transaction ID length', async () => {
      const invalidData = {
        status: 'paid',
        paymentMethod: 'cash',
        transactionId: 'A'.repeat(101) // Too long
      };

      const response = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439011/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('Specific route validations', () => {
    it('should validate payment type in overdue query', async () => {
      const response = await request(app)
        .get('/api/payments/overdue?paymentType=invalid-type')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate payment type in summary query', async () => {
      const response = await request(app)
        .get('/api/payments/summary?paymentType=invalid-type')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate academic year in student payment history', async () => {
      const response = await request(app)
        .get('/api/payments/student/507f1f77bcf86cd799439011?academicYear=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate year in teacher payment history', async () => {
      const response = await request(app)
        .get('/api/payments/teacher/507f1f77bcf86cd799439011?year=1999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate delete reason length', async () => {
      const invalidData = {
        reason: 'A'.repeat(501) // Too long
      };

      const response = await request(app)
        .delete('/api/payments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });
});