import { Request, Response } from 'express';
import { Payment, IPayment, PaymentType, PaymentStatus, PaymentMethod } from '../models/Payment';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Create a new payment record
export const createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      paymentType,
      studentId,
      teacherId,
      userId,
      amount,
      dueDate,
      feeCategory,
      academicYear,
      month,
      year,
      description,
      remarks
    } = req.body;

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
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found'
        });
        return;
      }
    }

    if (paymentType === 'teacher-salary' && teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
        return;
      }
    }

    // Create new payment record
    const payment = new Payment({
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
      createdBy: req.user!.id
    });

    const savedPayment = await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment record created successfully',
      data: savedPayment
    });
  } catch (error: any) {
    console.error('Error creating payment record:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
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

// Get payment records with filtering options
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      paymentType,
      status,
      studentId,
      teacherId,
      academicYear,
      month,
      year,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    // Build query object
    const query: any = {};

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
      query.year = parseInt(year as string);
    }

    // Filter by date range
    if (startDate && endDate) {
      query.dueDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (startDate) {
      query.dueDate = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      query.dueDate = { $lte: new Date(endDate as string) };
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const payments = await Payment.find(query)
      .populate('studentId', 'name rollNo standard section')
      .populate('teacherId', 'name employeeId')
      .populate('createdBy', 'email role')
      .populate('processedBy', 'email role')
      .sort({ dueDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalPayments = await Payment.countDocuments(query);
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
  } catch (error: any) {
    console.error('Error retrieving payment records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving payment records'
    });
  }
};

// Get a specific payment record by ID
export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
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
  } catch (error: any) {
    console.error('Error retrieving payment record:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving payment record'
    });
  }
};

// Update payment status (mark as paid, overdue, etc.)
export const updatePaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const payment = await Payment.findById(id);

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
      payment.markAsPaid(paymentMethod, transactionId, req.user!.id);
    } else if (status === 'cancelled') {
      payment.cancelPayment(remarks || 'Payment cancelled by admin');
    } else {
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
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
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

// Get student fee payment history
export const getStudentPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { academicYear, status } = req.query;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student not found'
      });
      return;
    }

    const query: any = { studentId, paymentType: 'student-fee' };
    
    if (academicYear) {
      query.academicYear = academicYear;
    }

    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
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
  } catch (error: any) {
    console.error('Error retrieving student payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving student payment history'
    });
  }
};

// Get teacher salary payment history
export const getTeacherPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    const { year, status } = req.query;

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
      return;
    }

    const query: any = { teacherId, paymentType: 'teacher-salary' };
    
    if (year) {
      query.year = parseInt(year as string);
    }

    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
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
  } catch (error: any) {
    console.error('Error retrieving teacher payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving teacher payment history'
    });
  }
};

// Get overdue payments
export const getOverduePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentType } = req.query;

    const query: any = {
      $or: [
        { status: 'overdue' },
        { status: 'pending', dueDate: { $lt: new Date() } }
      ]
    };

    if (paymentType) {
      query.paymentType = paymentType;
    }

    const overduePayments = await Payment.find(query)
      .populate('studentId', 'name rollNo standard section')
      .populate('teacherId', 'name employeeId')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      message: 'Overdue payments retrieved successfully',
      data: overduePayments
    });
  } catch (error: any) {
    console.error('Error retrieving overdue payments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving overdue payments'
    });
  }
};

// Get payment summary/statistics
export const getPaymentSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentType, academicYear, month, year } = req.query;

    if (!paymentType) {
      res.status(400).json({
        success: false,
        message: 'Payment type is required for summary'
      });
      return;
    }

    const summary = await (Payment as any).getPaymentSummary(
      paymentType,
      academicYear as string,
      month as string,
      year ? parseInt(year as string) : undefined
    );

    res.status(200).json({
      success: true,
      message: 'Payment summary retrieved successfully',
      data: summary
    });
  } catch (error: any) {
    console.error('Error retrieving payment summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving payment summary'
    });
  }
};

// Update payment record (general update)
export const updatePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('studentId', 'name rollNo standard section')
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
  } catch (error: any) {
    console.error('Error updating payment record:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
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

// Delete payment record (soft delete by marking as cancelled)
export const deletePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason = 'Payment record deleted by admin' } = req.body;

    const payment = await Payment.findById(id);

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
  } catch (error: any) {
    console.error('Error deleting payment record:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting payment record'
    });
  }
};