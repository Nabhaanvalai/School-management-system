import mongoose, { Document, Schema } from 'mongoose';

// Attendance status enum
export type AttendanceStatus = 'present' | 'absent' | 'late';

// Main Attendance interface
export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  classId: string; // Combination of standard-section (e.g., "8-A")
  subject: string;
  date: Date;
  status: AttendanceStatus;
  markedAt: Date;
  academicYear: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isMarkedToday(): boolean;
  getClassIdentifier(): string;
  getFormattedDate(): string;
  isLate(): boolean;
}

// Attendance Schema
const AttendanceSchema = new Schema<IAttendance>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    validate: {
      validator: function(value: mongoose.Types.ObjectId) {
        return mongoose.Types.ObjectId.isValid(value);
      },
      message: 'Invalid student ID'
    }
  },
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
  classId: {
    type: String,
    required: [true, 'Class ID is required'],
    trim: true,
    uppercase: true,
    match: [/^[1-9][0-2]?-[A-F]$/, 'Class ID must be in format "Standard-Section" (e.g., "8-A")'],
    validate: {
      validator: function(value: string) {
        const [standard, section] = value.split('-');
        const validStandards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        const validSections = ['A', 'B', 'C', 'D', 'E', 'F'];
        return validStandards.includes(standard) && validSections.includes(section);
      },
      message: 'Invalid class ID format'
    }
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    minlength: [2, 'Subject name must be at least 2 characters long'],
    maxlength: [50, 'Subject name must be less than 50 characters']
  },
  date: {
    type: Date,
    required: [true, 'Attendance date is required'],
    validate: {
      validator: function(value: Date) {
        const today = new Date();
        const attendanceDate = new Date(value);
        
        // Reset time to compare only dates
        today.setHours(0, 0, 0, 0);
        attendanceDate.setHours(0, 0, 0, 0);
        
        // Attendance date should not be in the future
        return attendanceDate <= today;
      },
      message: 'Attendance date cannot be in the future'
    }
  },
  status: {
    type: String,
    required: [true, 'Attendance status is required'],
    enum: {
      values: ['present', 'absent', 'late'],
      message: 'Status must be one of: present, absent, late'
    }
  },
  markedAt: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(value: Date) {
        return value <= new Date(); // Cannot be in the future
      },
      message: 'Marked time cannot be in the future'
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
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks must be less than 200 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for efficient querying
AttendanceSchema.index(
  { studentId: 1, date: -1 },
  { name: 'student_attendance_by_date' }
);

AttendanceSchema.index(
  { teacherId: 1, date: -1 },
  { name: 'teacher_attendance_by_date' }
);

AttendanceSchema.index(
  { classId: 1, subject: 1, date: -1 },
  { name: 'class_subject_attendance_by_date' }
);

AttendanceSchema.index(
  { date: -1, academicYear: 1 },
  { name: 'attendance_by_date_academic_year' }
);

AttendanceSchema.index(
  { academicYear: 1, classId: 1, subject: 1 },
  { name: 'academic_class_subject_attendance' }
);

// Unique compound index to prevent duplicate attendance records
AttendanceSchema.index(
  { studentId: 1, classId: 1, subject: 1, date: 1, academicYear: 1 },
  { 
    unique: true,
    name: 'unique_student_attendance_per_day'
  }
);

// Additional indexes for reporting and analytics
AttendanceSchema.index({ status: 1, date: -1 }); // Status-based queries
AttendanceSchema.index({ markedAt: -1 }); // Recently marked attendance

// Pre-save middleware for business logic validation
AttendanceSchema.pre<IAttendance>('save', function(next) {
  // Ensure markedAt is set
  if (!this.markedAt) {
    this.markedAt = new Date();
  }
  
  // Validate that attendance date is not too far in the past (e.g., more than 30 days)
  const daysDifference = Math.floor((Date.now() - this.date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDifference > 30) {
    return next(new Error('Cannot mark attendance for dates more than 30 days in the past'));
  }
  
  // Validate that the date falls within the academic year
  const [startYear, endYear] = this.academicYear.split('-').map(Number);
  const attendanceYear = this.date.getFullYear();
  const attendanceMonth = this.date.getMonth();
  
  // Academic year typically runs from April to March
  const isValidAcademicYear = 
    (attendanceYear === startYear && attendanceMonth >= 3) || // April onwards in start year
    (attendanceYear === endYear && attendanceMonth < 3); // January to March in end year
  
  if (!isValidAcademicYear) {
    return next(new Error(`Attendance date does not fall within academic year ${this.academicYear}`));
  }
  
  next();
});

// Instance method to check if attendance is marked today
AttendanceSchema.methods.isMarkedToday = function(): boolean {
  const today = new Date();
  const markedDate = new Date(this.markedAt);
  
  return (
    today.getDate() === markedDate.getDate() &&
    today.getMonth() === markedDate.getMonth() &&
    today.getFullYear() === markedDate.getFullYear()
  );
};

// Instance method to get class identifier
AttendanceSchema.methods.getClassIdentifier = function(): string {
  return this.classId;
};

// Instance method to get formatted date
AttendanceSchema.methods.getFormattedDate = function(): string {
  return this.date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Instance method to check if student was late
AttendanceSchema.methods.isLate = function(): boolean {
  return this.status === 'late';
};

// Static method to find attendance by student
AttendanceSchema.statics.findByStudent = function(
  studentId: string, 
  startDate?: Date, 
  endDate?: Date,
  academicYear?: string
) {
  const query: any = { studentId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query)
    .populate('teacherId', 'name employeeId')
    .sort({ date: -1 });
};

// Static method to find attendance by class and subject
AttendanceSchema.statics.findByClassAndSubject = function(
  classId: string,
  subject: string,
  date?: Date,
  academicYear?: string
) {
  const query: any = { classId, subject };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query)
    .populate('studentId', 'name rollNo')
    .populate('teacherId', 'name employeeId')
    .sort({ date: -1, 'studentId.rollNo': 1 });
};

// Static method to find attendance by teacher
AttendanceSchema.statics.findByTeacher = function(
  teacherId: string,
  startDate?: Date,
  endDate?: Date,
  academicYear?: string
) {
  const query: any = { teacherId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query)
    .populate('studentId', 'name rollNo standard section')
    .sort({ date: -1, classId: 1, subject: 1 });
};

// Static method to calculate attendance percentage
AttendanceSchema.statics.calculateAttendancePercentage = async function(
  studentId: string,
  subject?: string,
  academicYear?: string
) {
  const query: any = { studentId };
  
  if (subject) {
    query.subject = subject;
  }
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  const totalRecords = await this.countDocuments(query);
  const presentRecords = await this.countDocuments({
    ...query,
    status: { $in: ['present', 'late'] }
  });
  
  return totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
};

// Static method to get attendance summary by class
AttendanceSchema.statics.getClassAttendanceSummary = async function(
  classId: string,
  subject: string,
  startDate: Date,
  endDate: Date,
  academicYear?: string
) {
  const query: any = {
    classId,
    subject,
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  const summary = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    present: 0,
    absent: 0,
    late: 0,
    total: 0
  };
  
  summary.forEach((item: any) => {
    result[item._id as keyof typeof result] = item.count;
    result.total += item.count;
  });
  
  return result;
};

// Static method to check if attendance already exists
AttendanceSchema.statics.attendanceExists = async function(
  studentId: string,
  classId: string,
  subject: string,
  date: Date,
  academicYear: string
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const existingRecord = await this.findOne({
    studentId,
    classId,
    subject,
    date: { $gte: startOfDay, $lte: endOfDay },
    academicYear
  });
  
  return !!existingRecord;
};

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);