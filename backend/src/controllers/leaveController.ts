import { Request, Response, NextFunction } from 'express';
import { LeaveRequest, ILeaveRequest } from '../models/LeaveRequest';
import { Teacher } from '../models/Teacher';
import { UserRole } from '../models/User';
import mongoose from 'mongoose';

// Interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    profile?: any;
  };
}

// Create leave application
export const createLeaveApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      isHalfDay = false,
      halfDaySession,
      emergencyContact,
      attachments,
      academicYear
    } = req.body;

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Leave type, start date, end date, and reason are required'
      });
    }

    // Get teacher ID from authenticated user
    let teacherId: string;
    
    if (req.user?.role === 'teacher') {
      // For teachers, use their own profile
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher) {
        return res.status(404).json({
          status: 'error',
          message: 'Teacher profile not found'
        });
      }
      teacherId = (teacher._id as any).toString();
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'Only teachers can apply for leave'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date cannot be after end date'
      });
    }

    // Check for overlapping leaves
    const overlappingLeaves = await LeaveRequest.findOverlappingLeaves(
      teacherId,
      start,
      end
    );

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a leave request for overlapping dates',
        data: {
          overlappingLeaves: overlappingLeaves.map(leave => ({
            id: leave._id,
            dateRange: leave.getFormattedDateRange(),
            status: leave.status,
            leaveType: leave.leaveType
          }))
        }
      });
    }

    // Validate half day logic
    if (isHalfDay) {
      if (!halfDaySession || !['morning', 'afternoon'].includes(halfDaySession)) {
        return res.status(400).json({
          status: 'error',
          message: 'Half day session (morning/afternoon) is required for half day leaves'
        });
      }

      // Half day should be for single day only
      if (start.toDateString() !== end.toDateString()) {
        return res.status(400).json({
          status: 'error',
          message: 'Half day leave can only be for a single day'
        });
      }
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      teacherId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      isHalfDay,
      halfDaySession: isHalfDay ? halfDaySession : undefined,
      emergencyContact,
      attachments,
      academicYear: academicYear || undefined // Let model set default if not provided
    });

    await leaveRequest.save();

    // Populate teacher details for response
    await leaveRequest.populate('teacherId', 'name employeeId');

    res.status(201).json({
      status: 'success',
      message: 'Leave application submitted successfully',
      data: {
        leaveRequest
      }
    });

  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
    }

    next(error);
  }
};

// Get leave history for a teacher
export const getTeacherLeaveHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, status, page = 1, limit = 10 } = req.query;

    // Validate teacher ID
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid teacher ID'
      });
    }

    // Authorization check
    if (req.user?.role === 'teacher') {
      // Teachers can only view their own leave history
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || (teacher._id as any).toString() !== teacherId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only view your own leave history'
        });
      }
    } else if (req.user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Build query
    const query: any = { teacherId };
    
    if (academicYear) {
      query.academicYear = academicYear;
    }
    
    if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status as string)) {
      query.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await LeaveRequest.countDocuments(query);

    // Get leave requests
    const leaveRequests = await LeaveRequest.find(query)
      .populate('teacherId', 'name employeeId')
      .populate('reviewedBy', 'name')
      .sort({ appliedDate: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get leave summary for the academic year
    const currentAcademicYear = academicYear as string || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);
    const leaveSummary = await LeaveRequest.getLeaveSummary(teacherId, currentAcademicYear);

    res.status(200).json({
      status: 'success',
      data: {
        leaveRequests,
        leaveSummary,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          hasNext: pageNum < Math.ceil(totalCount / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get all leave requests (Admin only)
export const getAllLeaveRequests = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Only admins can view all leave requests
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin access required.'
      });
    }

    const { 
      status, 
      academicYear, 
      leaveType, 
      teacherId,
      startDate,
      endDate,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    const query: any = {};
    
    if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status as string)) {
      query.status = status;
    }
    
    if (academicYear) {
      query.academicYear = academicYear;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }
    
    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId as string)) {
      query.teacherId = teacherId;
    }

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      query.$or = [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await LeaveRequest.countDocuments(query);

    // Get leave requests
    const leaveRequests = await LeaveRequest.find(query)
      .populate('teacherId', 'name employeeId')
      .populate('reviewedBy', 'name')
      .sort({ appliedDate: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      status: 'success',
      data: {
        leaveRequests,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          hasNext: pageNum < Math.ceil(totalCount / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get single leave request details
export const getLeaveRequestById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate leave request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid leave request ID'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id)
      .populate('teacherId', 'name employeeId')
      .populate('reviewedBy', 'name');

    if (!leaveRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found'
      });
    }

    // Authorization check
    if (req.user?.role === 'teacher') {
      // Teachers can only view their own leave requests
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || (teacher._id as any).toString() !== leaveRequest.teacherId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only view your own leave requests'
        });
      }
    } else if (req.user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        leaveRequest
      }
    });

  } catch (error) {
    next(error);
  }
};

