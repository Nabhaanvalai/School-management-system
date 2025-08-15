import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Payment } from '../../models/Payment';
import { Student } from '../../models/Student';
import { Teacher } from '../../models/Teacher';
import { User } from '../../models/User';
import paymentRoutes from '../../routes/paymentRoutes';
import { JWTUtils } from '../../utils/jwtUtils';

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

describe('Payment Controller', () => {
  let mongoServer: MongoMemoryServer;
  let adminUser: any;
  let teacherUser: any;
  let studentUser: any;
  let testStudent: any;
  let testTeacher: any;
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

    studentUser = await User.create({
      email: 'student@test.com',
      password: 'hashedPassword',
      role: 'student',
      profile: {
        name: 'Student User',
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
        fatherName: 'Father Name',
        motherName: 'Mother Name',
        phone: '9876543210',
        email: 'parent@test.com',
        address: 'Test Address'
      },
      userId: studentUser._id
    });

    // Create test teacher
    testTeacher = await Teacher.create({
      employeeId: 'TCH001',
      name: 'Test Teacher',
      subjects: ['Mathematics', 'Physics'],
      assignedClasses: [{
        standard: '8',
        section: 'A',
        subject: 'Mathematics'
      }],
      salary: {
        amount: 50000,
        status: 'unpaid'
      },
      userId: teacherUser._id
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

  beforeEach(async () => {
    await Payment.deleteMany({});
  });

  describe('POST /api/payments', () => {
    const validStudentFeeData = {
      paymentType: 'student-fee',
      studentId: null, // Will be set in test
      amount: 5000,
      dueDate: '2024-06-01',
      feeCategory: 'tuition',
      academicYear: '2023-2024',
      description: 'Tuition fee for June 2024'
    };

    const validTeacherSalaryData = {
      paymentType: 'teacher-salary',
      teacherId: null, // Will be set in test
      amount: 50000,
      dueDate: '2024-06-01',
      month: 'June',
      year: 2024,
      academicYear: '2023-2024',
      description: 'Salary for June 2024'
    };

    it('should create a student fee payment successfully (admin)', async () => {
      const paymentData = { ...validStudentFeeData, studentId: testStudent._id };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentType).toBe('student-fee');
      expect(response.body.data.amount).toBe(5000);
    });

    it('should create a teacher salary payment successfully (admin)', async () => {
      const paymentData = { ...validTeacherSalaryData, teacherId: testTeacher._id };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentType).toBe('teacher-salary');
      expect(response.body.data.amount).toBe(50000);
    });

    it('should reject payment creation for non-admin users', async () => {
      const paymentData = { ...validStudentFeeData, studentId: testStudent._id };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(paymentData);

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const invalidData = { ...validStudentFeeData };
      delete invalidData.amount;

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate student existence for student fees', async () => {
      const paymentData = {
        ...validStudentFeeData,
        studentId: new mongoose.Types.ObjectId()
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Student not found');
    });
  });

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      await Payment.create([
        {
          paymentType: 'student-fee',
          studentId: testStudent._id,
          amount: 5000,
          dueDate: new Date('2024-06-01'),
          feeCategory: 'tuition',
          academicYear: '2023-2024',
          description: 'Tuition fee',
          createdBy: adminUser._id
        },
        {
          paymentType: 'teacher-salary',
          teacherId: testTeacher._id,
          amount: 50000,
          dueDate: new Date('2024-06-01'),
          month: 'June',
          year: 2024,
          academicYear: '2023-2024',
          description: 'Teacher salary',
          createdBy: adminUser._id
        }
      ]);
    });

    it('should get all payment records', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter payments by type', async () => {
      const response = await request(app)
        .get('/api/payments?paymentType=student-fee')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].paymentType).toBe('student-fee');
    });

    it('should filter payments by student', async () => {
      const response = await request(app)
        .get(`/api/payments?studentId=${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].studentId._id).toBe(testStudent._id.toString());
    });
  });

  describe('PUT /api/payments/:id/status', () => {
    let paymentId: string;

    beforeEach(async () => {
      const payment = await Payment.create({
        paymentType: 'student-fee',
        studentId: testStudent._id,
        amount: 5000,
        dueDate: new Date('2024-06-01'),
        feeCategory: 'tuition',
        academicYear: '2023-2024',
        description: 'Tuition fee',
        createdBy: adminUser._id
      });
      paymentId = payment._id.toString();
    });

    it('should mark payment as paid successfully (admin)', async () => {
      const updateData = {
        status: 'paid',
        paymentMethod: 'cash',
        transactionId: 'TXN123456'
      };

      const response = await request(app)
        .put(`/api/payments/${paymentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paid');
      expect(response.body.data.paymentMethod).toBe('cash');
      expect(response.body.data.receiptNumber).toBeDefined();
    });

    it('should require payment method when marking as paid', async () => {
      const updateData = {
        status: 'paid'
        // Missing paymentMethod
      };

      const response = await request(app)
        .put(`/api/payments/${paymentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Payment method is required when marking as paid');
    });

    it('should reject status update for non-admin users', async () => {
      const response = await request(app)
        .put(`/api/payments/${paymentId}/status`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'paid', paymentMethod: 'cash' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/payments/student/:studentId', () => {
    beforeEach(async () => {
      await Payment.create([
        {
          paymentType: 'student-fee',
          studentId: testStudent._id,
          amount: 5000,
          dueDate: new Date('2024-05-01'),
          feeCategory: 'tuition',
          academicYear: '2023-2024',
          description: 'May tuition fee',
          createdBy: adminUser._id
        },
        {
          paymentType: 'student-fee',
          studentId: testStudent._id,
          amount: 5000,
          dueDate: new Date('2024-06-01'),
          feeCategory: 'tuition',
          academicYear: '2023-2024',
          description: 'June tuition fee',
          status: 'paid',
          paymentMethod: 'cash',
          paidDate: new Date(),
          createdBy: adminUser._id
        }
      ]);
    });

    it('should get student payment history', async () => {
      const response = await request(app)
        .get(`/api/payments/student/${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.student.name).toBe('Test Student');
      expect(response.body.data.payments).toHaveLength(2);
    });

    it('should filter student payments by status', async () => {
      const response = await request(app)
        .get(`/api/payments/student/${testStudent._id}?status=paid`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payments).toHaveLength(1);
      expect(response.body.data.payments[0].status).toBe('paid');
    });

    it('should return 404 for non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/payments/student/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Student not found');
    });
  });

  describe('GET /api/payments/teacher/:teacherId', () => {
    beforeEach(async () => {
      await Payment.create([
        {
          paymentType: 'teacher-salary',
          teacherId: testTeacher._id,
          amount: 50000,
          dueDate: new Date('2024-05-01'),
          month: 'May',
          year: 2024,
          academicYear: '2023-2024',
          description: 'May salary',
          createdBy: adminUser._id
        },
        {
          paymentType: 'teacher-salary',
          teacherId: testTeacher._id,
          amount: 50000,
          dueDate: new Date('2024-06-01'),
          month: 'June',
          year: 2024,
          academicYear: '2023-2024',
          description: 'June salary',
          status: 'paid',
          paymentMethod: 'bank-transfer',
          paidDate: new Date(),
          createdBy: adminUser._id
        }
      ]);
    });

    it('should get teacher payment history', async () => {
      const response = await request(app)
        .get(`/api/payments/teacher/${testTeacher._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.teacher.name).toBe('Test Teacher');
      expect(response.body.data.payments).toHaveLength(2);
    });

    it('should filter teacher payments by year', async () => {
      const response = await request(app)
        .get(`/api/payments/teacher/${testTeacher._id}?year=2024`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payments).toHaveLength(2);
    });
  });

  describe('GET /api/payments/overdue', () => {
    beforeEach(async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

      await Payment.create([
        {
          paymentType: 'student-fee',
          studentId: testStudent._id,
          amount: 5000,
          dueDate: pastDate,
          feeCategory: 'tuition',
          academicYear: '2023-2024',
          description: 'Overdue tuition fee',
          status: 'pending',
          createdBy: adminUser._id
        },
        {
          paymentType: 'student-fee',
          studentId: testStudent._id,
          amount: 3000,
          dueDate: new Date(),
          feeCategory: 'exam',
          academicYear: '2023-2024',
          description: 'Current exam fee',
          status: 'pending',
          createdBy: adminUser._id
        }
      ]);
    });

    it('should get overdue payments (admin only)', async () => {
      const response = await request(app)
        .get('/api/payments/overdue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toBe('Overdue tuition fee');
    });

    it('should reject overdue payments request for non-admin users', async () => {
      const response = await request(app)
        .get('/api/payments/overdue')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/payments/summary', () => {
    beforeEach(async () => {
      await Payment.create([
        {
          paymentType: 'student-fee',
          studentId: testStudent._id,
          amount: 5000,
          dueDate: new Date('2024-06-01'),
          feeCategory: 'tuition',
          academicYear: '2023-2024',
          description: 'Tuition fee',
          status: 'pending',
          createdBy: adminUser._id
        },
        {
          paymentType: 'student-fee',
          studentId: testStudent._id,
          amount: 3000,
          dueDate: new Date('2024-06-01'),
          feeCategory: 'exam',
          academicYear: '2023-2024',
          description: 'Exam fee',
          status: 'paid',
          paymentMethod: 'cash',
          paidDate: new Date(),
          createdBy: adminUser._id
        }
      ]);
    });

    it('should get payment summary (admin only)', async () => {
      const response = await request(app)
        .get('/api/payments/summary?paymentType=student-fee')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pending.count).toBe(1);
      expect(response.body.data.paid.count).toBe(1);
      expect(response.body.data.total.count).toBe(2);
      expect(response.body.data.total.amount).toBe(8000);
    });

    it('should require payment type for summary', async () => {
      const response = await request(app)
        .get('/api/payments/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Payment type is required for summary');
    });
  });
});