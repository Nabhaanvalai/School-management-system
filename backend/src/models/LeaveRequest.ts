import mongoose, { Document, Schema } from 'mongoose';

// Leave type enum
export type LeaveType = 'sick' | 'casual' | 'maternity' | 'paternity' | 'emergency' | 'vacation' | 'other';

// Leave status enum
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Main LeaveRequest interface
export interface ILeaveRequest extends Document {
  teacherId: mongoose.Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: Date;
  reviewedDate?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewComments?: string;
  isHalfDay: boolean;
  halfDaySession?: 'morning' | 'afternoon';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  attachments?: string[]; // File paths or URLs
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  approve(reviewedBy: string, comments?: string): void;
  reject(reviewedBy: string, comments: string): void;
  cancel(reason?: string): void;
  calculateTotalDays(): number;
  isOverlapping(otherLeave: ILeaveRequest): boolean;
  getFormattedDateRange(): string;
  canBeModified(): boolean;
}

// LeaveRequest Schema
const LeaveRequestSchema = new Schema<ILeaveRequest>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher ID is required'],
    validate: {
      validator: function(value: mongoose.Types.ObjectId) {
        return mongoose.Types.ObjectId.isValid(value);
      },
      message: 'Invalid teacher ID'
    }
  },
  leaveType: {
    type: String,
    required: [true, 'Leave type is required'],
    enum: {
      values: ['sick', 'casual', 'maternity', 'paternity', 'emergency', 'vacation', 'other'],
      message: 'Leave type must be one of: sick, casual, maternity, paternity, emergency, vacation, other'
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(this: ILeaveRequest, value: Date) {
        // Start date should not be too far in the past (more than 30 days for non-emergency leaves)
        if (this.leaveType !== 'emergency' && this.leaveType !== 'sick') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return value >= thirtyDaysAgo;
        }
        return true;
      },
      message: 'Start date cannot be more than 30 days in the past for non-emergency leaves'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(this: ILeaveRequest, value: Date) {
        return value >= this.startDate;
      },
      message: 'End date must be on or after start date'
    }
  },
  totalDays: {
    type: Number,
    required: [true, 'Total days is required'],
    min: [0.5, 'Total days must be at least 0.5'],
    max: [365, 'Total days cannot exceed 365']
  },
  reason: {
    type: String,
    required: [true, 'Reason for leave is required'],
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters long'],
    maxlength: [1000, 'Reason must be less than 1000 characters']
  },
  status: {
    type: String,
    required: [true, 'Leave status is required'],
    enum: {
      values: ['pending', 'approved', 'rejected', 'cancelled'],
      message: 'Status must be one of: pending, approved, rejected, cancelled'
    },
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reviewedDate: {
    type: Date,
    validate: {
      validator: function(this: ILeaveRequest, value: Date) {
        // Reviewed date should be after applied date
        if (value && this.appliedDate) {
          return value >= this.appliedDate;
        }
        return true;
      },
      message: 'Reviewed date must be after applied date'
    }
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(this: ILeaveRequest, value: mongoose.Types.ObjectId) {
        // Reviewer is required when status is approved or rejected
        if ((this.status === 'approved' || this.status === 'rejected') && !value) {
          return false;
        }
        return true;
      },
      message: 'Reviewer is required when leave is approved or rejected'
    }
  },
  reviewComments: {
    type: String,
    trim: true,
    maxlength: [500, 'Review comments must be less than 500 characters'],
    validate: {
      validator: function(this: ILeaveRequest, value: string) {
        // Review comments are required when status is rejected
        if (this.status === 'rejected' && !value) {
          return false;
        }
        return true;
      },
      message: 'Review comments are required when leave is rejected'
    }
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDaySession: {
    type: String,
    enum: {
      values: ['morning', 'afternoon'],
      message: 'Half day session must be either morning or afternoon'
    },
    validate: {
      validator: function(this: ILeaveRequest, value: string) {
        // Half day session is required when isHalfDay is true
        if (this.isHalfDay && !value) {
          return false;
        }
        // Half day session should only be set when isHalfDay is true
        if (!this.isHalfDay && value) {
          return false;
        }
        return true;
      },
      message: 'Half day session is required when leave is marked as half day'
    }
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact name must be less than 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Emergency contact phone must be 10 digits']
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: [50, 'Relationship must be less than 50 characters']
    }
  },
  attachments: [{
    type: String,
    trim: true,
    maxlength: [500, 'Attachment path must be less than 500 characters']
  }],
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
    },
    default: function() {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      // Academic year starts in April (month 3, 0-indexed)
      if (currentMonth >= 3) {
        return `${currentYear}-${currentYear + 1}`;
      } else {
        return `${currentYear - 1}-${currentYear}`;
      }
    }
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
LeaveRequestSchema.index({ teacherId: 1, academicYear: 1 }); // Teacher leave history
LeaveRequestSchema.index({ status: 1, appliedDate: -1 }); // Status-based queries
LeaveRequestSchema.index({ startDate: 1, endDate: 1 }); // Date range queries
LeaveRequestSchema.index({ reviewedBy: 1, reviewedDate: -1 }); // Reviewer-based queries
LeaveRequestSchema.index({ leaveType: 1, academicYear: 1 }); // Leave type queries
LeaveRequestSchema.index({ academicYear: 1, status: 1 }); // Academic year and status