// Update leave request (only for pending requests by the applicant)
export const updateLeaveRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      isHalfDay,
      halfDaySession,
      emergencyContact,
      attachments
    } = req.body;

    // Validate leave request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid leave request ID'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found'
      });
    }

    // Authorization check - only the applicant can update their own pending requests
    if (req.user?.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || (teacher._id as any).toString() !== leaveRequest.teacherId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update your own leave requests'
        });
      }
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'Only teachers can update their leave requests'
      });
    }

    // Check if leave can be modified
    if (!leaveRequest.canBeModified()) {
      return res.status(400).json({
        status: 'error',
        message: 'This leave request cannot be modified. It may have been already processed or the start date has passed.'
      });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        return res.status(400).json({
          status: 'error',
          message: 'Start date cannot be after end date'
        });
      }

      // Check for overlapping leaves (excluding current request)
      const overlappingLeaves = await LeaveRequest.findOverlappingLeaves(
        leaveRequest.teacherId.toString(),
        start,
        end,
        id
      );

      if (overlappingLeaves.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'You already have a leave request for overlapping dates',
          data: {
            overlappingLeaves: overlappingLeaves.map(leave => ({
              id: leave._id,
              dateRange: leave.getFormattedDateRange(),
              status: leave.status,
              leaveType: leave.leaveType
            }))
          }
        });
      }
    }

    // Update fields
    if (leaveType) leaveRequest.leaveType = leaveType;
    if (startDate) leaveRequest.startDate = new Date(startDate);
    if (endDate) leaveRequest.endDate = new Date(endDate);
    if (reason) leaveRequest.reason = reason;
    if (typeof isHalfDay === 'boolean') leaveRequest.isHalfDay = isHalfDay;
    if (halfDaySession) leaveRequest.halfDaySession = halfDaySession;
    if (emergencyContact) leaveRequest.emergencyContact = emergencyContact;
    if (attachments) leaveRequest.attachments = attachments;

    await leaveRequest.save();

    // Populate for response
    await leaveRequest.populate('teacherId', 'name employeeId');

    res.status(200).json({
      status: 'success',
      message: 'Leave request updated successfully',
      data: {
        leaveRequest
      }
    });

  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
    }

    next(error);
  }
};

// Cancel leave request
export const cancelLeaveRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate leave request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid leave request ID'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found'
      });
    }

    // Authorization check
    if (req.user?.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || (teacher._id as any).toString() !== leaveRequest.teacherId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only cancel your own leave requests'
        });
      }
    } else if (req.user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if leave can be cancelled
    if (leaveRequest.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Leave request is already cancelled'
      });
    }

    // Cancel the leave request
    leaveRequest.cancel(reason);
    await leaveRequest.save();

    // Populate for response
    await leaveRequest.populate('teacherId', 'name employeeId');

    res.status(200).json({
      status: 'success',
      message: 'Leave request cancelled successfully',
      data: {
        leaveRequest
      }
    });

  } catch (error) {
    next(error);
  }
};

// Approve leave request (Admin only)
export const approveLeaveRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Validate leave request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid leave request ID'
      });
    }

    // Only admins can approve leave requests
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin access required.'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found'
      });
    }

    // Check if leave can be approved
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending leave requests can be approved'
      });
    }

    // Approve the leave request
    leaveRequest.approve(req.user.id, comments);
    await leaveRequest.save();

    // Populate for response
    await leaveRequest.populate([
      { path: 'teacherId', select: 'name employeeId' },
      { path: 'reviewedBy', select: 'name' }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Leave request approved successfully',
      data: {
        leaveRequest
      }
    });

  } catch (error) {
    next(error);
  }
};

// Reject leave request (Admin only)
export const rejectLeaveRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Validate leave request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid leave request ID'
      });
    }

    // Only admins can reject leave requests
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin access required.'
      });
    }

    // Validate required comments for rejection
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Comments are required when rejecting a leave request'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found'
      });
    }

    // Check if leave can be rejected
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending leave requests can be rejected'
      });
    }

    // Reject the leave request
    leaveRequest.reject(req.user.id, comments);
    await leaveRequest.save();

    // Populate for response
    await leaveRequest.populate([
      { path: 'teacherId', select: 'name employeeId' },
      { path: 'reviewedBy', select: 'name' }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Leave request rejected successfully',
      data: {
        leaveRequest
      }
    });

  } catch (error) {
    next(error);
  }
};