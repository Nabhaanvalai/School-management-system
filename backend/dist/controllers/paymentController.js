"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.updatePayment = exports.getPaymentSummary = exports.getOverduePayments = exports.getTeacherPaymentHistory = exports.getStudentPaymentHistory = exports.updatePaymentStatus = exports.getPaymentById = exports.getPayments = exports.createPayment = void 0;
const Payment_1 = require("../models/Payment");
const Student_1 = require("../models/Student");
const Teacher_1 = require("../models/Teacher");
// Create a new payment record
const createPayment = async (req, res) => {
    try {
        const { paymentType, studentId, teacherId, userId, amount, dueDate, feeCategory, academicYear, month, year, description, remarks } = req.body;
        // Validate required fields
        if (!paymentType || !amount || !dueDate || !academicYear || !description) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: paymentType, amount, dueDate, academicYear, description'
            });
            return;
        }
        // Validate entity existence based on payment type
        if (paymentType === 'student-fee' && studentId) {
            const student = await Student_1.Student.findById(studentId);
            if (!student) {
                res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
                return;
            }
        }
        if (paymentType === 'teacher-salary' && teacherId) {
            const teacher = await Teacher_1.Teacher.findById(teacherId);
            if (!teacher) {
                res.status(404).json({
                    success: false,
                    message: 'Teacher not found'
                });
                return;
            }
        }
        // Create new payment record
        const payment = new Payment_1.Payment({
            paymentType,
            studentId,
            teacherId,
            userId,
            amount,
            dueDate: new Date(dueDate),
            feeCategory,
            academicYear,
            month,
            year,
            description,
            remarks,
            createdBy: req.user.id
        });
        const savedPayment = await payment.save();
        res.status(201).json({
            success: true,
            message: 'Payment record created successfully',
            data: savedPayment
        });
    }
    catch (error) {
        console.error('Error creating payment record:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
            return;
        }
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'Duplicate payment record. This payment may already exist.'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating payment record'
        });
    }
};
exports.createPayment = createPayment;
// Get payment records with filtering options
const getPayments = async (req, res) => {
    try {
        const { paymentType, status, studentId, teacherId, academicYear, month, year, startDate, endDate, page = '1', limit = '50' } = req.query;
        // Build query object
        const query = {};
        if (paymentType) {
            query.paymentType = paymentType;
        }
        if (status) {
            query.status = status;
        }
        if (studentId) {
            query.studentId = studentId;
        }
        if (teacherId) {
            query.teacherId = teacherId;
        }
        if (academicYear) {
            query.academicYear = academicYear;
        }
        if (month) {
            query.month = month;
        }
        if (year) {
            query.year = parseInt(year);
        }
        // Filter by date range
        if (startDate && endDate) {
            query.dueDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        else if (startDate) {
            query.dueDate = { $gte: new Date(startDate) };
        }
        else if (endDate) {
            query.dueDate = { $lte: new Date(endDate) };
        }
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Execute query with pagination
        const payments = await Payment_1.Payment.find(query)
            .populate('studentId', 'name rollNo standard section')
            .populate('teacherId', 'name employeeId')
            .populate('createdBy', 'email role')
            .populate('processedBy', 'email role')
            .sort({ dueDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        // Get total count for pagination
        const totalPayments = await Payment_1.Payment.countDocuments(query);
        const totalPages = Math.ceil(totalPayments / limitNum);
        res.status(200).json({
            success: true,
            message: 'Payment records retrieved successfully',
            data: payments,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalPayments,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error retrieving payment records:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving payment records'
        });
    }
};
exports.getPayments = getPayments;
// Get a specific payment record by ID
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment_1.Payment.findById(id)
            .populate('studentId', 'name rollNo standard section parentContact')
            .populate('teacherId', 'name employeeId')
            .populate('createdBy', 'email role')
            .populate('processedBy', 'email role');
        if (!payment) {
            res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Payment record retrieved successfully',
            data: payment
        });
    }
    catch (error) {
        console.error('Error retrieving payment record:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving payment record'
        });
    }
};
exports.getPaymentById = getPaymentById;
// Update payment status (mark as paid, overdue, etc.)
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentMethod, transactionId, remarks } = req.body;
        if (!status) {
            res.status(400).json({
                success: false,
                message: 'Payment status is required'
            });
            return;
        }
        const payment = await Payment_1.Payment.findById(id);
        if (!payment) {
            res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
            return;
        }
        // Update payment based on status
        if (status === 'paid') {
            if (!paymentMethod) {
                res.status(400).json({
                    success: false,
                    message: 'Payment method is required when marking as paid'
                });
                return;
            }
            payment.markAsPaid(paymentMethod, transactionId, req.user.id);
        }
        else if (status === 'cancelled') {
            payment.cancelPayment(remarks || 'Payment cancelled by admin');
        }
        else {
            payment.status = status;
        }
        if (remarks) {
            payment.remarks = remarks;
        }
        const updatedPayment = await payment.save();
        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: updatedPayment
        });
    }
    catch (error) {
        console.error('Error updating payment status:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating payment status'
        });
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
// Get student fee payment history
const getStudentPaymentHistory = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { academicYear, status } = req.query;
        // Verify student exists
        const student = await Student_1.Student.findById(studentId);
        if (!student) {
            res.status(404).json({
                success: false,
                message: 'Student not found'
            });
            return;
        }
        const query = { studentId, paymentType: 'student-fee' };
        if (academicYear) {
            query.academicYear = academicYear;
        }
        if (status) {
            query.status = status;
        }
        const payments = await Payment_1.Payment.find(query)
            .populate('createdBy', 'email role')
            .populate('processedBy', 'email role')
            .sort({ dueDate: -1 });
        res.status(200).json({
            success: true,
            message: 'Student payment history retrieved successfully',
            data: {
                student: {
                    id: student._id,
                    name: student.name,
                    rollNo: student.rollNo,
                    standard: student.standard,
                    section: student.section
                },
                payments
            }
        });
    }
    catch (error) {
        console.error('Error retrieving student payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving student payment history'
        });
    }
};
exports.getStudentPaymentHistory = getStudentPaymentHistory;
// Get teacher salary payment history
const getTeacherPaymentHistory = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { year, status } = req.query;
        // Verify teacher exists
        const teacher = await Teacher_1.Teacher.findById(teacherId);
        if (!teacher) {
            res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
            return;
        }
        const query = { teacherId, paymentType: 'teacher-salary' };
        if (year) {
            query.year = parseInt(year);
        }
        if (status) {
            query.status = status;
        }
        const payments = await Payment_1.Payment.find(query)
            .populate('createdBy', 'email role')
            .populate('processedBy', 'email role')
            .sort({ year: -1, month: -1 });
        res.status(200).json({
            success: true,
            message: 'Teacher payment history retrieved successfully',
            data: {
                teacher: {
                    id: teacher._id,
                    name: teacher.name,
                    employeeId: teacher.employeeId
                },
                payments
            }
        });
    }
    catch (error) {
        console.error('Error retrieving teacher payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving teacher payment history'
        });
    }
};
exports.getTeacherPaymentHistory = getTeacherPaymentHistory;
// Get overdue payments
const getOverduePayments = async (req, res) => {
    try {
        const { paymentType } = req.query;
        const query = {
            $or: [
                { status: 'overdue' },
                { status: 'pending', dueDate: { $lt: new Date() } }
            ]
        };
        if (paymentType) {
            query.paymentType = paymentType;
        }
        const overduePayments = await Payment_1.Payment.find(query)
            .populate('studentId', 'name rollNo standard section')
            .populate('teacherId', 'name employeeId')
            .sort({ dueDate: 1 });
        res.status(200).json({
            success: true,
            message: 'Overdue payments retrieved successfully',
            data: overduePayments
        });
    }
    catch (error) {
        console.error('Error retrieving overdue payments:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving overdue payments'
        });
    }
};
exports.getOverduePayments = getOverduePayments;
// Get payment summary/statistics
const getPaymentSummary = async (req, res) => {
    try {
        const { paymentType, academicYear, month, year } = req.query;
        if (!paymentType) {
            res.status(400).json({
                success: false,
                message: 'Payment type is required for summary'
            });
            return;
        }
        const summary = await Payment_1.Payment.getPaymentSummary(paymentType, academicYear, month, year ? parseInt(year) : undefined);
        res.status(200).json({
            success: true,
            message: 'Payment summary retrieved successfully',
            data: summary
        });
    }
    catch (error) {
        console.error('Error retrieving payment summary:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving payment summary'
        });
    }
};
exports.getPaymentSummary = getPaymentSummary;
// Update payment record (general update)
const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Remove fields that shouldn't be updated directly
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.receiptNumber; // Auto-generated
        // Convert date strings to Date objects if provided
        if (updateData.dueDate) {
            updateData.dueDate = new Date(updateData.dueDate);
        }
        if (updateData.paidDate) {
            updateData.paidDate = new Date(updateData.paidDate);
        }
        const updatedPayment = await Payment_1.Payment.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).populate('studentId', 'name rollNo standard section')
            .populate('teacherId', 'name employeeId')
            .populate('createdBy', 'email role')
            .populate('processedBy', 'email role');
        if (!updatedPayment) {
            res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Payment record updated successfully',
            data: updatedPayment
        });
    }
    catch (error) {
        console.error('Error updating payment record:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating payment record'
        });
    }
};
exports.updatePayment = updatePayment;
// Delete payment record (soft delete by marking as cancelled)
const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Payment record deleted by admin' } = req.body;
        const payment = await Payment_1.Payment.findById(id);
        if (!payment) {
            res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
            return;
        }
        // Don't allow deletion of paid payments
        if (payment.status === 'paid') {
            res.status(400).json({
                success: false,
                message: 'Cannot delete paid payment records'
            });
            return;
        }
        payment.cancelPayment(reason);
        await payment.save();
        res.status(200).json({
            success: true,
            message: 'Payment record deleted successfully',
            data: payment
        });
    }
    catch (error) {
        console.error('Error deleting payment record:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting payment record'
        });
    }
};
exports.deletePayment = deletePayment;
//# sourceMappingURL=paymentController.js.map