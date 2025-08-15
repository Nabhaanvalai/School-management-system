"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const AcademicCalendar_1 = require("../../models/AcademicCalendar");
const User_1 = require("../../models/User");
const calendarRoutes_1 = __importDefault(require("../../routes/calendarRoutes"));
const jwtUtils_1 = require("../../utils/jwtUtils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/calendar', calendarRoutes_1.default);
describe('Calendar Controller', () => {
    let mongoServer;
    let adminUser;
    let teacherUser;
    let adminToken;
    let teacherToken;
    beforeAll(async () => {
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose_1.default.connect(mongoUri);
        // Create test users
        adminUser = await User_1.User.create({
            email: 'admin@test.com',
            password: 'hashedPassword',
            role: 'admin',
            profile: {
                name: 'Admin User',
                phone: '1234567890'
            }
        });
        teacherUser = await User_1.User.create({
            email: 'teacher@test.com',
            password: 'hashedPassword',
            role: 'teacher',
            profile: {
                name: 'Teacher User',
                phone: '1234567891'
            }
        });
        adminToken = jwtUtils_1.JWTUtils.generateAccessToken({
            userId: adminUser._id.toString(),
            email: adminUser.email,
            role: adminUser.role
        });
        teacherToken = jwtUtils_1.JWTUtils.generateAccessToken({
            userId: teacherUser._id.toString(),
            email: teacherUser.email,
            role: teacherUser.role
        });
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
        await mongoServer.stop();
    });
    beforeEach(async () => {
        await AcademicCalendar_1.AcademicCalendar.deleteMany({});
    });
    describe('POST /api/calendar', () => {
        const validEventData = {
            title: 'Summer Vacation',
            description: 'Annual summer vacation for all students',
            eventType: 'holiday',
            startDate: '2024-05-01',
            endDate: '2024-05-31',
            academicYear: '2023-2024',
            targetAudience: ['all']
        };
        it('should create a calendar event successfully (admin)', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validEventData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(validEventData.title);
            expect(response.body.data.eventType).toBe(validEventData.eventType);
        });
        it('should reject calendar event creation for non-admin users', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(validEventData);
            expect(response.status).toBe(403);
        });
        it('should validate required fields', async () => {
            const invalidData = { ...validEventData };
            delete invalidData.title;
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
        });
        it('should validate date range', async () => {
            const invalidData = {
                ...validEventData,
                startDate: '2024-05-31',
                endDate: '2024-05-01'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
        });
    });
    describe('GET /api/calendar', () => {
        beforeEach(async () => {
            await AcademicCalendar_1.AcademicCalendar.create([
                {
                    title: 'Holiday 1',
                    description: 'Test holiday',
                    eventType: 'holiday',
                    startDate: new Date('2024-05-01'),
                    endDate: new Date('2024-05-01'),
                    academicYear: '2023-2024',
                    targetAudience: ['all'],
                    createdBy: adminUser._id
                },
                {
                    title: 'Exam 1',
                    description: 'Test exam',
                    eventType: 'exam',
                    startDate: new Date('2024-06-01'),
                    endDate: new Date('2024-06-01'),
                    academicYear: '2023-2024',
                    targetAudience: ['students'],
                    createdBy: adminUser._id
                }
            ]);
        });
        it('should get all calendar events', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });
        it('should filter events by type', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar?eventType=holiday')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].eventType).toBe('holiday');
        });
        it('should filter events by academic year', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar?academicYear=2023-2024')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
        });
    });
    describe('PUT /api/calendar/:id', () => {
        let eventId;
        beforeEach(async () => {
            const event = await AcademicCalendar_1.AcademicCalendar.create({
                title: 'Test Event',
                description: 'Test description',
                eventType: 'holiday',
                startDate: new Date('2024-05-01'),
                endDate: new Date('2024-05-01'),
                academicYear: '2023-2024',
                targetAudience: ['all'],
                createdBy: adminUser._id
            });
            eventId = event._id.toString();
        });
        it('should update calendar event successfully (admin)', async () => {
            const updateData = {
                title: 'Updated Event Title',
                description: 'Updated description'
            };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/calendar/${eventId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updateData.title);
        });
        it('should reject update for non-admin users', async () => {
            const response = await (0, supertest_1.default)(app)
                .put(`/api/calendar/${eventId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ title: 'Updated Title' });
            expect(response.status).toBe(403);
        });
        it('should return 404 for non-existent event', async () => {
            const fakeId = new mongoose_1.default.Types.ObjectId();
            const response = await (0, supertest_1.default)(app)
                .put(`/api/calendar/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Updated Title' });
            expect(response.status).toBe(404);
        });
    });
    describe('DELETE /api/calendar/:id', () => {
        let eventId;
        beforeEach(async () => {
            const event = await AcademicCalendar_1.AcademicCalendar.create({
                title: 'Test Event',
                description: 'Test description',
                eventType: 'holiday',
                startDate: new Date('2024-05-01'),
                endDate: new Date('2024-05-01'),
                academicYear: '2023-2024',
                targetAudience: ['all'],
                createdBy: adminUser._id
            });
            eventId = event._id.toString();
        });
        it('should delete calendar event successfully (admin)', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/calendar/${eventId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            const deletedEvent = await AcademicCalendar_1.AcademicCalendar.findById(eventId);
            expect(deletedEvent?.isActive).toBe(false);
        });
        it('should reject delete for non-admin users', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/calendar/${eventId}`)
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(response.status).toBe(403);
        });
    });
    describe('GET /api/calendar/upcoming', () => {
        beforeEach(async () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            await AcademicCalendar_1.AcademicCalendar.create({
                title: 'Upcoming Event',
                description: 'Event happening tomorrow',
                eventType: 'workshop',
                startDate: tomorrow,
                endDate: tomorrow,
                academicYear: '2023-2024',
                targetAudience: ['all'],
                createdBy: adminUser._id
            });
        });
        it('should get upcoming events', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar/upcoming?days=7')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
        });
    });
    describe('GET /api/calendar/holidays', () => {
        beforeEach(async () => {
            await AcademicCalendar_1.AcademicCalendar.create([
                {
                    title: 'Holiday 1',
                    description: 'Test holiday',
                    eventType: 'holiday',
                    startDate: new Date('2024-05-01'),
                    endDate: new Date('2024-05-01'),
                    academicYear: '2023-2024',
                    targetAudience: ['all'],
                    createdBy: adminUser._id
                },
                {
                    title: 'Workshop 1',
                    description: 'Test workshop',
                    eventType: 'workshop',
                    startDate: new Date('2024-06-01'),
                    endDate: new Date('2024-06-01'),
                    academicYear: '2023-2024',
                    targetAudience: ['teachers'],
                    createdBy: adminUser._id
                }
            ]);
        });
        it('should get only holidays', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar/holidays')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].eventType).toBe('holiday');
        });
    });
});
//# sourceMappingURL=calendarController.test.js.map