"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../../server"));
const Student_1 = require("../../models/Student");
const User_1 = require("../../models/User");
const jwtUtils_1 = require("../../utils/jwtUtils");
describe('Student Routes', () => {
    let adminToken;
    let teacherToken;
    let testStudentId;
    beforeAll(async () => {
        // Create test admin user
        const adminUser = new User_1.User({
            email: 'admin@test.com',
            password: 'hashedPassword123',
            role: 'admin',
            profile: {
                name: 'Test Admin',
                phone: '1234567890',
                address: 'Test Address'
            },
            isActive: true
        });
        await adminUser.save();
        // Create test teacher user
        const teacherUser = new User_1.User({
            email: 'teacher@test.com',
            password: 'hashedPassword123',
            role: 'teacher',
            profile: {
                name: 'Test Teacher',
                phone: '1234567890',
                address: 'Test Address'
            },
            isActive: true
        });
        await teacherUser.save();
        // Generate tokens
        const adminTokens = jwtUtils_1.JWTUtils.generateTokenPair(adminUser._id.toString(), adminUser.email, 'admin', Date.now());
        const teacherTokens = jwtUtils_1.JWTUtils.generateTokenPair(teacherUser._id.toString(), teacherUser.email, 'teacher', Date.now());
        adminToken = adminTokens.accessToken;
        teacherToken = teacherTokens.accessToken;
    });
    afterAll(async () => {
        // Clean up test data
        await Student_1.Student.deleteMany({});
        await User_1.User.deleteMany({});
    });
    describe('POST /api/students', () => {
        it('should create a new student with admin token', async () => {
            const studentData = {
                rollNo: 'TEST001',
                name: 'Test Student',
                dateOfBirth: '2010-01-01',
                admissionDate: '2020-04-01',
                standard: '5',
                section: 'A',
                parentContact: {
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    phone: '1234567890',
                    email: 'parent@test.com',
                    address: '123 Test Street, Test City'
                }
            };
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(studentData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.rollNo).toBe('TEST001');
            expect(response.body.data.name).toBe('Test Student');
            testStudentId = response.body.data._id;
        });
        it('should fail to create student without admin token', async () => {
            const studentData = {
                rollNo: 'TEST002',
                name: 'Test Student 2',
                dateOfBirth: '2010-01-01',
                admissionDate: '2020-04-01',
                standard: '5',
                section: 'A',
                parentContact: {
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    phone: '1234567890',
                    email: 'parent@test.com',
                    address: '123 Test Street, Test City'
                }
            };
            await (0, supertest_1.default)(server_1.default)
                .post('/api/students')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(studentData)
                .expect(403);
        });
    });
    describe('GET /api/students', () => {
        it('should get students with admin token', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toBeInstanceOf(Array);
            expect(response.body.data.pagination).toBeDefined();
        });
        it('should get students with teacher token', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/students')
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toBeInstanceOf(Array);
        });
        it('should filter students by standard and section', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/students?standard=5&section=A')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toBeInstanceOf(Array);
        });
    });
    describe('GET /api/students/:id', () => {
        it('should get student by ID with admin token', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/students/${testStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(testStudentId);
            expect(response.body.data.rollNo).toBe('TEST001');
        });
        it('should fail with invalid student ID', async () => {
            await (0, supertest_1.default)(server_1.default)
                .get('/api/students/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
    });
    describe('PUT /api/students/:id', () => {
        it('should update student with admin token', async () => {
            const updateData = {
                name: 'Updated Test Student'
            };
            const response = await (0, supertest_1.default)(server_1.default)
                .put(`/api/students/${testStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Test Student');
        });
        it('should fail to update student without admin token', async () => {
            const updateData = {
                name: 'Should Not Update'
            };
            await (0, supertest_1.default)(server_1.default)
                .put(`/api/students/${testStudentId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(updateData)
                .expect(403);
        });
    });
    describe('PUT /api/students/:id/transfer', () => {
        it('should transfer student to new class with admin token', async () => {
            const transferData = {
                standard: '6',
                section: 'B',
                rollNo: 'TEST001-TRANSFER'
            };
            const response = await (0, supertest_1.default)(server_1.default)
                .put(`/api/students/${testStudentId}/transfer`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(transferData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.standard).toBe('6');
            expect(response.body.data.section).toBe('B');
            expect(response.body.data.rollNo).toBe('TEST001-TRANSFER');
        });
        it('should fail transfer without required fields', async () => {
            const transferData = {
                standard: '7'
                // Missing section
            };
            await (0, supertest_1.default)(server_1.default)
                .put(`/api/students/${testStudentId}/transfer`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(transferData)
                .expect(400);
        });
    });
    describe('GET /api/students/count/by-class', () => {
        it('should get student count by class with admin token', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/students/count/by-class')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });
        it('should get student count by class with teacher token', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/students/count/by-class')
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });
    describe('GET /api/students/class/:standard/:section', () => {
        it('should get students by class with admin token', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/students/class/6/B')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });
    describe('DELETE /api/students/:id', () => {
        it('should archive student with admin token', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .delete(`/api/students/${testStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('left');
            expect(response.body.data.leavingDate).toBeDefined();
        });
        it('should fail to archive student without admin token', async () => {
            await (0, supertest_1.default)(server_1.default)
                .delete(`/api/students/${testStudentId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(403);
        });
    });
});
//# sourceMappingURL=studentRoutes.test.js.map