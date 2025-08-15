"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leaveController_1 = require("../../controllers/leaveController");
// Mock the models
const mockLeaveRequest = {
    findOverlappingLeaves: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    getLeaveSummary: jest.fn(),
    prototype: {
        save: jest.fn()
    }
};
const mockTeacher = {
    findOne: jest.fn()
};
jest.mock('../../models/LeaveRequest', () => ({
    LeaveRequest: mockLeaveRequest
}));
jest.mock('../../models/Teacher', () => ({
    Teacher: mockTeacher
}));
describe('Leave Controller', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {
            user: { id: 'user123', email: 'teacher@test.com', role: 'teacher' },
            params: {},
            body: {},
            query: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        // Clear all mocks
        jest.clearAllMocks();
    });
    describe('createLeaveApplication', () => {
        const validLeaveData = {
            leaveType: 'sick',
            startDate: '2024-03-15',
            endDate: '2024-03-16',
            reason: 'Feeling unwell and need rest',
            isHalfDay: false,
            academicYear: '2023-2024'
        };
        beforeEach(() => {
            mockReq.body = validLeaveData;
        });
        it('should create leave application successfully for teacher', async () => {
            const mockTeacherDoc = {
                _id: 'teacher123',
                userId: 'user123',
                name: 'John Doe',
                employeeId: 'EMP001'
            };
            const mockLeaveDoc = {
                _id: 'leave123',
                teacherId: 'teacher123',
                ...validLeaveData,
                status: 'pending',
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockResolvedValue({
                    _id: 'leave123',
                    teacherId: mockTeacherDoc,
                    ...validLeaveData,
                    status: 'pending'
                })
            };
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            mockLeaveRequest.findOverlappingLeaves.mockResolvedValue([]);
            // Mock the constructor to return our mock document
            mockLeaveRequest.mockImplementation = jest.fn().mockImplementation(() => mockLeaveDoc);
            await (0, leaveController_1.createLeaveApplication)(mockReq, mockRes, mockNext);
            expect(mockTeacher.findOne).toHaveBeenCalledWith({ userId: 'user123' });
            expect(mockLeaveRequest.findOverlappingLeaves).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Leave application submitted successfully',
                data: expect.objectContaining({
                    leaveRequest: expect.any(Object)
                })
            });
        });
        it('should return 400 if required fields are missing', async () => {
            mockReq.body = { leaveType: 'sick' }; // Missing required fields
            await (0, leaveController_1.createLeaveApplication)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Leave type, start date, end date, and reason are required'
            });
        });
        it('should return 403 if user is not a teacher', async () => {
            mockReq.user.role = 'student';
            await (0, leaveController_1.createLeaveApplication)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Only teachers can apply for leave'
            });
        });
        it('should return 404 if teacher profile not found', async () => {
            mockTeacher.findOne.mockResolvedValue(null);
            await (0, leaveController_1.createLeaveApplication)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Teacher profile not found'
            });
        });
        it('should return 400 if start date is after end date', async () => {
            mockReq.body = {
                ...validLeaveData,
                startDate: '2024-03-16',
                endDate: '2024-03-15'
            };
            await (0, leaveController_1.createLeaveApplication)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Start date cannot be after end date'
            });
        });
        it('should return 400 if overlapping leaves exist', async () => {
            const mockTeacherDoc = { _id: 'teacher123', userId: 'user123' };
            const overlappingLeave = {
                _id: 'overlap123',
                getFormattedDateRange: jest.fn().mockReturnValue('2024-03-15 to 2024-03-16'),
                status: 'approved',
                leaveType: 'casual'
            };
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            mockLeaveRequest.findOverlappingLeaves.mockResolvedValue([overlappingLeave]);
            await (0, leaveController_1.createLeaveApplication)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'You already have a leave request for overlapping dates',
                data: {
                    overlappingLeaves: [{
                            id: 'overlap123',
                            dateRange: '2024-03-15 to 2024-03-16',
                            status: 'approved',
                            leaveType: 'casual'
                        }]
                }
            });
        });
        it('should handle half day leave validation', async () => {
            mockReq.body = {
                ...validLeaveData,
                isHalfDay: true,
                startDate: '2024-03-15',
                endDate: '2024-03-15'
            };
            await (0, leaveController_1.createLeaveApplication)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Half day session (morning/afternoon) is required for half day leaves'
            });
        });
        it('should handle validation errors', async () => {
            const mockTeacherDoc = { _id: 'teacher123', userId: 'user123' };
            const validationError = {
                name: 'ValidationError',
                errors: {
                    reason: { message: 'Reason is too short' }
                }
            };
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            mockLeaveRequest.findOverlappingLeaves.mockResolvedValue([]);
            // Mock the LeaveRequest constructor to throw validation error
            const mockConstructor = jest.fn().mockImplementation(() => {
                throw validationError;
            });
            // Replace the LeaveRequest mock temporarily
            const originalMock = require('../../models/LeaveRequest').LeaveRequest;
            require('../../models/LeaveRequest').LeaveRequest = mockConstructor;
            await (0, leaveController_1.createLeaveApplication)(mockReq, mockRes, mockNext);
            // Restore original mock
            require('../../models/LeaveRequest').LeaveRequest = originalMock;
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Validation failed',
                errors: ['Reason is too short']
            });
        });
    });
    describe('getTeacherLeaveHistory', () => {
        beforeEach(() => {
            mockReq.params = { teacherId: 'teacher123' };
            mockReq.query = { page: '1', limit: '10' };
        });
        it('should get teacher leave history successfully for teacher (own history)', async () => {
            const mockTeacherDoc = { _id: 'teacher123', userId: 'user123' };
            const mockLeaves = [
                { _id: 'leave1', leaveType: 'sick', status: 'approved' },
                { _id: 'leave2', leaveType: 'casual', status: 'pending' }
            ];
            const mockSummary = { sick: { days: 2, count: 1 }, total: { days: 2, count: 1 } };
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            mockLeaveRequest.countDocuments.mockResolvedValue(2);
            mockLeaveRequest.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockLeaves)
            });
            mockLeaveRequest.getLeaveSummary.mockResolvedValue(mockSummary);
            await (0, leaveController_1.getTeacherLeaveHistory)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: {
                    leaveRequests: mockLeaves,
                    leaveSummary: mockSummary,
                    pagination: expect.objectContaining({
                        currentPage: 1,
                        totalPages: 1,
                        totalCount: 2
                    })
                }
            });
        });
        it('should return 400 for invalid teacher ID', async () => {
            mockReq.params.teacherId = 'invalid-id';
            await (0, leaveController_1.getTeacherLeaveHistory)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid teacher ID'
            });
        });
        it('should return 403 if teacher tries to access another teacher\'s history', async () => {
            const mockTeacherDoc = { _id: 'different-teacher', userId: 'user123' };
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            await (0, leaveController_1.getTeacherLeaveHistory)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'You can only view your own leave history'
            });
        });
        it('should allow admin to access any teacher\'s history', async () => {
            mockReq.user.role = 'admin';
            const mockLeaves = [{ _id: 'leave1', leaveType: 'sick' }];
            const mockSummary = { total: { days: 0, count: 0 } };
            mockLeaveRequest.countDocuments.mockResolvedValue(1);
            mockLeaveRequest.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockLeaves)
            });
            mockLeaveRequest.getLeaveSummary.mockResolvedValue(mockSummary);
            await (0, leaveController_1.getTeacherLeaveHistory)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockTeacher.findOne).not.toHaveBeenCalled(); // Admin doesn't need teacher validation
        });
    });
    describe('getAllLeaveRequests', () => {
        beforeEach(() => {
            mockReq.user.role = 'admin';
            mockReq.query = { page: '1', limit: '10' };
        });
        it('should get all leave requests for admin', async () => {
            const mockLeaves = [
                { _id: 'leave1', leaveType: 'sick', status: 'pending' },
                { _id: 'leave2', leaveType: 'casual', status: 'approved' }
            ];
            mockLeaveRequest.countDocuments.mockResolvedValue(2);
            mockLeaveRequest.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockLeaves)
            });
            await (0, leaveController_1.getAllLeaveRequests)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: {
                    leaveRequests: mockLeaves,
                    pagination: expect.objectContaining({
                        currentPage: 1,
                        totalPages: 1,
                        totalCount: 2
                    })
                }
            });
        });
        it('should return 403 for non-admin users', async () => {
            mockReq.user.role = 'teacher';
            await (0, leaveController_1.getAllLeaveRequests)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Access denied. Admin access required.'
            });
        });
        it('should apply filters correctly', async () => {
            mockReq.query = {
                status: 'pending',
                academicYear: '2023-2024',
                leaveType: 'sick',
                page: '1',
                limit: '10'
            };
            mockLeaveRequest.countDocuments.mockResolvedValue(0);
            mockLeaveRequest.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([])
            });
            await (0, leaveController_1.getAllLeaveRequests)(mockReq, mockRes, mockNext);
            expect(mockLeaveRequest.find).toHaveBeenCalledWith({
                status: 'pending',
                academicYear: '2023-2024',
                leaveType: 'sick'
            });
        });
    });
    describe('getLeaveRequestById', () => {
        beforeEach(() => {
            mockReq.params = { id: 'leave123' };
        });
        it('should get leave request by ID for admin', async () => {
            mockReq.user.role = 'admin';
            const mockLeave = {
                _id: 'leave123',
                teacherId: 'teacher123',
                leaveType: 'sick',
                status: 'pending'
            };
            mockLeaveRequest.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockLeave)
            });
            await (0, leaveController_1.getLeaveRequestById)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: { leaveRequest: mockLeave }
            });
        });
        it('should return 400 for invalid leave request ID', async () => {
            mockReq.params.id = 'invalid-id';
            await (0, leaveController_1.getLeaveRequestById)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid leave request ID'
            });
        });
        it('should return 404 if leave request not found', async () => {
            mockLeaveRequest.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });
            await (0, leaveController_1.getLeaveRequestById)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Leave request not found'
            });
        });
        it('should return 403 if teacher tries to access another teacher\'s leave', async () => {
            const mockLeave = { _id: 'leave123', teacherId: 'different-teacher' };
            const mockTeacherDoc = { _id: 'teacher123', userId: 'user123' };
            mockLeaveRequest.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockLeave)
            });
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            await (0, leaveController_1.getLeaveRequestById)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'You can only view your own leave requests'
            });
        });
    });
    describe('updateLeaveRequest', () => {
        beforeEach(() => {
            mockReq.params = { id: 'leave123' };
            mockReq.body = {
                reason: 'Updated reason for leave'
            };
        });
        it('should update leave request successfully', async () => {
            const mockTeacherDoc = { _id: 'teacher123', userId: 'user123' };
            const mockLeave = {
                _id: 'leave123',
                teacherId: 'teacher123',
                status: 'pending',
                canBeModified: jest.fn().mockReturnValue(true),
                reason: 'Old reason',
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockResolvedValue({
                    _id: 'leave123',
                    reason: 'Updated reason for leave'
                })
            };
            mockLeaveRequest.findById.mockResolvedValue(mockLeave);
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            await (0, leaveController_1.updateLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockLeave.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Leave request updated successfully',
                data: expect.objectContaining({
                    leaveRequest: expect.any(Object)
                })
            });
        });
        it('should return 400 if leave cannot be modified', async () => {
            const mockTeacherDoc = { _id: 'teacher123', userId: 'user123' };
            const mockLeave = {
                _id: 'leave123',
                teacherId: 'teacher123',
                canBeModified: jest.fn().mockReturnValue(false)
            };
            mockLeaveRequest.findById.mockResolvedValue(mockLeave);
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            await (0, leaveController_1.updateLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'This leave request cannot be modified. It may have been already processed or the start date has passed.'
            });
        });
    });
    describe('cancelLeaveRequest', () => {
        beforeEach(() => {
            mockReq.params = { id: 'leave123' };
            mockReq.body = { reason: 'Personal reasons' };
        });
        it('should cancel leave request successfully', async () => {
            const mockTeacherDoc = { _id: 'teacher123', userId: 'user123' };
            const mockLeave = {
                _id: 'leave123',
                teacherId: 'teacher123',
                status: 'pending',
                cancel: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockResolvedValue({
                    _id: 'leave123',
                    status: 'cancelled'
                })
            };
            mockLeaveRequest.findById.mockResolvedValue(mockLeave);
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            await (0, leaveController_1.cancelLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockLeave.cancel).toHaveBeenCalledWith('Personal reasons');
            expect(mockLeave.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Leave request cancelled successfully',
                data: expect.objectContaining({
                    leaveRequest: expect.any(Object)
                })
            });
        });
        it('should return 400 if leave is already cancelled', async () => {
            const mockTeacherDoc = { _id: 'teacher123', userId: 'user123' };
            const mockLeave = {
                _id: 'leave123',
                teacherId: 'teacher123',
                status: 'cancelled'
            };
            mockLeaveRequest.findById.mockResolvedValue(mockLeave);
            mockTeacher.findOne.mockResolvedValue(mockTeacherDoc);
            await (0, leaveController_1.cancelLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Leave request is already cancelled'
            });
        });
        it('should allow admin to cancel any leave request', async () => {
            mockReq.user.role = 'admin';
            const mockLeave = {
                _id: 'leave123',
                teacherId: 'teacher123',
                status: 'pending',
                cancel: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockResolvedValue({
                    _id: 'leave123',
                    status: 'cancelled'
                })
            };
            mockLeaveRequest.findById.mockResolvedValue(mockLeave);
            await (0, leaveController_1.cancelLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockLeave.cancel).toHaveBeenCalled();
            expect(mockTeacher.findOne).not.toHaveBeenCalled(); // Admin doesn't need teacher validation
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
});
//# sourceMappingURL=leaveController.unit.test.js.map