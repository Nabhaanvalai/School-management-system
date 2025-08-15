import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import { User } from '../../models/User';
import { Student } from '../../models/Student';
import { Exam } from '../../models/Exam';
import { JWTUtils } from '../../utils/jwtUtils';

describe('Exam Marks Integration Tests', () => {
  let adminToken: string;
  let adminUser: any;
  let testStudent: any;
  let testExam: any;

  beforeAll(async () => {
    // Create admin user
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedPassword123',
      role: 'admin',
      profile: {
        name: 'Test Admin',
        employeeId: 'ADM001',
        department: 'Administration',
        phone: '1234567890'
      }
    });

    adminToken = JWTUtils.generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    // Create test student
    testStudent = await Student.create({
      rollNo: 'TEST001',
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
        address: '123 Test Street, Test City'
      },
      status: 'active'
    });

    // Create test exam
    testExam = await Exam.create({
      name: 'Mid Term Exam',
      academicYear: '2023-2024',
      classId: '8-A',
      examType: 'mid-term',
      subjects: [
        {
          subject: 'Mathematics',
          date: new Date('2024-03-15'),
          syllabus: 'Chapters 1-5',
          maxMarks: 100,
          duration: 180,
          startTime: '09:00',
          endTime: '12:00'
        },
        {
          subject: 'Science',
          date: new Date('2024-03-16'),
          syllabus: 'Chapters 1-3',
          maxMarks: 100,
          duration: 180,
          startTime: '09:00',
          endTime: '12:00'
        }
      ],
      createdBy: adminUser._id
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Student.deleteMany({});
    await Exam.deleteMany({});
  });

  describe('POST /api/exams/:id/marks', () => {
    it('should successfully enter marks for students', async () => {
      const marksData = {
        studentMarks: [
          {
            studentId: testStudent._id.toString(),
            marks: [
              {
                subject: 'Mathematics',
                marksObtained: 85,
                remarks: 'Good performance'
              },
              {
                subject: 'Science',
                marksObtained: 92,
                remarks: 'Excellent work'
              }
            ]
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam._id}/marks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(marksData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Marks entered successfully');
      expect(response.body.data.exam.results).toHaveLength(1);

      const studentResult = response.body.data.exam.results[0];
      expect(studentResult.studentId._id).toBe(testStudent._id.toString());
      expect(studentResult.totalMarks).toBe(177);
      expect(studentResult.percentage).toBe(89); // (177/200) * 100 = 88.5, rounded to 89
      expect(studentResult.overallGrade).toBe('A');
      expect(studentResult.marks).toHaveLength(2);
    });

    it('should reject marks that exceed maximum marks for a subject', async () => {
      const marksData = {
        studentMarks: [
          {
            studentId: testStudent._id.toString(),
            marks: [
              {
                subject: 'Mathematics',
                marksObtained: 150, // Exceeds max marks of 100
                remarks: 'Invalid marks'
              }
            ]
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam._id}/marks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(marksData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('cannot exceed maximum marks');
    });

    it('should reject marks for non-existent subject', async () => {
      const marksData = {
        studentMarks: [
          {
            studentId: testStudent._id.toString(),
            marks: [
              {
                subject: 'History', // Not in exam subjects
                marksObtained: 85,
                remarks: 'Invalid subject'
              }
            ]
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam._id}/marks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(marksData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found in this exam');
    });

    it('should reject marks for non-existent student', async () => {
      const fakeStudentId = new mongoose.Types.ObjectId();
      const marksData = {
        studentMarks: [
          {
            studentId: fakeStudentId.toString(),
            marks: [
              {
                subject: 'Mathematics',
                marksObtained: 85,
                remarks: 'Invalid student'
              }
            ]
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam._id}/marks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(marksData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Student with ID');
      expect(response.body.message).toContain('not found');
    });

    it('should require admin role', async () => {
      // Create teacher user
      const teacherUser = await User.create({
        email: 'teacher@test.com',
        password: 'hashedPassword123',
        role: 'teacher',
        profile: {
          name: 'Test Teacher',
          employeeId: 'TCH001',
          subjects: ['Mathematics'],
          phone: '1234567891',
          address: '123 Teacher Street',
          dateOfJoining: new Date('2023-01-01')
        }
      });

      const teacherToken = JWTUtils.generateAccessToken({
        userId: teacherUser.id,
        email: teacherUser.email,
        role: teacherUser.role
      });

      const marksData = {
        studentMarks: [
          {
            studentId: testStudent._id.toString(),
            marks: [
              {
                subject: 'Mathematics',
                marksObtained: 85
              }
            ]
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam._id}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(marksData)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Insufficient permissions');

      await User.findByIdAndDelete(teacherUser._id);
    });

    it('should validate request body structure', async () => {
      const invalidData = {
        studentMarks: 'invalid' // Should be array
      };

      const response = await request(app)
        .post(`/api/exams/${testExam._id}/marks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/exams/:id/publish', () => {
    beforeEach(async () => {
      // Ensure exam has marks before publishing
      const marksData = {
        studentMarks: [
          {
            studentId: testStudent._id.toString(),
            marks: [
              {
                subject: 'Mathematics',
                marksObtained: 85
              },
              {
                subject: 'Science',
                marksObtained: 92
              }
            ]
          }
        ]
      };

      await request(app)
        .post(`/api/exams/${testExam._id}/marks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(marksData);
    });

    it('should successfully publish exam results', async () => {
      const response = await request(app)
        .post(`/api/exams/${testExam._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Results published successfully');
      expect(response.body.data.exam.isResultPublished).toBe(true);

      // Check that ranks are calculated
      const studentResult = response.body.data.exam.results[0];
      expect(studentResult.rank).toBe(1);
    });

    it('should reject publishing exam without marks', async () => {
      // Create exam without marks
      const emptyExam = await Exam.create({
        name: 'Empty Exam',
        academicYear: '2023-2024',
        classId: '8-B',
        examType: 'unit-test',
        subjects: [
          {
            subject: 'Mathematics',
            date: new Date('2024-04-15'),
            syllabus: 'Chapter 1',
            maxMarks: 50,
            duration: 90,
            startTime: '10:00',
            endTime: '11:30'
          }
        ],
        createdBy: adminUser._id
      });

      const response = await request(app)
        .post(`/api/exams/${emptyExam._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No marks entered for this exam');

      await Exam.findByIdAndDelete(emptyExam._id);
    });

    it('should require admin role', async () => {
      // Create teacher user
      const teacherUser = await User.create({
        email: 'teacher2@test.com',
        password: 'hashedPassword123',
        role: 'teacher',
        profile: {
          name: 'Test Teacher 2',
          employeeId: 'TCH002',
          subjects: ['Science'],
          phone: '1234567892',
          address: '124 Teacher Street',
          dateOfJoining: new Date('2023-01-01')
        }
      });

      const teacherToken = JWTUtils.generateAccessToken({
        userId: teacherUser.id,
        email: teacherUser.email,
        role: teacherUser.role
      });

      const response = await request(app)
        .post(`/api/exams/${testExam._id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Insufficient permissions');

      await User.findByIdAndDelete(teacherUser._id);
    });

    it('should handle non-existent exam', async () => {
      const fakeExamId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/exams/${fakeExamId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Exam not found');
    });
  });
});