// Pre-save middleware for business logic
LeaveRequestSchema.pre<ILeaveRequest>('save', function(next) {
  // Calculate total days automatically
  this.totalDays = this.calculateTotalDays();
  
  // Set reviewed date when status changes to approved or rejected
  if ((this.status === 'approved' || this.status === 'rejected') && !this.reviewedDate) {
    this.reviewedDate = new Date();
  }
  
  // Validate half day logic
  if (this.isHalfDay) {
    // Half day leaves should be for single day only
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (startDate.getTime() !== endDate.getTime()) {
      return next(new Error('Half day leave can only be for a single day'));
    }
    
    if (!this.halfDaySession) {
      return next(new Error('Half day session must be specified for half day leaves'));
    }
  }
  
  // Validate emergency contact for certain leave types
  if (['emergency', 'sick', 'maternity', 'paternity'].includes(this.leaveType)) {
    if (!this.emergencyContact || !this.emergencyContact.name || !this.emergencyContact.phone) {
      return next(new Error(`Emergency contact is required for ${this.leaveType} leave`));
    }
  }
  
  next();
});

// Instance method to approve leave
LeaveRequestSchema.methods.approve = function(reviewedBy: string, comments?: string): void {
  if (this.status !== 'pending') {
    throw new Error('Only pending leave requests can be approved');
  }
  
  this.status = 'approved';
  this.reviewedBy = reviewedBy;
  this.reviewedDate = new Date();
  this.reviewComments = comments;
};

// Instance method to reject leave
LeaveRequestSchema.methods.reject = function(reviewedBy: string, comments: string): void {
  if (this.status !== 'pending') {
    throw new Error('Only pending leave requests can be rejected');
  }
  
  this.status = 'rejected';
  this.reviewedBy = reviewedBy;
  this.reviewedDate = new Date();
  this.reviewComments = comments;
};

// Instance method to cancel leave
LeaveRequestSchema.methods.cancel = function(reason?: string): void {
  if (this.status === 'cancelled') {
    throw new Error('Leave request is already cancelled');
  }
  
  this.status = 'cancelled';
  if (reason) {
    this.reviewComments = (this.reviewComments || '') + `\nCancelled: ${reason}`;
  }
};

// Instance method to calculate total days
LeaveRequestSchema.methods.calculateTotalDays = function(): number {
  const startDate = new Date(this.startDate);
  const endDate = new Date(this.endDate);
  
  // Reset time to compare only dates
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  const timeDifference = endDate.getTime() - startDate.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
  
  // For half day leaves
  if (this.isHalfDay) {
    return 0.5;
  }
  
  return daysDifference;
};

