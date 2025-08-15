"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../server");
const Student_1 = require("../../models/Student");
const Attendance_1 = require("../../models/Attendance");
const Exam_1 = require("../../models/Exam");
const Teacher_1 = require("../../models/Teacher");
const User_1 = require("../../models/User");
const jwtUtils_1 = require("../../utils/jwtUtils");
describe('Comprehensive Reporting System', () => {
    let adminToken;
    let teacherToken;
    let adminUser;
    let teacherUser;
    let testStudents = [];
    let testTeacher;
    let testExam;
    beforeAll(async () => {
        // Create admin user
        adminUser = await User_1.User.create({
            email: 'admin@test.com',
            password: 'hashedPassword',
            role: 'admin'
        });
        adminToken = (0, jwtUtils_1.generateToken)(adminUser._id, adminUser.role);
        // Create teacher user
        teacherUser = await User_1.User.create({
            email: 'teacher@test.com',
            password: 'hashedPassword',
            role: 'teacher'
        });
        teacherToken = (0, jwtUtils_1.generateToken)(teacherUser._id, teacherUser.role);
        // Create test teacher
        testTeacher = await Teacher_1.Teacher.create({
            employeeId: 'T001',
            name: 'Test Teacher',
            subjects: ['Mathematics', 'Science'],
            assignedClasses: [
                { standard: '8', section: 'A', subject: 'Mathematics' }
            ],
            salary: {
                amount: 50000,
                status: 'paid'
            },
            userId: teacherUser._id
        });
        // Create test students
        const studentData = [
            {
                rollNo: 'R001',
                name: 'Student One',
                dateOfBirth: new Date('2010-01-01'),
                admissionDate: new Date('2023-04-01'),
                standard: '8',
                section: 'A',
                parentContact: {
                    fatherName: 'Father One',
                    motherName: 'Mother One',
                    phone: '1234567890',
                    email: 'parent1@test.com',
                    address: 'Test Address 1'
                },
                status: 'active'
            },
            {
                rollNo: 'R002',
                name: 'Student Two',
                dateOfBirth: new Date('2010-02-01'),
                admissionDate: new Date('2023-04-01'),
                standard: '8',
                section: 'A',
                parentContact: {
                    fatherName: 'Father Two',
                    motherName: 'Mother Two',
                    phone: '1234567891',
                    email: 'parent2@test.com',
                    address: 'Test Address 2'
                },
                status: 'active'
            },
            {
                rollNo: 'R003',
                name: 'Student Three',
                dateOfBirth: new Date('2010-03-01'),
                admissionDate: new Date('2023-04-01'),
                standard: '8',
                section: 'B',
                parentContact: {
                    fatherName: 'Father Three',
                    motherName: 'Mother Three',
                    phone: '1234567892',
                    email: 'parent3@test.com',
                    address: 'Test Address 3'
                },
                status: 'active'
            }
        ];
        for (const data of studentData) {
            const student = await Student_1.Student.create(data);
            testStudents.push(student);
        }
        // Create test exam with results
        testExam = await Exam_1.Exam.create({
            name: 'Mid Term Exam',
            examType: 'mid-term',
            academicYear: '2023-2024',
            subjects: [
                {
                    subject: 'Mathematics',
                    date: new Date('2023-10-15'),
                    syllabus: 'Chapters 1-5',
                    maxMarks: 100
                },
                {
                    subject: 'Science',
                    date: new Date('2023-10-16'),
                    syllabus: 'Chapters 1-3',
                    maxMarks: 100
                }
            ],
            results: [
                {
                    studentId: testStudents[0]._id,
                    marks: [
                        { subject: 'Mathematics', marksObtained: 85, grade: 'A' },
                        { subject: 'Science', marksObtained: 78, grade: 'B+' }
                    ],
                    totalMarks: 163,
                    percentage: 81.5,
                    overallGrade: 'A',
                    rank: 1
                },
                {
                    studentId: testStudents[1]._id,
                    marks: [
                        { subject: 'Mathematics', marksObtained: 72, grade: 'B+' },
                        { subject: 'Science', marksObtained: 68, grade: 'B' }
                    ],
                    totalMarks: 140,
                    percentage: 70,
                    overallGrade: 'B+',
                    rank: 2
                }
            ],
            isResultPublished: true,
            isActive: true
        });
        // Create attendance records
        const attendanceData = [
            {
                studentId: testStudents[0]._id,
                teacherId: testTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date('2023-10-01'),
                status: 'present',
                academicYear: '2023-2024'
            },
            {
                studentId: testStudents[0]._id,
                teacherId: testTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date('2023-10-02'),
                status: 'absent',
                academicYear: '2023-2024'
            },
            {
                studentId: testStudents[1]._id,
                teacherId: testTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date('2023-10-01'),
                status: 'present',
                academicYear: '2023-2024'
            },
            {
                studentId: testStudents[1]._id,
                teacherId: testTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date('2023-10-02'),
                status: 'late',
                academicYear: '2023-2024'
            }
        ];
        for (const data of attendanceData) {
            await Attendance_1.Attendance.create(data);
        }
    });
    afterAll(async () => {
        // Clean up test data
        await User_1.User.deleteMany({});
        await Student_1.Student.deleteMany({});
        await Teacher_1.Teacher.deleteMany({});
        await Exam_1.Exam.deleteMany({});
        await Attendance_1.Attendance.deleteMany({});
    });
    describe('GET /api/reports/class-performance', () => {
        it('should return class performance analytics for admin', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('classInfo');
            expect(response.body.data).toHaveProperty('academicPerformance');
            expect(response.body.data).toHaveProperty('attendanceMetrics');
            expect(response.body.data.classInfo.classId).toBe('8-A');
            expect(response.body.data.classInfo.totalStudents).toBe(2);
        });
        it('should return class performance analytics for teacher', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${teacherToken}`)
                .query({
                classId: '8-A',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        });
        it('should return 400 for missing required parameters', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A'
                // Missing academicYear
            });
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });
        it('should return 404 for class with no students', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '9-A',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(404);
            expect(response.body.status).toBe('error');
        });
        it('should support PDF format export', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                academicYear: '2023-2024',
                format: 'pdf'
            });
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });
        it('should support Excel format export', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                academicYear: '2023-2024',
                format: 'excel'
            });
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });
    });
    describe('GET /api/reports/student-count', () => {
        it('should return student enrollment statistics for admin', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/student-count')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data).toHaveProperty('byStandard');
            expect(response.body.data).toHaveProperty('byClass');
            expect(response.body.data.summary.totalStudents).toBe(3);
            expect(response.body.data.summary.totalClasses).toBe(2);
        });
        it('should deny access to non-admin users', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/student-count')
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(response.status).toBe(403);
        });
        it('should support PDF format export', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/student-count')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ format: 'pdf' });
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });
        it('should support Excel format export', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/student-count')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ format: 'excel' });
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });
        it('should filter by academic year when provided', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/student-count')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ academicYear: '2023-2024' });
            expect(response.status).toBe(200);
            expect(response.body.data.summary.academicYear).toBe('2023-2024');
        });
    });
    describe('GET /api/reports/attendance-summary', () => {
        it('should return attendance analytics for admin', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('parameters');
            expect(response.body.data).toHaveProperty('overallStatistics');
            expect(response.body.data).toHaveProperty('subjectWiseStatistics');
            expect(response.body.data).toHaveProperty('dailyTrends');
            expect(response.body.data.overallStatistics.totalRecords).toBe(4);
        });
        it('should return attendance analytics for teacher', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${teacherToken}`)
                .query({
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        });
        it('should filter by class when provided', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(200);
            expect(response.body.data.parameters.classId).toBe('8-A');
        });
        it('should filter by subject when provided', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                subject: 'Mathematics',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(200);
            expect(response.body.data.parameters.subject).toBe('Mathematics');
        });
        it('should support date range filtering', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                startDate: '2023-10-01',
                endDate: '2023-10-02',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(200);
            expect(response.body.data.overallStatistics.totalRecords).toBe(4);
        });
        it('should support PDF format export', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                academicYear: '2023-2024',
                format: 'pdf'
            });
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });
        it('should support Excel format export', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                academicYear: '2023-2024',
                format: 'excel'
            });
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });
        it('should include low attendance students in response', async () => {
            // Create a student with low attendance
            const lowAttendanceStudent = await Student_1.Student.create({
                rollNo: 'R004',
                name: 'Low Attendance Student',
                dateOfBirth: new Date('2010-04-01'),
                admissionDate: new Date('2023-04-01'),
                standard: '8',
                section: 'A',
                parentContact: {
                    fatherName: 'Father Four',
                    motherName: 'Mother Four',
                    phone: '1234567893',
                    email: 'parent4@test.com',
                    address: 'Test Address 4'
                },
                status: 'active'
            });
            // Create attendance records with mostly absent
            await Attendance_1.Attendance.create({
                studentId: lowAttendanceStudent._id,
                teacherId: testTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date('2023-10-03'),
                status: 'absent',
                academicYear: '2023-2024'
            });
            await Attendance_1.Attendance.create({
                studentId: lowAttendanceStudent._id,
                teacherId: testTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date('2023-10-04'),
                status: 'absent',
                academicYear: '2023-2024'
            });
            await Attendance_1.Attendance.create({
                studentId: lowAttendanceStudent._id,
                teacherId: testTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date('2023-10-05'),
                status: 'absent',
                academicYear: '2023-2024'
            });
            await Attendance_1.Attendance.create({
                studentId: lowAttendanceStudent._id,
                teacherId: testTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date('2023-10-06'),
                status: 'present',
                academicYear: '2023-2024'
            });
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(200);
            expect(response.body.data.lowAttendanceStudents).toBeDefined();
            expect(response.body.data.lowAttendanceStudents.length).toBeGreaterThan(0);
            // Clean up
            await Student_1.Student.findByIdAndDelete(lowAttendanceStudent._id);
        });
    });
    describe('Authentication and Authorization', () => {
        it('should deny access without authentication token', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .query({
                classId: '8-A',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(401);
        });
        it('should deny student-count access to non-admin users', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/student-count')
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(response.status).toBe(403);
        });
    });
    describe('Input Validation', () => {
        it('should validate class ID format', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: 'invalid-format',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation failed');
        });
        it('should validate academic year format', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                academicYear: 'invalid-year'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation failed');
        });
        it('should validate date format in attendance summary', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/attendance-summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                startDate: 'invalid-date',
                academicYear: '2023-2024'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation failed');
        });
        it('should validate format parameter', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/reports/class-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                classId: '8-A',
                academicYear: '2023-2024',
                format: 'invalid-format'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation failed');
        });
    });
});
//# sourceMappingURL=reportController.comprehensive.test.js.map