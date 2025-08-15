"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const server_1 = __importDefault(require("../../server"));
const User_1 = require("../../models/User");
const Student_1 = require("../../models/Student");
const Exam_1 = require("../../models/Exam");
const jwtUtils_1 = require("../../utils/jwtUtils");
describe('Report Controller Integration Tests', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let adminUser;
    let teacherUser;
    let studentUser;
    let testStudent;
    let testExam;
    beforeAll(async () => {
        // Create admin user
        adminUser = await User_1.User.create({
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
        // Create teacher user
        teacherUser = await User_1.User.create({
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
        // Create student user
        studentUser = await User_1.User.create({
            email: 'student@test.com',
            password: 'hashedPassword123',
            role: 'student',
            profile: {
                name: 'Test Student',
                rollNo: 'TEST001',
                standard: '8',
                section: 'A',
                dateOfBirth: new Date('2010-01-01'),
                admissionDate: new Date('2023-04-01'),
                parentContact: {
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    phone: '9876543210',
                    email: 'parent@test.com',
                    address: '123 Test Street, Test City'
                }
            }
        });
        adminToken = jwtUtils_1.JWTUtils.generateAccessToken({
            userId: adminUser.id,
            email: adminUser.email,
            role: adminUser.role
        });
        teacherToken = jwtUtils_1.JWTUtils.generateAccessToken({
            userId: teacherUser.id,
            email: teacherUser.email,
            role: teacherUser.role
        });
        studentToken = jwtUtils_1.JWTUtils.generateAccessToken({
            userId: studentUser.id,
            email: studentUser.email,
            role: studentUser.role
        });
        // Create test student
        testStudent = await Student_1.Student.create({
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
            status: 'active',
            userId: studentUser._id
        });
        // Create test exam with published results
        testExam = await Exam_1.Exam.create({
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
            results: [
                {
                    studentId: testStudent._id,
                    marks: [
                        {
                            subject: 'Mathematics',
                            marksObtained: 85,
                            grade: 'A',
                            remarks: 'Good performance'
                        },
                        {
                            subject: 'Science',
                            marksObtained: 92,
                            grade: 'A+',
                            remarks: 'Excellent work'
                        }
                    ],
                    totalMarks: 177,
                    percentage: 89,
                    overallGrade: 'A',
                    rank: 1
                }
            ],
            isResultPublished: true,
            createdBy: adminUser._id
        });
    });
    afterAll(async () => {
        await User_1.User.deleteMany({});
        await Student_1.Student.deleteMany({});
        await Exam_1.Exam.deleteMany({});
    });
    describe('GET /api/reports/student/:id', () => {
        it('should return student report card in JSON format', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/reports/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ academicYear: '2023-2024' })
                .expect(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.student.name).toBe('Test Student');
            expect(response.body.data.student.rollNo).toBe('TEST001');
            expect(response.body.data.student.class).toBe('8-A');
            expect(response.body.data.exams).toHaveLength(1);
            const exam = response.body.data.exams[0];
            expect(exam.examName).toBe('Mid Term Exam');
            expect(exam.totalMarks).toBe(177);
            expect(exam.percentage).toBe(89);
            expect(exam.overallGrade).toBe('A');
            expect(exam.rank).toBe(1);
            expect(exam.subjects).toHaveLength(2);
            // Check summary
            expect(response.body.data.summary.totalExams).toBe(1);
            expect(response.body.data.summary.averagePercentage).toBe(89);
            expect(response.body.data.summary.overallGrade).toBe('A');
        });
        it('should return student report card in PDF format', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/reports/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ academicYear: '2023-2024', format: 'pdf' })
                .expect(200);
            expect(response.headers['content-type']).toBe('application/pdf');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('report-card-TEST001-2023-2024.pdf');
            expect(Buffer.isBuffer(response.body)).toBe(true);
        });
        it('should return 404 for non-existent student', async () => {
            const fakeStudentId = new mongoose_1.default.Types.ObjectId();
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/reports/student/${fakeStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Student not found');
        });
        it('should return 404 when no published results found', async () => {
            // Create student without any exam results
            const studentWithoutResults = await Student_1.Student.create({
                rollNo: 'TEST002',
                name: 'Student Without Results',
                dateOfBirth: new Date('2010-01-01'),
                admissionDate: new Date('2023-04-01'),
                standard: '8',
                section: 'B',
                parentContact: {
                    fatherName: 'Test Father 2',
                    motherName: 'Test Mother 2',
                    phone: '9876543211',
                    email: 'parent2@test.com',
                    address: '124 Test Street, Test City'
                },
                status: 'active'
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/reports/student/${studentWithoutResults._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('No published results found for this student');
            await Student_1.Student.findByIdAndDelete(studentWithoutResults._id);
        });
        it('should allow teacher to access report', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/reports/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .query({ academicYear: '2023-2024' })
                .expect(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.student.name).toBe('Test Student');
        });
        it('should allow student to access own report', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/reports/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .query({ academicYear: '2023-2024' })
                .expect(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.student.name).toBe('Test Student');
        });
        it('should validate student ID format', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/student/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
        });
        it('should validate academic year format', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/reports/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ academicYear: 'invalid-year' })
                .expect(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
        });
        it('should validate format parameter', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/reports/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ format: 'invalid-format' })
                .expect(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
        });
    });
    describe('GET /api/reports/class-performance', () => {
        it('should return class performance report for admin', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                examType: 'mid-term',
                academicYear: '2023-2024'
            })
                .expect(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.classId).toBe('8-A');
            expect(response.body.data.examType).toBe('mid-term');
            expect(response.body.data.academicYear).toBe('2023-2024');
            expect(response.body.data.performance).toBeDefined();
            expect(response.body.data.performance.totalStudents).toBe(1);
            expect(response.body.data.performance.averagePercentage).toBe(89);
            expect(response.body.data.performance.highestScore).toBe(89);
            expect(response.body.data.performance.lowestScore).toBe(89);
        });
        it('should return class performance report for teacher', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${teacherToken}`)
                .query({
                classId: '8-A',
                examType: 'mid-term',
                academicYear: '2023-2024'
            })
                .expect(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.performance).toBeDefined();
        });
        it('should reject access for student role', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${studentToken}`)
                .query({
                classId: '8-A',
                examType: 'mid-term',
                academicYear: '2023-2024'
            })
                .expect(403);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Insufficient permissions');
        });
        it('should return 404 for non-existent class performance', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '9-Z',
                examType: 'final',
                academicYear: '2022-2023'
            })
                .expect(404);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('No published results found for the specified criteria');
        });
        it('should validate required query parameters', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A'
                // Missing examType and academicYear
            })
                .expect(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('classId, examType, and academicYear are required');
        });
        it('should validate classId format', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: 'invalid-class',
                examType: 'mid-term',
                academicYear: '2023-2024'
            })
                .expect(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
        });
        it('should validate examType', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                examType: 'invalid-type',
                academicYear: '2023-2024'
            })
                .expect(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
        });
        it('should validate academicYear format', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                examType: 'mid-term',
                academicYear: 'invalid-year'
            })
                .expect(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed');
        });
    });
});
//# sourceMappingURL=reportController.integration.test.js.map