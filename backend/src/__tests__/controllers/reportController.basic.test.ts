import request from 'supertest';
import app from '../../server';
import jwt from 'jsonwebtoken';

// Helper function to generate JWT token for testing
const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Basic Reporting Endpoints', () => {
  let adminToken: string;
  let teacherToken: string;

  beforeAll(() => {
    // Create tokens for testing
    adminToken = generateToken('admin123', 'admin');
    teacherToken = generateToken('teacher123', 'teacher');
  });

  describe('GET /api/reports/class-performance', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/class-performance')
        .query({
          classId: '8-A',
          academicYear: '2023-2024'
        });

      expect(response.status).toBe(401);
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .get('/api/reports/class-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          classId: '8-A'
          // Missing academicYear
        });

      expect(response.status).toBe(400);
    });

    it('should validate class ID format', async () => {
      const response = await request(app)
        .get('/api/reports/class-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          classId: 'invalid-format',
          academicYear: '2023-2024'
        });

      expect(response.status).toBe(400);
    });

    it('should validate academic year format', async () => {
      const response = await request(app)
        .get('/api/reports/class-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          classId: '8-A',
          academicYear: 'invalid-year'
        });

      expect(response.status).toBe(400);
    });

    it('should accept valid parameters for admin', async () => {
      const response = await request(app)
        .get('/api/reports/class-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          classId: '8-A',
          academicYear: '2023-2024'
        });

      // Should not be 400 (validation error) or 401 (auth error)
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(401);
    });

    it('should accept valid parameters for teacher', async () => {
      const response = await request(app)
        .get('/api/reports/class-performance')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({
          classId: '8-A',
          academicYear: '2023-2024'
        });

      // Should not be 400 (validation error) or 401 (auth error) or 403 (forbidden)
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('GET /api/reports/student-count', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/student-count');

      expect(response.status).toBe(401);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/reports/student-count')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });

    it('should accept request from admin', async () => {
      const response = await request(app)
        .get('/api/reports/student-count')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should not be 401 (auth error) or 403 (forbidden)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should validate format parameter', async () => {
      const response = await request(app)
        .get('/api/reports/student-count')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'invalid-format' });

      expect(response.status).toBe(400);
    });

    it('should accept valid format parameters', async () => {
      const formats = ['json', 'pdf', 'excel'];
      
      for (const format of formats) {
        const response = await request(app)
          .get('/api/reports/student-count')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ format });

        expect(response.status).not.toBe(400);
      }
    });
  });

  describe('GET /api/reports/attendance-summary', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/attendance-summary');

      expect(response.status).toBe(401);
    });

    it('should deny access to non-admin/teacher users', async () => {
      const studentToken = generateToken('student123', 'student');
      
      const response = await request(app)
        .get('/api/reports/attendance-summary')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('should accept request from admin', async () => {
      const response = await request(app)
        .get('/api/reports/attendance-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should not be 401 (auth error) or 403 (forbidden)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should accept request from teacher', async () => {
      const response = await request(app)
        .get('/api/reports/attendance-summary')
        .set('Authorization', `Bearer ${teacherToken}`);

      // Should not be 401 (auth error) or 403 (forbidden)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should validate class ID format when provided', async () => {
      const response = await request(app)
        .get('/api/reports/attendance-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ classId: 'invalid-format' });

      expect(response.status).toBe(400);
    });

    it('should validate date format when provided', async () => {
      const response = await request(app)
        .get('/api/reports/attendance-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate: 'invalid-date' });

      expect(response.status).toBe(400);
    });

    it('should validate academic year format when provided', async () => {
      const response = await request(app)
        .get('/api/reports/attendance-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ academicYear: 'invalid-year' });

      expect(response.status).toBe(400);
    });

    it('should accept valid parameters', async () => {
      const response = await request(app)
        .get('/api/reports/attendance-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          classId: '8-A',
          subject: 'Mathematics',
          startDate: '2023-10-01',
          endDate: '2023-10-31',
          academicYear: '2023-2024',
          format: 'json'
        });

      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Route Registration', () => {
    it('should have all three new reporting routes registered', async () => {
      // Test that routes exist (not 404)
      const routes = [
        '/api/reports/class-performance',
        '/api/reports/student-count',
        '/api/reports/attendance-summary'
      ];

      for (const route of routes) {
        const response = await request(app).get(route);
        expect(response.status).not.toBe(404);
      }
    });
  });
});