// Instance method to check if leave overlaps with another leave
LeaveRequestSchema.methods.isOverlapping = function(otherLeave: ILeaveRequest): boolean {
  const thisStart = new Date(this.startDate);
  const thisEnd = new Date(this.endDate);
  const otherStart = new Date(otherLeave.startDate);
  const otherEnd = new Date(otherLeave.endDate);
  
  // Reset time to compare only dates
  thisStart.setHours(0, 0, 0, 0);
  thisEnd.setHours(23, 59, 59, 999);
  otherStart.setHours(0, 0, 0, 0);
  otherEnd.setHours(23, 59, 59, 999);
  
  return !(thisEnd < otherStart || thisStart > otherEnd);
};

// Instance method to get formatted date range
LeaveRequestSchema.methods.getFormattedDateRange = function(): string {
  const startDate = this.startDate.toISOString().split('T')[0];
  const endDate = this.endDate.toISOString().split('T')[0];
  
  if (startDate === endDate) {
    if (this.isHalfDay) {
      return `${startDate} (${this.halfDaySession} half)`;
    }
    return startDate;
  } else {
    return `${startDate} to ${endDate}`;
  }
};

// Instance method to check if leave can be modified
LeaveRequestSchema.methods.canBeModified = function(): boolean {
  // Only pending leaves can be modified
  if (this.status !== 'pending') return false;
  
  // Cannot modify if start date is in the past (except for emergency/sick leaves)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(this.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  if (startDate < today && !['emergency', 'sick'].includes(this.leaveType)) {
    return false;
  }
  
  return true;
};

// Static method to find leaves by teacher
LeaveRequestSchema.statics.findByTeacher = function(teacherId: string, academicYear?: string) {
  const query: any = { teacherId };
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query)
    .populate('reviewedBy', 'name')
    .sort({ appliedDate: -1 });
};

// Static method to find pending leaves
LeaveRequestSchema.statics.findPendingLeaves = function(academicYear?: string) {
  const query: any = { status: 'pending' };
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query)
    .populate('teacherId', 'name employeeId')
    .sort({ appliedDate: 1 });
};

// Static method to find leaves by date range
LeaveRequestSchema.statics.findByDateRange = function(
  startDate: Date,
  endDate: Date,
  status?: LeaveStatus,
  academicYear?: string
) {
  const query: any = {
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  
  if (status) query.status = status;
  if (academicYear) query.academicYear = academicYear;
  
  return this.find(query)
    .populate('teacherId', 'name employeeId')
    .sort({ startDate: 1 });
};

// Static method to check for overlapping leaves
LeaveRequestSchema.statics.findOverlappingLeaves = async function(
  teacherId: string,
  startDate: Date,
  endDate: Date,
  excludeId?: string
) {
  const query: any = {
    teacherId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Static method to get leave summary for teacher
LeaveRequestSchema.statics.getLeaveSummary = async function(
  teacherId: string,
  academicYear: string
) {
  const summary = await this.aggregate([
    {
      $match: {
        teacherId: new mongoose.Types.ObjectId(teacherId),
        academicYear,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$leaveType',
        totalDays: { $sum: '$totalDays' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result: any = {
    sick: { days: 0, count: 0 },
    casual: { days: 0, count: 0 },
    maternity: { days: 0, count: 0 },
    paternity: { days: 0, count: 0 },
    emergency: { days: 0, count: 0 },
    vacation: { days: 0, count: 0 },
    other: { days: 0, count: 0 },
    total: { days: 0, count: 0 }
  };
  
  summary.forEach((item: any) => {
    result[item._id] = {
      days: item.totalDays,
      count: item.count
    };
    result.total.days += item.totalDays;
    result.total.count += item.count;
  });
  
  return result;
};

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);