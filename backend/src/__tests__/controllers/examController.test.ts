import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import { User } from '../../models/User';
import { Student } from '../../models/Student';
import { Exam } from '../../models/Exam';
import { JWTUtils } from '../../utils/jwtUtils';

describe('Exam Controller', () => {
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let adminUser: any;
  let teacherUser: any;
  let studentUser: any;
  let testStudent: any;

  beforeAll(async () => {
    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedPassword',
      role: 'admin',
      profile: {
        name: 'Test Admin',
        phone: '1234567890'
      }
    });

    teacherUser = await User.create({
      email: 'teacher@test.com',
      password: 'hashedPassword',
      role: 'teacher',
      profile: {
        name: 'Test Teacher',
        phone: '1234567891'
      }
    });

    studentUser = await User.create({
      email: 'student@test.com',
      password: 'hashedPassword',
      role: 'student',
      profile: {
        name: 'Test Student',
        phone: '1234567892'
      }
    });

    // Create test student
    testStudent = await Student.create({
      rollNo: 'STU001',
      name: 'Test Student',
      dateOfBirth: new Date('2010-01-01'),
      admissionDate: new Date('2023-04-01'),
      standard: '8',
      section: 'A',
      parentContact: {
        fatherName: 'Test Father',
        motherName: 'Test Mother',
        phone: '9876543210',
        email: 'parent@test.com',
        address: 'Test Address'
      },
      status: 'active',
      userId: studentUser._id
    });

    // Generate tokens
    adminToken = JWTUtils.generateAccessToken({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: 'admin'
    });
    teacherToken = JWTUtils.generateAccessToken({
      userId: teacherUser._id.toString(),
      email: teacherUser.email,
      role: 'teacher'
    });
    studentToken = JWTUtils.generateAccessToken({
      userId: studentUser._id.toString(),
      email: studentUser.email,
      role: 'student'
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Student.deleteMany({});
    await Exam.deleteMany({});
  });

  afterEach(async () => {
    await Exam.deleteMany({});
  });

  describe('POST /api/exams', () => {
    const validExamData = {
      name: 'Mid Term Exam',
      academicYear: '2023-2024',
      classId: '8-A',
      examType: 'mid-term',
      subjects: [
        {
          subject: 'Mathematics',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          syllabus: 'Chapters 1-5',
          maxMarks: 100,
          duration: 180,
          startTime: '09:00',
          endTime: '12:00'
        },
        {
          subject: 'Science',
          date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
          syllabus: 'Chapters 1-3',
          maxMarks: 80,
          duration: 120,
          startTime: '10:00',
          endTime: '12:00'
        }
      ]
    };

    it('should create exam successfully with admin token', async () => {
      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validExamData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.exam.name).toBe(validExamData.name);
      expect(response.body.data.exam.subjects).toHaveLength(2);
    });

    it('should fail to create exam without admin role', async () => {
      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(validExamData);

      expect(response.status).toBe(403);
    });

    it('should fail to create exam without authentication', async () => {
      const response = await request(app)
        .post('/api/exams')
        .send(validExamData);

      expect(response.status).toBe(401);
    });

    it('should fail to create exam with invalid data', async () => {
      const invalidData = {
        ...validExamData,
        name: 'AB', // Too short
        academicYear: '2023', // Invalid format
        classId: '8-Z' // Invalid section
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should fail to create exam for class with no active students', async () => {
      const examForEmptyClass = {
        ...validExamData,
        classId: '9-B' // No students in this class
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examForEmptyClass);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('No active students found');
    });

    it('should fail to create duplicate exam', async () => {
      // Create first exam
      await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validExamData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validExamData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should fail to create exam with past date', async () => {
      const pastDateExam = {
        ...validExamData,
        subjects: [
          {
            ...validExamData.subjects[0],
            date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
          }
        ]
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pastDateExam);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/exams', () => {
    beforeEach(async () => {
      // Create test exams
      await Exam.create({
        name: 'Test Exam 1',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'mid-term',
        subjects: [],
        createdBy: adminUser._id
      });

      await Exam.create({
        name: 'Test Exam 2',
        academicYear: '2023-2024',
        classId: '8-B',
        examType: 'final',
        subjects: [],
        createdBy: adminUser._id
      });
    });

    it('should get all exams with authentication', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.exams).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter exams by academic year', async () => {
      const response = await request(app)
        .get('/api/exams?academicYear=2023-2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exams).toHaveLength(2);
    });

    it('should filter exams by class', async () => {
      const response = await request(app)
        .get('/api/exams?classId=8-A')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exams).toHaveLength(1);
      expect(response.body.data.exams[0].classId).toBe('8-A');
    });

    it('should filter exams by exam type', async () => {
      const response = await request(app)
        .get('/api/exams?examType=mid-term')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exams).toHaveLength(1);
      expect(response.body.data.exams[0].examType).toBe('mid-term');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/exams?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exams).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/exams');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/exams/:id', () => {
    let testExam: any;

    beforeEach(async () => {
      testExam = await Exam.create({
        name: 'Test Exam',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'mid-term',
        subjects: [
          {
            subject: 'Mathematics',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            syllabus: 'Chapters 1-5',
            maxMarks: 100,
            duration: 180,
            startTime: '09:00',
            endTime: '12:00'
          }
        ],
        createdBy: adminUser._id
      });
    });

    it('should get exam by ID', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.exam.name).toBe('Test Exam');
    });

    it('should return 404 for non-existent exam', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/exams/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail with invalid exam ID', async () => {
      const response = await request(app)
        .get('/api/exams/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/exams/:id', () => {
    let testExam: any;

    beforeEach(async () => {
      testExam = await Exam.create({
        name: 'Test Exam',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'mid-term',
        subjects: [],
        createdBy: adminUser._id
      });
    });

    it('should update exam successfully', async () => {
      const updateData = {
        name: 'Updated Exam Name',
        examType: 'final'
      };

      const response = await request(app)
        .put(`/api/exams/${testExam._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.exam.name).toBe('Updated Exam Name');
      expect(response.body.data.exam.examType).toBe('final');
    });

    it('should fail to update exam without admin role', async () => {
      const response = await request(app)
        .put(`/api/exams/${testExam._id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent exam', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/exams/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/exams/:id', () => {
    let testExam: any;

    beforeEach(async () => {
      testExam = await Exam.create({
        name: 'Test Exam',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'mid-term',
        subjects: [],
        createdBy: adminUser._id
      });
    });

    it('should soft delete exam successfully', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // Verify exam is soft deleted
      const deletedExam = await Exam.findById(testExam._id);
      expect(deletedExam?.isActive).toBe(false);
    });

    it('should fail to delete exam without admin role', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam._id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/exams/:id/subjects', () => {
    let testExam: any;

    beforeEach(async () => {
      testExam = await Exam.create({
        name: 'Test Exam',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'mid-term',
        subjects: [],
        createdBy: adminUser._id
      });
    });

    const validSubjectData = {
      subject: 'Mathematics',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      syllabus: 'Chapters 1-5',
      maxMarks: 100,
      duration: 180,
      startTime: '09:00',
      endTime: '12:00'
    };

    it('should add subject to exam successfully', async () => {
      const response = await request(app)
        .post(`/api/exams/${testExam._id}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSubjectData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.exam.subjects).toHaveLength(1);
      expect(response.body.data.exam.subjects[0].subject).toBe('Mathematics');
    });

    it('should fail to add duplicate subject', async () => {
      // Add subject first
      await request(app)
        .post(`/api/exams/${testExam._id}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSubjectData);

      // Try to add same subject again
      const response = await request(app)
        .post(`/api/exams/${testExam._id}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSubjectData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should fail to add subject without admin role', async () => {
      const response = await request(app)
        .post(`/api/exams/${testExam._id}/subjects`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(validSubjectData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/exams/upcoming', () => {
    beforeEach(async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      await Exam.create({
        name: 'Upcoming Exam',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'mid-term',
        subjects: [
          {
            subject: 'Mathematics',
            date: futureDate,
            syllabus: 'Chapters 1-5',
            maxMarks: 100,
            duration: 180,
            startTime: '09:00',
            endTime: '12:00'
          }
        ],
        createdBy: adminUser._id
      });

      await Exam.create({
        name: 'Past Exam',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'unit-test',
        subjects: [
          {
            subject: 'Science',
            date: pastDate,
            syllabus: 'Chapters 1-2',
            maxMarks: 50,
            duration: 90,
            startTime: '10:00',
            endTime: '11:30'
          }
        ],
        createdBy: adminUser._id
      });
    });

    it('should get upcoming exams', async () => {
      const response = await request(app)
        .get('/api/exams/upcoming')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.exams).toHaveLength(1);
      expect(response.body.data.exams[0].name).toBe('Upcoming Exam');
    });

    it('should filter upcoming exams by class', async () => {
      const response = await request(app)
        .get('/api/exams/upcoming?classId=8-A')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exams).toHaveLength(1);
    });

    it('should filter upcoming exams by days', async () => {
      const response = await request(app)
        .get('/api/exams/upcoming?days=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exams).toHaveLength(0); // Exam is 7 days away
    });
  });

  describe('GET /api/exams/class/:classId', () => {
    beforeEach(async () => {
      await Exam.create({
        name: 'Class 8-A Exam',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'mid-term',
        subjects: [],
        createdBy: adminUser._id
      });

      await Exam.create({
        name: 'Class 8-B Exam',
        academicYear: '2023-2024',
        classId: '8-B',
        examType: 'mid-term',
        subjects: [],
        createdBy: adminUser._id
      });
    });

    it('should get exams by class', async () => {
      const response = await request(app)
        .get('/api/exams/class/8-A')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.exams).toHaveLength(1);
      expect(response.body.data.exams[0].classId).toBe('8-A');
    });

    it('should filter by academic year', async () => {
      const response = await request(app)
        .get('/api/exams/class/8-A?academicYear=2023-2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exams).toHaveLength(1);
    });

    it('should fail with invalid class ID', async () => {
      const response = await request(app)
        .get('/api/exams/class/invalid-class')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });
});