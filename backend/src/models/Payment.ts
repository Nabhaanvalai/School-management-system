import mongoose, { Document, Schema } from 'mongoose';

// Payment type enum
export type PaymentType = 'student-fee' | 'teacher-salary' | 'staff-salary' | 'other';

// Payment status enum
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

// Payment method enum
export type PaymentMethod = 'cash' | 'bank-transfer' | 'cheque' | 'online' | 'card';

// Fee category enum for students
export type FeeCategory = 'tuition' | 'admission' | 'exam' | 'transport' | 'library' | 'sports' | 'other';

// Main Payment interface
export interface IPayment extends Document {
  paymentType: PaymentType;
  studentId?: mongoose.Types.ObjectId; // For student fees
  teacherId?: mongoose.Types.ObjectId; // For teacher salary
  userId?: mongoose.Types.ObjectId; // For other staff payments
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  receiptNumber?: string;
  feeCategory?: FeeCategory; // For student fees
  academicYear: string;
  month?: string; // For salary payments
  year?: number; // For salary payments
  description: string;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  processedBy?: mongoose.Types.ObjectId; // Who processed the payment
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsPaid(paymentMethod: PaymentMethod, transactionId?: string, processedBy?: string): void;
  markAsOverdue(): void;
  cancelPayment(reason: string): void;
  isOverdue(): boolean;
  getDaysOverdue(): number;
  generateReceiptNumber(): string;
}

// Payment Schema
const PaymentSchema = new Schema<IPayment>({
  paymentType: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: {
      values: ['student-fee', 'teacher-salary', 'staff-salary', 'other'],
      message: 'Payment type must be one of: student-fee, teacher-salary, staff-salary, other'
    }
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    validate: {
      validator: function(this: IPayment, value: mongoose.Types.ObjectId) {
        // Student ID is required for student fee payments
        if (this.paymentType === 'student-fee' && !value) {
          return false;
        }
        return true;
      },
      message: 'Student ID is required for student fee payments'
    }
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    validate: {
      validator: function(this: IPayment, value: mongoose.Types.ObjectId) {
        // Teacher ID is required for teacher salary payments
        if (this.paymentType === 'teacher-salary' && !value) {
          return false;
        }
        return true;
      },
      message: 'Teacher ID is required for teacher salary payments'
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(this: IPayment, value: mongoose.Types.ObjectId) {
        // User ID is required for staff salary payments
        if (this.paymentType === 'staff-salary' && !value) {
          return false;
        }
        return true;
      },
      message: 'User ID is required for staff salary payments'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative'],
    max: [10000000, 'Payment amount seems too high']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value: Date) {
        // Due date should not be too far in the past (more than 2 years)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return value >= twoYearsAgo;
      },
      message: 'Due date cannot be more than 2 years in the past'
    }
  },
  paidDate: {
    type: Date,
    validate: {
      validator: function(this: IPayment, value: Date) {
        // Paid date should not be before due date (with some tolerance)
        if (value && this.dueDate) {
          const tolerance = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
          return value.getTime() >= (this.dueDate.getTime() - tolerance);
        }
        return true;
      },
      message: 'Paid date cannot be significantly before due date'
    }
  },
  status: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['pending', 'paid', 'overdue', 'cancelled'],
      message: 'Status must be one of: pending, paid, overdue, cancelled'
    },
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'bank-transfer', 'cheque', 'online', 'card'],
      message: 'Payment method must be one of: cash, bank-transfer, cheque, online, card'
    },
    validate: {
      validator: function(this: IPayment, value: string) {
        // Payment method is required when status is paid
        if (this.status === 'paid' && !value) {
          return false;
        }
        return true;
      },
      message: 'Payment method is required when payment is marked as paid'
    }
  },
  transactionId: {
    type: String,
    trim: true,
    maxlength: [100, 'Transaction ID must be less than 100 characters']
  },
  receiptNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness for non-null values
    maxlength: [50, 'Receipt number must be less than 50 characters']
  },
  feeCategory: {
    type: String,
    enum: {
      values: ['tuition', 'admission', 'exam', 'transport', 'library', 'sports', 'other'],
      message: 'Fee category must be one of: tuition, admission, exam, transport, library, sports, other'
    },
    validate: {
      validator: function(this: IPayment, value: string) {
        // Fee category is required for student fee payments
        if (this.paymentType === 'student-fee' && !value) {
          return false;
        }
        return true;
      },
      message: 'Fee category is required for student fee payments'
    }
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format "YYYY-YYYY" (e.g., "2023-2024")'],
    validate: {
      validator: function(value: string) {
        const [startYear, endYear] = value.split('-').map(Number);
        return endYear === startYear + 1 && startYear >= 2000 && startYear <= new Date().getFullYear() + 1;
      },
      message: 'Invalid academic year format or range'
    }
  },
  month: {
    type: String,
    enum: {
      values: ['January', 'February', 'March', 'April', 'May', 'June',
               'July', 'August', 'September', 'October', 'November', 'December'],
      message: 'Invalid month name'
    },
    validate: {
      validator: function(this: IPayment, value: string) {
        // Month is required for salary payments
        if ((this.paymentType === 'teacher-salary' || this.paymentType === 'staff-salary') && !value) {
          return false;
        }
        return true;
      },
      message: 'Month is required for salary payments'
    }
  },
  year: {
    type: Number,
    min: [2000, 'Year must be 2000 or later'],
    max: [new Date().getFullYear() + 1, 'Year cannot be more than next year'],
    validate: {
      validator: function(this: IPayment, value: number) {
        // Year is required for salary payments
        if ((this.paymentType === 'teacher-salary' || this.paymentType === 'staff-salary') && !value) {
          return false;
        }
        return true;
      },
      message: 'Year is required for salary payments'
    }
  },
  description: {
    type: String,
    required: [true, 'Payment description is required'],
    trim: true,
    minlength: [5, 'Description must be at least 5 characters long'],
    maxlength: [500, 'Description must be less than 500 characters']
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [1000, 'Remarks must be less than 1000 characters']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for efficient querying
PaymentSchema.index({ paymentType: 1, status: 1 }); // Type and status queries
PaymentSchema.index({ studentId: 1, academicYear: 1 }); // Student payment history
PaymentSchema.index({ teacherId: 1, year: 1, month: 1 }); // Teacher salary queries
PaymentSchema.index({ dueDate: 1, status: 1 }); // Due date and status queries
PaymentSchema.index({ academicYear: 1, paymentType: 1 }); // Academic year queries
PaymentSchema.index({ status: 1, dueDate: 1 }); // Overdue payment queries
PaymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true }); // Receipt number uniqueness
PaymentSchema.index({ createdBy: 1, createdAt: -1 }); // Creator-based queries

