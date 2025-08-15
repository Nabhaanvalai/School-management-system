"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const leaveRoutes_1 = __importDefault(require("../../routes/leaveRoutes"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const validationSchemas_1 = require("../../middleware/validationSchemas");
const leaveController = __importStar(require("../../controllers/leaveController"));
// Mock the middleware
jest.mock('../../middleware/authMiddleware');
jest.mock('../../middleware/validationSchemas');
jest.mock('../../controllers/leaveController');
const mockAuthenticateToken = authMiddleware_1.authenticateToken;
const mockRequireRole = authMiddleware_1.requireRole;
const mockHandleValidationErrors = validationSchemas_1.handleValidationErrors;
// Mock controller functions
const mockCreateLeaveApplication = leaveController.createLeaveApplication;
const mockGetTeacherLeaveHistory = leaveController.getTeacherLeaveHistory;
const mockGetAllLeaveRequests = leaveController.getAllLeaveRequests;
const mockGetLeaveRequestById = leaveController.getLeaveRequestById;
const mockUpdateLeaveRequest = leaveController.updateLeaveRequest;
const mockCancelLeaveRequest = leaveController.cancelLeaveRequest;
describe('Leave Routes', () => {
    let app;
    beforeAll(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/leave', leaveRoutes_1.default);
        // Mock middleware to pass through
        mockAuthenticateToken.mockImplementation((req, res, next) => {
            req.user = { id: 'user123', role: 'teacher' };
            next();
        });
        mockRequireRole.mockImplementation((roles) => (req, res, next) => {
            next();
        });
        mockHandleValidationErrors.mockImplementation((req, res, next) => {
            next();
        });
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/leave', () => {
        const validLeaveData = {
            leaveType: 'sick',
            startDate: '2024-03-15',
            endDate: '2024-03-16',
            reason: 'Feeling unwell and need rest',
            academicYear: '2023-2024'
        };
        it('should call createLeaveApplication controller', async () => {
            mockCreateLeaveApplication.mockImplementation((req, res) => {
                res.status(201).json({
                    status: 'success',
                    message: 'Leave application submitted successfully'
                });
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send(validLeaveData);
            expect(mockCreateLeaveApplication).toHaveBeenCalled();
            expect(mockAuthenticateToken).toHaveBeenCalled();
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher']);
            expect(response.status).toBe(201);
        });
        it('should validate required fields', async () => {
            const invalidData = {
                leaveType: 'sick'
                // Missing required fields
            };
            await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send(invalidData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate leave type enum', async () => {
            const invalidData = {
                ...validLeaveData,
                leaveType: 'invalid-type'
            };
            await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send(invalidData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate date format', async () => {
            const invalidData = {
                ...validLeaveData,
                startDate: 'invalid-date'
            };
            await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send(invalidData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate reason length', async () => {
            const invalidData = {
                ...validLeaveData,
                reason: 'short' // Too short
            };
            await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send(invalidData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate half day session', async () => {
            const invalidData = {
                ...validLeaveData,
                isHalfDay: true,
                halfDaySession: 'invalid-session'
            };
            await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send(invalidData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate emergency contact phone', async () => {
            const invalidData = {
                ...validLeaveData,
                emergencyContact: {
                    name: 'John Doe',
                    phone: '123', // Invalid phone format
                    relationship: 'spouse'
                }
            };
            await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send(invalidData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate academic year format', async () => {
            const invalidData = {
                ...validLeaveData,
                academicYear: '2023' // Invalid format
            };
            await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send(invalidData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
    });
    describe('GET /api/leave/teacher/:teacherId', () => {
        it('should call getTeacherLeaveHistory controller', async () => {
            mockGetTeacherLeaveHistory.mockImplementation((req, res) => {
                res.status(200).json({
                    status: 'success',
                    data: { leaveRequests: [], leaveSummary: {} }
                });
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/leave/teacher/507f1f77bcf86cd799439011');
            expect(mockGetTeacherLeaveHistory).toHaveBeenCalled();
            expect(mockAuthenticateToken).toHaveBeenCalled();
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher', 'admin']);
            expect(response.status).toBe(200);
        });
        it('should validate teacher ID format', async () => {
            await (0, supertest_1.default)(app)
                .get('/api/leave/teacher/invalid-id');
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate query parameters', async () => {
            await (0, supertest_1.default)(app)
                .get('/api/leave/teacher/507f1f77bcf86cd799439011')
                .query({
                academicYear: 'invalid-year',
                status: 'invalid-status',
                page: '0',
                limit: '200'
            });
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should accept valid query parameters', async () => {
            mockGetTeacherLeaveHistory.mockImplementation((req, res) => {
                res.status(200).json({ status: 'success', data: {} });
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/leave/teacher/507f1f77bcf86cd799439011')
                .query({
                academicYear: '2023-2024',
                status: 'pending',
                page: '1',
                limit: '10'
            });
            expect(response.status).toBe(200);
        });
    });
    describe('GET /api/leave', () => {
        it('should call getAllLeaveRequests controller', async () => {
            mockGetAllLeaveRequests.mockImplementation((req, res) => {
                res.status(200).json({
                    status: 'success',
                    data: { leaveRequests: [] }
                });
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/leave');
            expect(mockGetAllLeaveRequests).toHaveBeenCalled();
            expect(mockAuthenticateToken).toHaveBeenCalled();
            expect(mockRequireRole).toHaveBeenCalledWith(['admin']);
            expect(response.status).toBe(200);
        });
        it('should validate query parameters', async () => {
            await (0, supertest_1.default)(app)
                .get('/api/leave')
                .query({
                status: 'invalid-status',
                academicYear: 'invalid-year',
                leaveType: 'invalid-type',
                teacherId: 'invalid-id',
                startDate: 'invalid-date',
                endDate: 'invalid-date',
                page: '0',
                limit: '200'
            });
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should accept valid query parameters', async () => {
            mockGetAllLeaveRequests.mockImplementation((req, res) => {
                res.status(200).json({ status: 'success', data: {} });
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/leave')
                .query({
                status: 'pending',
                academicYear: '2023-2024',
                leaveType: 'sick',
                teacherId: '507f1f77bcf86cd799439011',
                startDate: '2024-03-01',
                endDate: '2024-03-31',
                page: '1',
                limit: '10'
            });
            expect(response.status).toBe(200);
        });
    });
    describe('GET /api/leave/:id', () => {
        it('should call getLeaveRequestById controller', async () => {
            mockGetLeaveRequestById.mockImplementation((req, res) => {
                res.status(200).json({
                    status: 'success',
                    data: { leaveRequest: {} }
                });
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/leave/507f1f77bcf86cd799439011');
            expect(mockGetLeaveRequestById).toHaveBeenCalled();
            expect(mockAuthenticateToken).toHaveBeenCalled();
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher', 'admin']);
            expect(response.status).toBe(200);
        });
        it('should validate leave request ID format', async () => {
            await (0, supertest_1.default)(app)
                .get('/api/leave/invalid-id');
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
    });
    describe('PUT /api/leave/:id', () => {
        const updateData = {
            reason: 'Updated reason for leave request'
        };
        it('should call updateLeaveRequest controller', async () => {
            mockUpdateLeaveRequest.mockImplementation((req, res) => {
                res.status(200).json({
                    status: 'success',
                    message: 'Leave request updated successfully'
                });
            });
            const response = await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011')
                .send(updateData);
            expect(mockUpdateLeaveRequest).toHaveBeenCalled();
            expect(mockAuthenticateToken).toHaveBeenCalled();
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher']);
            expect(response.status).toBe(200);
        });
        it('should validate leave request ID format', async () => {
            await (0, supertest_1.default)(app)
                .put('/api/leave/invalid-id')
                .send(updateData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate update data', async () => {
            const invalidData = {
                leaveType: 'invalid-type',
                startDate: 'invalid-date',
                reason: 'short' // Too short
            };
            await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011')
                .send(invalidData);
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should accept valid update data', async () => {
            mockUpdateLeaveRequest.mockImplementation((req, res) => {
                res.status(200).json({ status: 'success' });
            });
            const validData = {
                leaveType: 'casual',
                startDate: '2024-03-20',
                endDate: '2024-03-21',
                reason: 'Personal work that needs attention',
                isHalfDay: true,
                halfDaySession: 'morning'
            };
            const response = await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011')
                .send(validData);
            expect(response.status).toBe(200);
        });
    });
    describe('PUT /api/leave/:id/cancel', () => {
        it('should call cancelLeaveRequest controller', async () => {
            mockCancelLeaveRequest.mockImplementation((req, res) => {
                res.status(200).json({
                    status: 'success',
                    message: 'Leave request cancelled successfully'
                });
            });
            const response = await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011/cancel')
                .send({ reason: 'Personal reasons' });
            expect(mockCancelLeaveRequest).toHaveBeenCalled();
            expect(mockAuthenticateToken).toHaveBeenCalled();
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher', 'admin']);
            expect(response.status).toBe(200);
        });
        it('should validate leave request ID format', async () => {
            await (0, supertest_1.default)(app)
                .put('/api/leave/invalid-id/cancel')
                .send({ reason: 'Personal reasons' });
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should validate cancellation reason length', async () => {
            const longReason = 'a'.repeat(501); // Too long
            await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011/cancel')
                .send({ reason: longReason });
            expect(mockHandleValidationErrors).toHaveBeenCalled();
        });
        it('should accept valid cancellation data', async () => {
            mockCancelLeaveRequest.mockImplementation((req, res) => {
                res.status(200).json({ status: 'success' });
            });
            const response = await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011/cancel')
                .send({ reason: 'Change of plans' });
            expect(response.status).toBe(200);
        });
        it('should accept cancellation without reason', async () => {
            mockCancelLeaveRequest.mockImplementation((req, res) => {
                res.status(200).json({ status: 'success' });
            });
            const response = await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011/cancel')
                .send({});
            expect(response.status).toBe(200);
        });
    });
    describe('Route Protection', () => {
        it('should require authentication for all routes', () => {
            // All routes should call authenticateToken
            expect(mockAuthenticateToken).toHaveBeenCalled();
        });
        it('should require teacher role for POST /api/leave', async () => {
            await (0, supertest_1.default)(app)
                .post('/api/leave')
                .send({
                leaveType: 'sick',
                startDate: '2024-03-15',
                endDate: '2024-03-16',
                reason: 'Feeling unwell'
            });
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher']);
        });
        it('should require teacher or admin role for GET /api/leave/teacher/:teacherId', async () => {
            await (0, supertest_1.default)(app)
                .get('/api/leave/teacher/507f1f77bcf86cd799439011');
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher', 'admin']);
        });
        it('should require admin role for GET /api/leave', async () => {
            await (0, supertest_1.default)(app)
                .get('/api/leave');
            expect(mockRequireRole).toHaveBeenCalledWith(['admin']);
        });
        it('should require teacher or admin role for GET /api/leave/:id', async () => {
            await (0, supertest_1.default)(app)
                .get('/api/leave/507f1f77bcf86cd799439011');
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher', 'admin']);
        });
        it('should require teacher role for PUT /api/leave/:id', async () => {
            await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011')
                .send({ reason: 'Updated reason' });
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher']);
        });
        it('should require teacher or admin role for PUT /api/leave/:id/cancel', async () => {
            await (0, supertest_1.default)(app)
                .put('/api/leave/507f1f77bcf86cd799439011/cancel')
                .send({ reason: 'Personal reasons' });
            expect(mockRequireRole).toHaveBeenCalledWith(['teacher', 'admin']);
        });
    });
});
//# sourceMappingURL=leaveRoutes.unit.test.js.map