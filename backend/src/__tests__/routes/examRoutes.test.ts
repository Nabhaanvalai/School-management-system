import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import { User } from '../../models/User';
import { Student } from '../../models/Student';
import { Exam } from '../../models/Exam';
import { JWTUtils } from '../../utils/jwtUtils';

describe('Exam Routes Integration Tests', () => {
  let adminToken: string;
  let teacherToken: string;
  let adminUser: any;
  let teacherUser: any;
  let testStudent: any;

  beforeAll(async () => {
    // Create test users
    adminUser = await User.create({
      email: 'admin@examtest.com',
      password: 'hashedPassword',
      role: 'admin',
      profile: {
        name: 'Test Admin',
        phone: '1234567890'
      }
    });

    teacherUser = await User.create({
      email: 'teacher@examtest.com',
      password: 'hashedPassword',
      role: 'teacher',
      profile: {
        name: 'Test Teacher',
        phone: '1234567891'
      }
    });

    // Create test student for class validation
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
      userId: adminUser._id
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
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Student.deleteMany({});
    await Exam.deleteMany({});
  });

  afterEach(async () => {
    await Exam.deleteMany({});
  });

  describe('Complete Exam Management Workflow', () => {
    it('should handle complete exam lifecycle', async () => {
      // Step 1: Create exam
      const examData = {
        name: 'Final Examination 2024',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'final',
        subjects: [
          {
            subject: 'Mathematics',
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            syllabus: 'Complete syllabus - Chapters 1-15',
            maxMarks: 100,
            duration: 180,
            startTime: '09:00',
            endTime: '12:00'
          },
          {
            subject: 'Science',
            date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
            syllabus: 'Physics, Chemistry, Biology - All chapters',
            maxMarks: 100,
            duration: 180,
            startTime: '09:00',
            endTime: '12:00'
          }
        ]
      };

      const createResponse = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.exam.subjects).toHaveLength(2);
      
      const examId = createResponse.body.data.exam.id;

      // Step 2: Get the created exam
      const getResponse = await request(app)
        .get(`/api/exams/${examId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.exam.name).toBe(examData.name);

      // Step 3: Add another subject
      const newSubject = {
        subject: 'English',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        syllabus: 'Grammar, Literature, Composition',
        maxMarks: 100,
        duration: 180,
        startTime: '09:00',
        endTime: '12:00'
      };

      const addSubjectResponse = await request(app)
        .post(`/api/exams/${examId}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSubject);

      expect(addSubjectResponse.status).toBe(200);
      expect(addSubjectResponse.body.data.exam.subjects).toHaveLength(3);

      // Step 4: Update exam details
      const updateData = {
        name: 'Final Examination 2024 - Updated'
      };

      const updateResponse = await request(app)
        .put(`/api/exams/${examId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.exam.name).toBe(updateData.name);

      // Step 5: Remove a subject
      const removeSubjectResponse = await request(app)
        .delete(`/api/exams/${examId}/subjects/English`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(removeSubjectResponse.status).toBe(200);
      expect(removeSubjectResponse.body.data.exam.subjects).toHaveLength(2);

      // Step 6: Get upcoming exams
      const upcomingResponse = await request(app)
        .get('/api/exams/upcoming?classId=8-A')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(upcomingResponse.status).toBe(200);
      expect(upcomingResponse.body.data.exams).toHaveLength(1);

      // Step 7: Get exams by class
      const classByResponse = await request(app)
        .get('/api/exams/class/8-A')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(classByResponse.status).toBe(200);
      expect(classByResponse.body.data.exams).toHaveLength(1);

      // Step 8: Soft delete exam
      const deleteResponse = await request(app)
        .delete(`/api/exams/${examId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);

      // Step 9: Verify exam is soft deleted (not returned in active exams)
      const afterDeleteResponse = await request(app)
        .get('/api/exams?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(afterDeleteResponse.status).toBe(200);
      expect(afterDeleteResponse.body.data.exams).toHaveLength(0);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should handle validation errors properly', async () => {
      const invalidExamData = {
        name: 'AB', // Too short
        academicYear: '2023', // Invalid format
        classId: '8-Z', // Invalid section
        examType: 'invalid-type', // Invalid exam type
        subjects: [
          {
            subject: 'M', // Too short
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
            syllabus: '',
            maxMarks: 0, // Invalid marks
            duration: 5, // Too short
            startTime: '25:00', // Invalid time
            endTime: '26:00' // Invalid time
          }
        ]
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidExamData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should handle time conflicts in subjects', async () => {
      const examWithTimeConflict = {
        name: 'Conflict Test Exam',
        academicYear: '2023-2024',
        classId: '8-A',
        examType: 'unit-test',
        subjects: [
          {
            subject: 'Mathematics',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            syllabus: 'Chapters 1-5',
            maxMarks: 100,
            duration: 180,
            startTime: '09:00',
            endTime: '12:00'
          },
          {
            subject: 'Science',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Same date
            syllabus: 'Chapters 1-3',
            maxMarks: 80,
            duration: 120,
            startTime: '10:00', // Overlaps with Math
            endTime: '12:00'
          }
        ]
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examWithTimeConflict);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Time conflict');
    });

    it('should prevent unauthorized access', async () => {
      // Test without token
      const noTokenResponse = await request(app)
        .post('/api/exams')
        .send({});

      expect(noTokenResponse.status).toBe(401);

      // Test with teacher token (should fail for admin-only routes)
      const teacherResponse = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(teacherResponse.status).toBe(403);
    });

    it('should handle non-existent resources', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      // Test getting non-existent exam
      const getResponse = await request(app)
        .get(`/api/exams/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);

      // Test updating non-existent exam
      const updateResponse = await request(app)
        .put(`/api/exams/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(updateResponse.status).toBe(404);

      // Test deleting non-existent exam
      const deleteResponse = await request(app)
        .delete(`/api/exams/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('Query and Filtering', () => {
    beforeEach(async () => {
      // Create multiple test exams
      const exams = [
        {
          name: 'Mid Term 2023',
          academicYear: '2023-2024',
          classId: '8-A',
          examType: 'mid-term',
          subjects: [],
          createdBy: adminUser._id
        },
        {
          name: 'Final 2023',
          academicYear: '2023-2024',
          classId: '8-A',
          examType: 'final',
          subjects: [],
          createdBy: adminUser._id
        },
        {
          name: 'Mid Term 2024',
          academicYear: '2024-2025',
          classId: '8-B',
          examType: 'mid-term',
          subjects: [],
          createdBy: adminUser._id
        }
      ];

      await Exam.insertMany(exams);
    });

    it('should filter exams by multiple criteria', async () => {
      // Filter by academic year and exam type
      const response = await request(app)
        .get('/api/exams?academicYear=2023-2024&examType=mid-term')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exams).toHaveLength(1);
      expect(response.body.data.exams[0].name).toBe('Mid Term 2023');
    });

    it('should handle pagination correctly', async () => {
      // Get first page
      const page1Response = await request(app)
        .get('/api/exams?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.data.exams).toHaveLength(2);
      expect(page1Response.body.data.pagination.currentPage).toBe(1);
      expect(page1Response.body.data.pagination.totalPages).toBe(2);
      expect(page1Response.body.data.pagination.hasNextPage).toBe(true);

      // Get second page
      const page2Response = await request(app)
        .get('/api/exams?page=2&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.data.exams).toHaveLength(1);
      expect(page2Response.body.data.pagination.currentPage).toBe(2);
      expect(page2Response.body.data.pagination.hasNextPage).toBe(false);
    });

    it('should filter by active status', async () => {
      // Soft delete one exam
      const examToDelete = await Exam.findOne({ name: 'Mid Term 2023' });
      await Exam.findByIdAndUpdate(examToDelete!._id, { isActive: false });

      // Get only active exams
      const activeResponse = await request(app)
        .get('/api/exams?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(activeResponse.status).toBe(200);
      expect(activeResponse.body.data.exams).toHaveLength(2);

      // Get only inactive exams
      const inactiveResponse = await request(app)
        .get('/api/exams?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(inactiveResponse.status).toBe(200);
      expect(inactiveResponse.body.data.exams).toHaveLength(1);
      expect(inactiveResponse.body.data.exams[0].name).toBe('Mid Term 2023');
    });
  });

  describe('Subject Management', () => {
    let testExam: any;

    beforeEach(async () => {
      testExam = await Exam.create({
        name: 'Subject Test Exam',
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

    it('should add multiple subjects successfully', async () => {
      const subjects = [
        {
          subject: 'Science',
          date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          syllabus: 'Chapters 1-3',
          maxMarks: 80,
          duration: 120,
          startTime: '10:00',
          endTime: '12:00'
        },
        {
          subject: 'English',
          date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
          syllabus: 'Grammar and Literature',
          maxMarks: 100,
          duration: 180,
          startTime: '09:00',
          endTime: '12:00'
        }
      ];

      for (const subject of subjects) {
        const response = await request(app)
          .post(`/api/exams/${testExam._id}/subjects`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(subject);

        expect(response.status).toBe(200);
      }

      // Verify all subjects were added
      const examResponse = await request(app)
        .get(`/api/exams/${testExam._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(examResponse.body.data.exam.subjects).toHaveLength(3);
    });

    it('should remove subjects successfully', async () => {
      // Remove the existing subject
      const response = await request(app)
        .delete(`/api/exams/${testExam._id}/subjects/Mathematics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exam.subjects).toHaveLength(0);
    });

    it('should prevent modification after results are published', async () => {
      // Publish results
      await Exam.findByIdAndUpdate(testExam._id, { isResultPublished: true });

      // Try to add subject
      const addResponse = await request(app)
        .post(`/api/exams/${testExam._id}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Science',
          date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          syllabus: 'Chapters 1-3',
          maxMarks: 80,
          duration: 120,
          startTime: '10:00',
          endTime: '12:00'
        });

      expect(addResponse.status).toBe(400);
      expect(addResponse.body.message).toContain('results are published');

      // Try to remove subject
      const removeResponse = await request(app)
        .delete(`/api/exams/${testExam._id}/subjects/Mathematics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(removeResponse.status).toBe(400);
      expect(removeResponse.body.message).toContain('results are published');
    });
  });
});