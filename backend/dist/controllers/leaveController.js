"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectLeaveRequest = exports.approveLeaveRequest = exports.cancelLeaveRequest = exports.updateLeaveRequest = exports.getLeaveRequestById = exports.getAllLeaveRequests = exports.getTeacherLeaveHistory = exports.createLeaveApplication = void 0;
const LeaveRequest_1 = require("../models/LeaveRequest");
const Teacher_1 = require("../models/Teacher");
const mongoose_1 = __importDefault(require("mongoose"));
// Create leave application
const createLeaveApplication = async (req, res, next) => {
    try {
        const { leaveType, startDate, endDate, reason, isHalfDay = false, halfDaySession, emergencyContact, attachments, academicYear } = req.body;
        // Validate required fields
        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                status: 'error',
                message: 'Leave type, start date, end date, and reason are required'
            });
        }
        // Get teacher ID from authenticated user
        let teacherId;
        if (req.user?.role === 'teacher') {
            // For teachers, use their own profile
            const teacher = await Teacher_1.Teacher.findOne({ userId: req.user.id });
            if (!teacher) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Teacher profile not found'
                });
            }
            teacherId = teacher._id.toString();
        }
        else {
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
        const overlappingLeaves = await LeaveRequest_1.LeaveRequest.findOverlappingLeaves(teacherId, start, end);
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
        const leaveRequest = new LeaveRequest_1.LeaveRequest({
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
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: Object.values(error.errors).map((err) => err.message)
            });
        }
        next(error);
    }
};
exports.createLeaveApplication = createLeaveApplication;
// Get leave history for a teacher
const getTeacherLeaveHistory = async (req, res, next) => {
    try {
        const { teacherId } = req.params;
        const { academicYear, status, page = 1, limit = 10 } = req.query;
        // Validate teacher ID
        if (!mongoose_1.default.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid teacher ID'
            });
        }
        // Authorization check
        if (req.user?.role === 'teacher') {
            // Teachers can only view their own leave history
            const teacher = await Teacher_1.Teacher.findOne({ userId: req.user.id });
            if (!teacher || teacher._id.toString() !== teacherId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You can only view your own leave history'
                });
            }
        }
        else if (req.user?.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }
        // Build query
        const query = { teacherId };
        if (academicYear) {
            query.academicYear = academicYear;
        }
        if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
            query.status = status;
        }
        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get total count for pagination
        const totalCount = await LeaveRequest_1.LeaveRequest.countDocuments(query);
        // Get leave requests
        const leaveRequests = await LeaveRequest_1.LeaveRequest.find(query)
            .populate('teacherId', 'name employeeId')
            .populate('reviewedBy', 'name')
            .sort({ appliedDate: -1 })
            .skip(skip)
            .limit(limitNum);
        // Get leave summary for the academic year
        const currentAcademicYear = academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);
        const leaveSummary = await LeaveRequest_1.LeaveRequest.getLeaveSummary(teacherId, currentAcademicYear);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTeacherLeaveHistory = getTeacherLeaveHistory;
// Get all leave requests (Admin only)
const getAllLeaveRequests = async (req, res, next) => {
    try {
        // Only admins can view all leave requests
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin access required.'
            });
        }
        const { status, academicYear, leaveType, teacherId, startDate, endDate, page = 1, limit = 10 } = req.query;
        // Build query
        const query = {};
        if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
            query.status = status;
        }
        if (academicYear) {
            query.academicYear = academicYear;
        }
        if (leaveType) {
            query.leaveType = leaveType;
        }
        if (teacherId && mongoose_1.default.Types.ObjectId.isValid(teacherId)) {
            query.teacherId = teacherId;
        }
        // Date range filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            query.$or = [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ];
        }
        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get total count for pagination
        const totalCount = await LeaveRequest_1.LeaveRequest.countDocuments(query);
        // Get leave requests
        const leaveRequests = await LeaveRequest_1.LeaveRequest.find(query)
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAllLeaveRequests = getAllLeaveRequests;
// Get single leave request details
const getLeaveRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Validate leave request ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid leave request ID'
            });
        }
        const leaveRequest = await LeaveRequest_1.LeaveRequest.findById(id)
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
            const teacher = await Teacher_1.Teacher.findOne({ userId: req.user.id });
            if (!teacher || teacher._id.toString() !== leaveRequest.teacherId.toString()) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You can only view your own leave requests'
                });
            }
        }
        else if (req.user?.role !== 'admin') {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getLeaveRequestById = getLeaveRequestById;
// Update leave request (only for pending requests by the applicant)
const updateLeaveRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { leaveType, startDate, endDate, reason, isHalfDay, halfDaySession, emergencyContact, attachments } = req.body;
        // Validate leave request ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid leave request ID'
            });
        }
        const leaveRequest = await LeaveRequest_1.LeaveRequest.findById(id);
        if (!leaveRequest) {
            return res.status(404).json({
                status: 'error',
                message: 'Leave request not found'
            });
        }
        // Authorization check - only the applicant can update their own pending requests
        if (req.user?.role === 'teacher') {
            const teacher = await Teacher_1.Teacher.findOne({ userId: req.user.id });
            if (!teacher || teacher._id.toString() !== leaveRequest.teacherId.toString()) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You can only update your own leave requests'
                });
            }
        }
        else {
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
            const overlappingLeaves = await LeaveRequest_1.LeaveRequest.findOverlappingLeaves(leaveRequest.teacherId.toString(), start, end, id);
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
        if (leaveType)
            leaveRequest.leaveType = leaveType;
        if (startDate)
            leaveRequest.startDate = new Date(startDate);
        if (endDate)
            leaveRequest.endDate = new Date(endDate);
        if (reason)
            leaveRequest.reason = reason;
        if (typeof isHalfDay === 'boolean')
            leaveRequest.isHalfDay = isHalfDay;
        if (halfDaySession)
            leaveRequest.halfDaySession = halfDaySession;
        if (emergencyContact)
            leaveRequest.emergencyContact = emergencyContact;
        if (attachments)
            leaveRequest.attachments = attachments;
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
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: Object.values(error.errors).map((err) => err.message)
            });
        }
        next(error);
    }
};
exports.updateLeaveRequest = updateLeaveRequest;
// Cancel leave request
const cancelLeaveRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        // Validate leave request ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid leave request ID'
            });
        }
        const leaveRequest = await LeaveRequest_1.LeaveRequest.findById(id);
        if (!leaveRequest) {
            return res.status(404).json({
                status: 'error',
                message: 'Leave request not found'
            });
        }
        // Authorization check
        if (req.user?.role === 'teacher') {
            const teacher = await Teacher_1.Teacher.findOne({ userId: req.user.id });
            if (!teacher || teacher._id.toString() !== leaveRequest.teacherId.toString()) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You can only cancel your own leave requests'
                });
            }
        }
        else if (req.user?.role !== 'admin') {
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
    }
    catch (error) {
        next(error);
    }
};
exports.cancelLeaveRequest = cancelLeaveRequest;
// Approve leave request (Admin only)
const approveLeaveRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        // Validate leave request ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
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
        const leaveRequest = await LeaveRequest_1.LeaveRequest.findById(id);
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
    }
    catch (error) {
        next(error);
    }
};
exports.approveLeaveRequest = approveLeaveRequest;
// Reject leave request (Admin only)
const rejectLeaveRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        // Validate leave request ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
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
        const leaveRequest = await LeaveRequest_1.LeaveRequest.findById(id);
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
    }
    catch (error) {
        next(error);
    }
};
exports.rejectLeaveRequest = rejectLeaveRequest;
//# sourceMappingURL=leaveController.js.map