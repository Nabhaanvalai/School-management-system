"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const User_1 = require("../../models/User");
const calendarRoutes_1 = __importDefault(require("../../routes/calendarRoutes"));
const jwtUtils_1 = require("../../utils/jwtUtils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/calendar', calendarRoutes_1.default);
describe('Calendar Routes', () => {
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
    describe('Route validation', () => {
        it('should validate event creation data', async () => {
            const invalidData = {
                title: 'A', // Too short
                description: '',
                eventType: 'invalid-type',
                startDate: 'invalid-date',
                endDate: '2024-05-01',
                academicYear: 'invalid-year',
                targetAudience: []
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
        it('should validate academic year format', async () => {
            const invalidData = {
                title: 'Valid Title',
                description: 'Valid description',
                eventType: 'holiday',
                startDate: '2024-05-01',
                endDate: '2024-05-01',
                academicYear: '2024', // Invalid format
                targetAudience: ['all']
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
        });
        it('should validate target audience', async () => {
            const invalidData = {
                title: 'Valid Title',
                description: 'Valid description',
                eventType: 'holiday',
                startDate: '2024-05-01',
                endDate: '2024-05-01',
                academicYear: '2023-2024',
                targetAudience: ['all', 'students'] // Invalid combination
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
        });
        it('should validate class ID format', async () => {
            const invalidData = {
                title: 'Valid Title',
                description: 'Valid description',
                eventType: 'holiday',
                startDate: '2024-05-01',
                endDate: '2024-05-01',
                academicYear: '2023-2024',
                targetAudience: ['students'],
                classIds: ['invalid-class-id']
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
        });
        it('should validate time format', async () => {
            const invalidData = {
                title: 'Valid Title',
                description: 'Valid description',
                eventType: 'workshop',
                startDate: '2024-05-01',
                endDate: '2024-05-01',
                isAllDay: false,
                startTime: '25:00', // Invalid time
                endTime: '10:00',
                academicYear: '2023-2024',
                targetAudience: ['teachers']
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
        });
        it('should validate MongoDB ObjectId for event ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
        });
        it('should validate event type in URL params', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar/type/invalid-type')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
        });
        it('should validate query parameters', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar?page=0&limit=101&upcoming=400')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
        });
    });
    describe('Authentication and Authorization', () => {
        it('should require authentication for all routes', async () => {
            const routes = [
                { method: 'get', path: '/api/calendar' },
                { method: 'post', path: '/api/calendar' },
                { method: 'get', path: '/api/calendar/upcoming' },
                { method: 'get', path: '/api/calendar/holidays' }
            ];
            for (const route of routes) {
                const response = await (0, supertest_1.default)(app)[route.method](route.path);
                expect(response.status).toBe(401);
            }
        });
        it('should require admin role for create, update, delete operations', async () => {
            const validData = {
                title: 'Test Event',
                description: 'Test description',
                eventType: 'holiday',
                startDate: '2024-05-01',
                endDate: '2024-05-01',
                academicYear: '2023-2024',
                targetAudience: ['all']
            };
            // Test POST
            const postResponse = await (0, supertest_1.default)(app)
                .post('/api/calendar')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(validData);
            expect(postResponse.status).toBe(403);
            // Test PUT (would need existing event ID, but authorization check comes first)
            const putResponse = await (0, supertest_1.default)(app)
                .put('/api/calendar/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ title: 'Updated' });
            expect(putResponse.status).toBe(403);
            // Test DELETE
            const deleteResponse = await (0, supertest_1.default)(app)
                .delete('/api/calendar/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${teacherToken}`);
            expect(deleteResponse.status).toBe(403);
        });
        it('should allow all authenticated users to read calendar events', async () => {
            const readRoutes = [
                '/api/calendar',
                '/api/calendar/upcoming',
                '/api/calendar/holidays',
                '/api/calendar/type/holiday'
            ];
            for (const route of readRoutes) {
                const response = await (0, supertest_1.default)(app)
                    .get(route)
                    .set('Authorization', `Bearer ${teacherToken}`);
                // Should not be 401 (unauthorized) or 403 (forbidden)
                expect(response.status).not.toBe(401);
                expect(response.status).not.toBe(403);
            }
        });
    });
    describe('Route parameter validation', () => {
        it('should validate date range in query parameters', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar?startDate=invalid-date&endDate=2024-05-01')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
        });
        it('should validate pagination parameters', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar?page=-1&limit=0')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
        });
        it('should validate upcoming days parameter', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/calendar/upcoming?days=400')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
        });
    });
});
//# sourceMappingURL=calendarRoutes.test.js.map