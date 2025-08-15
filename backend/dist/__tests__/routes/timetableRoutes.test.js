"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../../server"));
const Timetable_1 = require("../../models/Timetable");
const Teacher_1 = require("../../models/Teacher");
const User_1 = require("../../models/User");
const jwtUtils_1 = require("../../utils/jwtUtils");
// Mock the models
jest.mock('../../models/Timetable');
jest.mock('../../models/Teacher');
jest.mock('../../models/User');
const MockedTimetable = Timetable_1.Timetable;
const MockedTeacher = Teacher_1.Teacher;
const MockedUser = User_1.User;
describe('Timetable Routes', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    beforeAll(() => {
        // Generate test tokens
        adminToken = jwtUtils_1.JWTUtils.generateAccessToken({ userId: 'admin123', email: 'admin@test.com', role: 'admin' });
        teacherToken = jwtUtils_1.JWTUtils.generateAccessToken({ userId: 'teacher123', email: 'teacher@test.com', role: 'teacher' });
        studentToken = jwtUtils_1.JWTUtils.generateAccessToken({ userId: 'student123', email: 'student@test.com', role: 'student' });
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/timetable', () => {
        const validTimetableData = {
            classId: '8-A',
            academicYear: '2023-2024',
            schedule: [
                {
                    day: 'monday',
                    periods: [
                        {
                            slot: 'A1',
                            subject: 'Mathematics',
                            teacherId: '507f1f77bcf86cd799439011',
                            startTime: '09:00',
                            endTime: '09:45'
                        }
                    ]
                }
            ]
        };
        it('should create timetable successfully with admin token', async () => {
            const mockTeacher = { _id: '507f1f77bcf86cd799439011', name: 'John Doe' };
            const mockSavedTimetable = {
                _id: '507f1f77bcf86cd799439013',
                ...validTimetableData
            };
            MockedTimetable.findOne.mockResolvedValue(null);
            MockedTeacher.find.mockResolvedValue([mockTeacher]);
            MockedTimetable.checkTeacherAvailability = jest.fn().mockResolvedValue(true);
            const mockTimetableInstance = {
                save: jest.fn().mockResolvedValue(mockSavedTimetable)
            };
            MockedTimetable.mockImplementation(() => mockTimetableInstance);
            MockedTimetable.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockSavedTimetable)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/timetable')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validTimetableData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Timetable created successfully');
            expect(response.body.data).toBeDefined();
        });
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/timetable')
                .send(validTimetableData);
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should reject request from non-admin user', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/timetable')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(validTimetableData);
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
        it('should validate request body', async () => {
            const invalidData = {
                classId: '8-A',
                // Missing required fields
            };
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/timetable')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
        it('should handle duplicate timetable error', async () => {
            const existingTimetable = { _id: '507f1f77bcf86cd799439013' };
            MockedTimetable.findOne.mockResolvedValue(existingTimetable);
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/timetable')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validTimetableData);
            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('TIMETABLE_EXISTS');
        });
    });
    describe('GET /api/timetable/class/:classId', () => {
        const classId = '8-A';
        it('should get timetable by class successfully', async () => {
            const mockTimetable = {
                _id: '507f1f77bcf86cd799439013',
                classId: '8-A',
                academicYear: '2023-2024',
                schedule: [{
                        day: 'monday',
                        periods: [{
                                slot: 'A1',
                                subject: 'Mathematics',
                                teacherId: { name: 'John Doe', employeeId: 'T001' }
                            }]
                    }]
            };
            MockedTimetable.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTimetable)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.classId).toBe('8-A');
        });
        it('should allow teacher access', async () => {
            const mockTimetable = {
                _id: '507f1f77bcf86cd799439013',
                classId: '8-A'
            };
            MockedTimetable.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTimetable)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}`)
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
        it('should allow student access', async () => {
            const mockTimetable = {
                _id: '507f1f77bcf86cd799439013',
                classId: '8-A'
            };
            MockedTimetable.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTimetable)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}`)
                .set('Authorization', `Bearer ${studentToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
        it('should validate class ID format', async () => {
            const invalidClassId = 'invalid-class';
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${invalidClassId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid class ID format');
        });
        it('should handle timetable not found', async () => {
            MockedTimetable.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('NOT_FOUND');
        });
        it('should handle academic year query parameter', async () => {
            const mockTimetable = {
                _id: '507f1f77bcf86cd799439013',
                classId: '8-A',
                academicYear: '2023-2024'
            };
            MockedTimetable.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTimetable)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}?academicYear=2023-2024`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
    describe('GET /api/timetable/teacher/:teacherId', () => {
        const teacherId = '507f1f77bcf86cd799439011';
        it('should get teacher schedule successfully', async () => {
            const mockTeacher = { _id: teacherId, name: 'John Doe', employeeId: 'T001' };
            const mockTimetables = [
                {
                    classId: '8-A',
                    academicYear: '2023-2024',
                    schedule: [{
                            day: 'monday',
                            periods: [{
                                    slot: 'A1',
                                    subject: 'Mathematics',
                                    teacherId: { _id: teacherId },
                                    startTime: '09:00',
                                    endTime: '09:45'
                                }]
                        }]
                }
            ];
            MockedTeacher.findById.mockResolvedValue(mockTeacher);
            MockedTimetable.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTimetables)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/teacher/${teacherId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.teacher.name).toBe('John Doe');
            expect(response.body.data.schedule).toBeDefined();
        });
        it('should allow teacher to access own schedule', async () => {
            const mockTeacher = { _id: teacherId, name: 'John Doe', employeeId: 'T001' };
            const mockTimetables = [];
            MockedTeacher.findById.mockResolvedValue(mockTeacher);
            MockedTimetable.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTimetables)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/teacher/${teacherId}`)
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
        it('should reject student access', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/teacher/${teacherId}`)
                .set('Authorization', `Bearer ${studentToken}`);
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
        it('should handle teacher not found', async () => {
            MockedTeacher.findById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/teacher/${teacherId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('TEACHER_NOT_FOUND');
        });
    });
    describe('GET /api/timetable', () => {
        it('should get all timetables with filters', async () => {
            const mockTimetables = [
                { _id: '1', classId: '8-A', academicYear: '2023-2024' },
                { _id: '2', classId: '9-B', academicYear: '2023-2024' }
            ];
            MockedTimetable.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockTimetables)
                    })
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/timetable?academicYear=2023-2024&isActive=true')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockTimetables);
        });
        it('should allow teacher access', async () => {
            const mockTimetables = [];
            MockedTimetable.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockTimetables)
                    })
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/timetable')
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
        it('should reject student access', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/timetable')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });
    describe('PUT /api/timetable/:id', () => {
        const timetableId = '507f1f77bcf86cd799439013';
        const updateData = {
            schedule: [{
                    day: 'monday',
                    periods: [{
                            slot: 'A1',
                            subject: 'Physics',
                            teacherId: '507f1f77bcf86cd799439011',
                            startTime: '09:00',
                            endTime: '09:45'
                        }]
                }]
        };
        it('should update timetable successfully', async () => {
            const mockTimetable = {
                _id: timetableId,
                classId: '8-A',
                academicYear: '2023-2024',
                save: jest.fn().mockResolvedValue({ _id: timetableId })
            };
            const mockTeacher = { _id: '507f1f77bcf86cd799439011', name: 'John Doe' };
            MockedTimetable.findById.mockResolvedValue(mockTimetable);
            MockedTeacher.find.mockResolvedValue([mockTeacher]);
            MockedTimetable.checkTeacherAvailability = jest.fn().mockResolvedValue(true);
            MockedTimetable.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue({ ...mockTimetable, ...updateData })
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .put(`/api/timetable/${timetableId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Timetable updated successfully');
        });
        it('should reject non-admin access', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .put(`/api/timetable/${timetableId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(updateData);
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
        it('should handle timetable not found', async () => {
            MockedTimetable.findById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.default)
                .put(`/api/timetable/${timetableId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('NOT_FOUND');
        });
    });
    describe('DELETE /api/timetable/:id', () => {
        const timetableId = '507f1f77bcf86cd799439013';
        it('should deactivate timetable successfully', async () => {
            const mockTimetable = {
                _id: timetableId,
                isActive: true,
                save: jest.fn().mockResolvedValue({ _id: timetableId, isActive: false })
            };
            MockedTimetable.findById.mockResolvedValue(mockTimetable);
            const response = await (0, supertest_1.default)(server_1.default)
                .delete(`/api/timetable/${timetableId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Timetable deactivated successfully');
        });
        it('should reject non-admin access', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .delete(`/api/timetable/${timetableId}`)
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
        it('should handle timetable not found', async () => {
            MockedTimetable.findById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.default)
                .delete(`/api/timetable/${timetableId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('NOT_FOUND');
        });
    });
    describe('GET /api/timetable/class/:classId/available-slots/:day', () => {
        const classId = '8-A';
        const day = 'monday';
        it('should get available slots successfully', async () => {
            const mockTimetable = {
                schedule: [{
                        day: 'monday',
                        periods: [
                            { slot: 'A1' },
                            { slot: 'B1' }
                        ]
                    }]
            };
            MockedTimetable.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTimetable)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}/available-slots/${day}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.availableSlots).toBeDefined();
            expect(response.body.data.occupiedSlots).toBeDefined();
        });
        it('should validate class ID format', async () => {
            const invalidClassId = 'invalid-class';
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${invalidClassId}/available-slots/${day}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid class ID format');
        });
        it('should validate day parameter', async () => {
            const invalidDay = 'sunday';
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}/available-slots/${invalidDay}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid day');
        });
        it('should allow teacher access', async () => {
            MockedTimetable.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null)
                })
            });
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}/available-slots/${day}`)
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
        it('should reject student access', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/timetable/class/${classId}/available-slots/${day}`)
                .set('Authorization', `Bearer ${studentToken}`);
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });
});
//# sourceMappingURL=timetableRoutes.test.js.map