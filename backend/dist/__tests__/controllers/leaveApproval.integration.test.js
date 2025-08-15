"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leaveController_1 = require("../../controllers/leaveController");
describe('Leave Approval Workflow - Integration Tests', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {
            user: { id: 'admin123', email: 'admin@test.com', role: 'admin' },
            params: { id: '507f1f77bcf86cd799439011' },
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
    });
    describe('approveLeaveRequest', () => {
        it('should return 400 for invalid leave request ID', async () => {
            mockReq.params = { id: 'invalid-id' };
            await (0, leaveController_1.approveLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid leave request ID'
            });
        });
        it('should return 403 for non-admin users', async () => {
            mockReq.user.role = 'teacher';
            await (0, leaveController_1.approveLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Access denied. Admin access required.'
            });
        });
        it('should handle optional comments parameter', async () => {
            mockReq.body = { comments: 'Approved with conditions' };
            // This will fail because we don't have a real database connection
            // but it tests the validation logic
            await (0, leaveController_1.approveLeaveRequest)(mockReq, mockRes, mockNext);
            // The function should proceed past the validation checks
            expect(mockRes.status).not.toHaveBeenCalledWith(400);
            expect(mockRes.status).not.toHaveBeenCalledWith(403);
        });
    });
    describe('rejectLeaveRequest', () => {
        it('should return 400 for invalid leave request ID', async () => {
            mockReq.params = { id: 'invalid-id' };
            mockReq.body = { comments: 'Rejection reason' };
            await (0, leaveController_1.rejectLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid leave request ID'
            });
        });
        it('should return 403 for non-admin users', async () => {
            mockReq.user.role = 'teacher';
            mockReq.body = { comments: 'Rejection reason' };
            await (0, leaveController_1.rejectLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Access denied. Admin access required.'
            });
        });
        it('should return 400 if comments are missing', async () => {
            mockReq.body = {}; // No comments
            await (0, leaveController_1.rejectLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Comments are required when rejecting a leave request'
            });
        });
        it('should return 400 if comments are empty', async () => {
            mockReq.body = { comments: '   ' }; // Empty/whitespace comments
            await (0, leaveController_1.rejectLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Comments are required when rejecting a leave request'
            });
        });
        it('should proceed with valid comments', async () => {
            mockReq.body = { comments: 'Not enough notice provided' };
            // This will fail because we don't have a real database connection
            // but it tests the validation logic
            await (0, leaveController_1.rejectLeaveRequest)(mockReq, mockRes, mockNext);
            // The function should proceed past the validation checks
            expect(mockRes.status).not.toHaveBeenCalledWith(400);
            expect(mockRes.status).not.toHaveBeenCalledWith(403);
        });
    });
    describe('Authorization Tests', () => {
        it('should allow admin to approve leave requests', async () => {
            mockReq.user.role = 'admin';
            mockReq.body = { comments: 'Approved' };
            await (0, leaveController_1.approveLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).not.toHaveBeenCalledWith(403);
        });
        it('should allow admin to reject leave requests', async () => {
            mockReq.user.role = 'admin';
            mockReq.body = { comments: 'Rejected due to policy' };
            await (0, leaveController_1.rejectLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).not.toHaveBeenCalledWith(403);
        });
        it('should deny teacher access to approve leave requests', async () => {
            mockReq.user.role = 'teacher';
            await (0, leaveController_1.approveLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });
        it('should deny teacher access to reject leave requests', async () => {
            mockReq.user.role = 'teacher';
            mockReq.body = { comments: 'Should not work' };
            await (0, leaveController_1.rejectLeaveRequest)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });
    });
    describe('Input Validation', () => {
        it('should validate MongoDB ObjectId format for approval', async () => {
            const invalidIds = ['123', 'invalid', '', 'not-an-objectid'];
            for (const invalidId of invalidIds) {
                mockReq.params = { id: invalidId };
                await (0, leaveController_1.approveLeaveRequest)(mockReq, mockRes, mockNext);
                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 'error',
                    message: 'Invalid leave request ID'
                });
                // Reset mocks for next iteration
                jest.clearAllMocks();
                mockRes.status = jest.fn().mockReturnThis();
                mockRes.json = jest.fn().mockReturnThis();
            }
        });
        it('should validate MongoDB ObjectId format for rejection', async () => {
            const invalidIds = ['123', 'invalid', '', 'not-an-objectid'];
            for (const invalidId of invalidIds) {
                mockReq.params = { id: invalidId };
                mockReq.body = { comments: 'Valid comment' };
                await (0, leaveController_1.rejectLeaveRequest)(mockReq, mockRes, mockNext);
                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 'error',
                    message: 'Invalid leave request ID'
                });
                // Reset mocks for next iteration
                jest.clearAllMocks();
                mockRes.status = jest.fn().mockReturnThis();
                mockRes.json = jest.fn().mockReturnThis();
            }
        });
        it('should accept valid MongoDB ObjectId', async () => {
            const validIds = [
                '507f1f77bcf86cd799439011',
                '507f191e810c19729de860ea',
                '6123456789abcdef12345678'
            ];
            for (const validId of validIds) {
                mockReq.params = { id: validId };
                await (0, leaveController_1.approveLeaveRequest)(mockReq, mockRes, mockNext);
                // Should not return 400 for invalid ID
                expect(mockRes.status).not.toHaveBeenCalledWith(400);
                // Reset mocks for next iteration
                jest.clearAllMocks();
                mockRes.status = jest.fn().mockReturnThis();
                mockRes.json = jest.fn().mockReturnThis();
            }
        });
    });
});
//# sourceMappingURL=leaveApproval.integration.test.js.map