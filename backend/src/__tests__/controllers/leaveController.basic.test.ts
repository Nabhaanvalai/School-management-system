import { Request, Response, NextFunction } from 'express';
import {
  createLeaveApplication,
  getTeacherLeaveHistory,
  getAllLeaveRequests
} from '../../controllers/leaveController';

// Simple mock interface
interface MockRequest extends Partial<Request> {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  params?: any;
  body?: any;
  query?: any;
}

describe('Leave Controller - Basic Tests', () => {
  let mockReq: MockRequest;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

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
  });

  describe('createLeaveApplication', () => {
    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { leaveType: 'sick' }; // Missing required fields

      await createLeaveApplication(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Leave type, start date, end date, and reason are required'
      });
    });

    it('should return 403 if user is not a teacher', async () => {
      mockReq.user!.role = 'student';
      mockReq.body = {
        leaveType: 'sick',
        startDate: '2024-03-15',
        endDate: '2024-03-16',
        reason: 'Feeling unwell and need rest'
      };

      await createLeaveApplication(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Only teachers can apply for leave'
      });
    });

    it('should return 400 if start date is after end date', async () => {
      mockReq.body = {
        leaveType: 'sick',
        startDate: '2024-03-16',
        endDate: '2024-03-15',
        reason: 'Feeling unwell and need rest'
      };

      await createLeaveApplication(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Start date cannot be after end date'
      });
    });

    it('should return 400 for half day validation', async () => {
      mockReq.body = {
        leaveType: 'sick',
        startDate: '2024-03-15',
        endDate: '2024-03-15',
        reason: 'Feeling unwell and need rest',
        isHalfDay: true
        // Missing halfDaySession
      };

      await createLeaveApplication(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Half day session (morning/afternoon) is required for half day leaves'
      });
    });
  });

  describe('getTeacherLeaveHistory', () => {
    it('should return 400 for invalid teacher ID', async () => {
      mockReq.params = { teacherId: 'invalid-id' };

      await getTeacherLeaveHistory(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid teacher ID'
      });
    });
  });

  describe('getAllLeaveRequests', () => {
    it('should return 403 for non-admin users', async () => {
      mockReq.user!.role = 'teacher';

      await getAllLeaveRequests(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access denied. Admin access required.'
      });
    });
  });
});