// Compound index for unique salary payments
PaymentSchema.index(
  { teacherId: 1, month: 1, year: 1, paymentType: 1 },
  { 
    unique: true,
    partialFilterExpression: { paymentType: { $in: ['teacher-salary', 'staff-salary'] } },
    name: 'unique_salary_payment'
  }
);

// Pre-save middleware for business logic
PaymentSchema.pre<IPayment>('save', function(next) {
  // Auto-generate receipt number for paid payments
  if (this.status === 'paid' && !this.receiptNumber) {
    this.receiptNumber = this.generateReceiptNumber();
  }
  
  // Set paid date when marking as paid
  if (this.status === 'paid' && !this.paidDate) {
    this.paidDate = new Date();
  }
  
  // Clear paid date and payment method when not paid
  if (this.status !== 'paid') {
    this.paidDate = undefined;
    this.paymentMethod = undefined;
    this.transactionId = undefined;
  }
  
  // Auto-mark as overdue if past due date
  if (this.status === 'pending' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  
  next();
});

// Instance method to mark payment as paid
PaymentSchema.methods.markAsPaid = function(
  paymentMethod: PaymentMethod, 
  transactionId?: string, 
  processedBy?: string
): void {
  this.status = 'paid';
  this.paymentMethod = paymentMethod;
  this.paidDate = new Date();
  this.transactionId = transactionId;
  this.processedBy = processedBy;
  
  if (!this.receiptNumber) {
    this.receiptNumber = this.generateReceiptNumber();
  }
};

// Instance method to mark payment as overdue
PaymentSchema.methods.markAsOverdue = function(): void {
  if (this.status === 'pending' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
};

// Instance method to cancel payment
PaymentSchema.methods.cancelPayment = function(reason: string): void {
  this.status = 'cancelled';
  this.remarks = (this.remarks || '') + `\nCancelled: ${reason}`;
};

// Instance method to check if payment is overdue
PaymentSchema.methods.isOverdue = function(): boolean {
  return this.status === 'overdue' || (this.status === 'pending' && this.dueDate < new Date());
};

// Instance method to get days overdue
PaymentSchema.methods.getDaysOverdue = function(): number {
  if (!this.isOverdue()) return 0;
  
  const today = new Date();
  const timeDifference = today.getTime() - this.dueDate.getTime();
  return Math.floor(timeDifference / (1000 * 3600 * 24));
};

// Instance method to generate receipt number
PaymentSchema.methods.generateReceiptNumber = function(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  let prefix = 'RCP';
  if (this.paymentType === 'student-fee') prefix = 'FEE';
  else if (this.paymentType === 'teacher-salary') prefix = 'SAL';
  else if (this.paymentType === 'staff-salary') prefix = 'STF';
  
  return `${prefix}${year}${month}${random}`;
};

// Static method to find payments by student
PaymentSchema.statics.findByStudent = function(studentId: string, academicYear?: string) {
  const query: any = { studentId, paymentType: 'student-fee' };
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query).sort({ dueDate: -1 });
};

// Static method to find payments by teacher
PaymentSchema.statics.findByTeacher = function(teacherId: string, year?: number) {
  const query: any = { teacherId, paymentType: 'teacher-salary' };
  if (year) {
    query.year = year;
  }
  
  return this.find(query).sort({ year: -1, month: -1 });
};

// Static method to find overdue payments
PaymentSchema.statics.findOverduePayments = function(paymentType?: PaymentType) {
  const query: any = {
    $or: [
      { status: 'overdue' },
      { status: 'pending', dueDate: { $lt: new Date() } }
    ]
  };
  
  if (paymentType) {
    query.paymentType = paymentType;
  }
  
  return this.find(query).sort({ dueDate: 1 });
};

// Static method to get payment summary
PaymentSchema.statics.getPaymentSummary = async function(
  paymentType: PaymentType,
  academicYear?: string,
  month?: string,
  year?: number
) {
  const query: any = { paymentType };
  
  if (academicYear) query.academicYear = academicYear;
  if (month) query.month = month;
  if (year) query.year = year;
  
  const summary = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const result = {
    pending: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 }
  };
  
  summary.forEach((item: any) => {
    result[item._id as keyof typeof result] = {
      count: item.count,
      amount: item.totalAmount
    };
    result.total.count += item.count;
    result.total.amount += item.totalAmount;
  });
  
  return result;
};

// Static method to find payments by date range
PaymentSchema.statics.findByDateRange = function(
  startDate: Date,
  endDate: Date,
  paymentType?: PaymentType,
  status?: PaymentStatus
) {
  const query: any = {
    dueDate: { $gte: startDate, $lte: endDate }
  };
  
  if (paymentType) query.paymentType = paymentType;
  if (status) query.status = status;
  
  return this.find(query).sort({ dueDate: 1 });
};

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);