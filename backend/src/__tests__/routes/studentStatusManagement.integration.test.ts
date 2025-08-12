import request from 'supertest';
import createTestApp from '../testServer';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { JWTUtils } from '../../utils/jwtUtils';
import mongoose from 'mongoose';

const app = createTestApp();

describe('Student Status Management Integration Tests', () => {
  let adminToken: string;
  let teacherToken: string;
  let adminUser: any;
  let teacherUser: any;
  let testStudent: any;

  beforeAll(async () => {
    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedPassword',
      role: 'admin',
      profile: {
        name: 'Test Admin',
        employeeId: 'ADM001',
        department: 'Administration',
        phone: '1234567890'
      }
    });

    teacherUser = await User.create({
      email: 'teacher@test.com',
      password: 'hashedPassword',
      role: 'teacher',
      profile: {
        name: 'Test Teacher',
        employeeId: 'TCH001',
        subjects: ['Math'],
        phone: '1234567891',
        address: '123 Teacher Street',
        dateOfJoining: new Date('2020-01-01')
      }
    });

    // Generate tokens
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

  beforeEach(async () => {
    // Clean up students collection
    await Student.deleteMany({});

    // Create a test student
    testStudent = await Student.create({
      rollNo: 'STU001',
      name: 'Test Student',
      dateOfBirth: new Date('2005-01-01'),
      admissionDate: new Date('2020-04-01'),
      standard: '10',
      section: 'A',
      parentContact: {
        fatherName: 'Test Father',
        motherName: 'Test Mother',
        phone: '1234567890',
        email: 'parent@test.com',
        address: '123 Test Street, Test City'
      },
      status: 'active'
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Student.deleteMany({});
  });

  describe('PUT /api/students/:id/mark-left', () => {
    it('should mark student as left with current date when no leaving date provided', async () => {
      const response = await request(app)
        .put(`/api/students/${testStudent._id}/mark-left`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student marked as left successfully');
      expect(response.body.data.status).toBe('left');
      expect(response.body.data.leavingDate).toBeDefined();

      // Verify in database
      const updatedStudent = await Student.findById(testStudent._id);
      expect(updatedStudent?.status).toBe('left');
      expect(updatedStudent?.leavingDate).toBeDefined();
    });

    it('should mark student as left with specific leaving date', async () => {
      const leavingDate = '2023-12-15';
      
      const response = await request(app)
        .put(`/api/students/${testStudent._id}/mark-left`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ leavingDate });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('left');
      expect(new Date(response.body.data.leavingDate).toISOString().split('T')[0]).toBe(leavingDate);
    });

    it('should reject leaving date before admission date', async () => {
      const leavingDate = '2019-01-01'; // Before admission date (2020-04-01)
      
      const response = await request(app)
        .put(`/api/students/${testStudent._id}/mark-left`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ leavingDate });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Leaving date cannot be before admission date');
    });

    it('should reject future leaving date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const leavingDate = futureDate.toISOString().split('T')[0];
      
      const response = await request(app)
        .put(`/api/students/${testStudent._id}/mark-left`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ leavingDate });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Leaving date cannot be in the future');
    });

    it('should reject invalid leaving date format', async () => {
      const response = await request(app)
        .put(`/api/students/${testStudent._id}/mark-left`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ leavingDate: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid leaving date format');
    });

    it('should reject marking already left student as left', async () => {
      // First mark as left
      await Student.findByIdAndUpdate(testStudent._id, { 
        status: 'left', 
        leavingDate: new Date() 
      });

      const response = await request(app)
        .put(`/api/students/${testStudent._id}/mark-left`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student is already marked as left');
    });

    it('should return 404 for non-existent student', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/students/${nonExistentId}/mark-left`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student not found');
    });

    it('should reject invalid student ID', async () => {
      const response = await request(app)
        .put('/api/students/invalid-id/mark-left')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid student ID');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .put(`/api/students/${testStudent._id}/mark-left`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/students/${testStudent._id}/mark-left`)
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/students/:id (Archive)', () => {
    it('should archive student by marking as left', async () => {
      const response = await request(app)
        .delete(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student archived successfully');
      expect(response.body.data.status).toBe('left');
      expect(response.body.data.leavingDate).toBeDefined();

      // Verify student still exists in database but marked as left
      const archivedStudent = await Student.findById(testStudent._id);
      expect(archivedStudent).toBeTruthy();
      expect(archivedStudent?.status).toBe('left');
    });

    it('should archive already left student', async () => {
      // Mark student as left first
      await Student.findByIdAndUpdate(testStudent._id, { 
        status: 'left', 
        leavingDate: new Date('2023-01-01') 
      });

      const response = await request(app)
        .delete(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('left');
    });
  });

  describe('GET /api/students/count/by-class', () => {
    beforeEach(async () => {
      // Create multiple students with different statuses
      await Student.create([
        {
          rollNo: 'STU002',
          name: 'Active Student 1',
          dateOfBirth: new Date('2005-02-01'),
          admissionDate: new Date('2020-04-01'),
          standard: '10',
          section: 'A',
          parentContact: {
            fatherName: 'Father 2',
            motherName: 'Mother 2',
            phone: '1234567891',
            email: 'parent2@test.com',
            address: '124 Test Street'
          },
          status: 'active'
        },
        {
          rollNo: 'STU003',
          name: 'Left Student 1',
          dateOfBirth: new Date('2005-03-01'),
          admissionDate: new Date('2020-04-01'),
          standard: '10',
          section: 'A',
          parentContact: {
            fatherName: 'Father 3',
            motherName: 'Mother 3',
            phone: '1234567892',
            email: 'parent3@test.com',
            address: '125 Test Street'
          },
          status: 'left',
          leavingDate: new Date('2023-01-01')
        },
        {
          rollNo: 'STU004',
          name: 'Active Student 2',
          dateOfBirth: new Date('2005-04-01'),
          admissionDate: new Date('2020-04-01'),
          standard: '10',
          section: 'B',
          parentContact: {
            fatherName: 'Father 4',
            motherName: 'Mother 4',
            phone: '1234567893',
            email: 'parent4@test.com',
            address: '126 Test Street'
          },
          status: 'active'
        }
      ]);
    });

    it('should return detailed student count statistics by class', async () => {
      const response = await request(app)
        .get('/api/students/count/by-class')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('classCounts');
      expect(response.body.data).toHaveProperty('overallStats');

      const { classCounts, overallStats } = response.body.data;

      // Check class counts
      expect(classCounts).toHaveLength(2); // 10-A and 10-B
      
      const class10A = classCounts.find((c: any) => c.classIdentifier === '10-A');
      expect(class10A).toBeDefined();
      expect(class10A.totalStudents).toBe(3); // STU001, STU002, STU003
      expect(class10A.activeStudents).toBe(2); // STU001, STU002
      expect(class10A.leftStudents).toBe(1); // STU003

      const class10B = classCounts.find((c: any) => c.classIdentifier === '10-B');
      expect(class10B).toBeDefined();
      expect(class10B.totalStudents).toBe(1); // STU004
      expect(class10B.activeStudents).toBe(1); // STU004
      expect(class10B.leftStudents).toBe(0);

      // Check overall stats
      expect(overallStats.totalStudents).toBe(4);
      expect(overallStats.activeStudents).toBe(3);
      expect(overallStats.leftStudents).toBe(1);
    });

    it('should return empty stats when no students exist', async () => {
      await Student.deleteMany({});

      const response = await request(app)
        .get('/api/students/count/by-class')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.classCounts).toHaveLength(0);
      expect(response.body.data.overallStats).toEqual({
        totalStudents: 0,
        activeStudents: 0,
        leftStudents: 0
      });
    });

    it('should allow teacher access', async () => {
      const response = await request(app)
        .get('/api/students/count/by-class')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/students with status filtering', () => {
    beforeEach(async () => {
      // Create students with different statuses
      await Student.create([
        {
          rollNo: 'STU005',
          name: 'Active Student Filter Test',
          dateOfBirth: new Date('2005-05-01'),
          admissionDate: new Date('2020-04-01'),
          standard: '11',
          section: 'A',
          parentContact: {
            fatherName: 'Father 5',
            motherName: 'Mother 5',
            phone: '1234567894',
            email: 'parent5@test.com',
            address: '127 Test Street'
          },
          status: 'active'
        },
        {
          rollNo: 'STU006',
          name: 'Left Student Filter Test',
          dateOfBirth: new Date('2005-06-01'),
          admissionDate: new Date('2020-04-01'),
          standard: '11',
          section: 'A',
          parentContact: {
            fatherName: 'Father 6',
            motherName: 'Mother 6',
            phone: '1234567895',
            email: 'parent6@test.com',
            address: '128 Test Street'
          },
          status: 'left',
          leavingDate: new Date('2023-06-01')
        }
      ]);
    });

    it('should filter students by active status', async () => {
      const response = await request(app)
        .get('/api/students?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2); // testStudent + STU005
      
      response.body.data.data.forEach((student: any) => {
        expect(student.status).toBe('active');
      });
    });

    it('should filter students by left status', async () => {
      const response = await request(app)
        .get('/api/students?status=left')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1); // STU006
      
      response.body.data.data.forEach((student: any) => {
        expect(student.status).toBe('left');
        expect(student.leavingDate).toBeDefined();
      });
    });

    it('should return all students when no status filter applied', async () => {
      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3); // testStudent + STU005 + STU006
    });
  });

  describe('Student Status Management Edge Cases', () => {
    it('should handle concurrent status updates correctly', async () => {
      // Simulate concurrent requests to mark the same student as left
      const promises = [
        request(app)
          .put(`/api/students/${testStudent._id}/mark-left`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ leavingDate: '2023-01-01' }),
        request(app)
          .put(`/api/students/${testStudent._id}/mark-left`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ leavingDate: '2023-01-02' })
      ];

      const responses = await Promise.all(promises);
      
      // One should succeed, one should fail
      const successCount = responses.filter(r => r.status === 200).length;
      const failCount = responses.filter(r => r.status === 400).length;
      
      expect(successCount).toBe(1);
      expect(failCount).toBe(1);
      
      // Verify final state
      const finalStudent = await Student.findById(testStudent._id);
      expect(finalStudent?.status).toBe('left');
    });

    it('should maintain data integrity when archiving student', async () => {
      // Archive student
      await request(app)
        .delete(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Verify student is not returned in active student queries
      const activeStudentsResponse = await request(app)
        .get('/api/students?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      const activeStudents = activeStudentsResponse.body.data.data;
      expect(activeStudents.find((s: any) => s.id === testStudent._id.toString())).toBeUndefined();

      // Verify student is returned in left student queries
      const leftStudentsResponse = await request(app)
        .get('/api/students?status=left')
        .set('Authorization', `Bearer ${adminToken}`);

      const leftStudents = leftStudentsResponse.body.data.data;
      expect(leftStudents.find((s: any) => s.id === testStudent._id.toString())).toBeDefined();
    });
  });
});