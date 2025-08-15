import mongoose, { Document, Schema } from 'mongoose';

// Event type enum
export type EventType = 'holiday' | 'exam' | 'sports-day' | 'annual-day' | 'parent-meeting' | 'workshop' | 'other';

// Event priority enum
export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

// Main AcademicCalendar interface
export interface IAcademicCalendar extends Document {
  title: string;
  description: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  location?: string;
  priority: EventPriority;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: Date;
  academicYear: string;
  targetAudience: ('all' | 'students' | 'teachers' | 'parents' | 'staff')[];
  classIds?: string[]; // Specific classes if not for all
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isEventToday(): boolean;
  isEventThisWeek(): boolean;
  getDuration(): number;
  getFormattedDate(): string;
  isTargetedTo(audience: string): boolean;
}

// AcademicCalendar Schema
const AcademicCalendarSchema = new Schema<IAcademicCalendar>({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title must be less than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description must be less than 1000 characters']
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: {
      values: ['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'],
      message: 'Event type must be one of: holiday, exam, sports-day, annual-day, parent-meeting, workshop, other'
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(this: IAcademicCalendar, value: Date) {
        // Start date should not be too far in the past (more than 1 year)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return value >= oneYearAgo;
      },
      message: 'Start date cannot be more than 1 year in the past'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(this: IAcademicCalendar, value: Date) {
        return value >= this.startDate;
      },
      message: 'End date must be on or after start date'
    }
  },
  isAllDay: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'],
    validate: {
      validator: function(this: IAcademicCalendar, value: string) {
        // If not all day, start time is required
        if (!this.isAllDay && !value) {
          return false;
        }
        return true;
      },
      message: 'Start time is required for non-all-day events'
    }
  },
  endTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
    validate: {
      validator: function(this: IAcademicCalendar, value: string) {
        // If not all day, end time is required
        if (!this.isAllDay && !value) {
          return false;
        }
        
        // If both start and end times are provided, end time should be after start time
        if (this.startTime && value) {
          const [startHour, startMin] = this.startTime.split(':').map(Number);
          const [endHour, endMin] = value.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          return endMinutes > startMinutes;
        }
        
        return true;
      },
      message: 'End time must be after start time'
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location must be less than 200 characters']
  },
  priority: {
    type: String,
    required: [true, 'Event priority is required'],
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Priority must be one of: low, medium, high, critical'
    },
    default: 'medium'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: {
      values: ['daily', 'weekly', 'monthly', 'yearly'],
      message: 'Recurring pattern must be one of: daily, weekly, monthly, yearly'
    },
    validate: {
      validator: function(this: IAcademicCalendar, value: string) {
        // If recurring, pattern is required
        if (this.isRecurring && !value) {
          return false;
        }
        return true;
      },
      message: 'Recurring pattern is required for recurring events'
    }
  },
  recurringEndDate: {
    type: Date,
    validate: {
      validator: function(this: IAcademicCalendar, value: Date) {
        // If recurring, end date should be provided and after start date
        if (this.isRecurring) {
          return value && value > this.startDate;
        }
        return true;
      },
      message: 'Recurring end date must be after start date for recurring events'
    }
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format "YYYY-YYYY" (e.g., "2023-2024")'],
    validate: {
      validator: function(value: string) {
        const [startYear, endYear] = value.split('-').map(Number);
        return endYear === startYear + 1 && startYear >= 2000 && startYear <= new Date().getFullYear() + 5;
      },
      message: 'Invalid academic year format or range'
    }
  },
  targetAudience: [{
    type: String,
    required: true,
    enum: {
      values: ['all', 'students', 'teachers', 'parents', 'staff'],
      message: 'Target audience must be one of: all, students, teachers, parents, staff'
    }
  }],
  classIds: [{
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[1-9][0-2]?-[A-F]$/, 'Class ID must be in format "Standard-Section" (e.g., "8-A")']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
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

// Indexes for efficient querying
AcademicCalendarSchema.index({ startDate: 1, endDate: 1 }); // Date range queries
AcademicCalendarSchema.index({ academicYear: 1, eventType: 1 }); // Academic year and type queries
AcademicCalendarSchema.index({ targetAudience: 1, isActive: 1 }); // Audience-based queries
AcademicCalendarSchema.index({ classIds: 1, academicYear: 1 }); // Class-specific events
AcademicCalendarSchema.index({ priority: 1, startDate: 1 }); // Priority-based queries
AcademicCalendarSchema.index({ isRecurring: 1, recurringEndDate: 1 }); // Recurring events
AcademicCalendarSchema.index({ createdBy: 1, createdAt: -1 }); // Creator-based queries

// Pre-save middleware for validation
AcademicCalendarSchema.pre<IAcademicCalendar>('save', function(next) {
  // Validate target audience
  if (this.targetAudience.includes('all') && this.targetAudience.length > 1) {
    return next(new Error('Cannot specify other audiences when "all" is selected'));
  }
  
  // Validate class IDs when not targeting all
  if (!this.targetAudience.includes('all') && this.targetAudience.includes('students') && 
      (!this.classIds || this.classIds.length === 0)) {
    // Allow events for students without specific class IDs (applies to all classes)
  }
  
  // Validate recurring event settings
  if (this.isRecurring) {
    if (!this.recurringPattern) {
      return next(new Error('Recurring pattern is required for recurring events'));
    }
    if (!this.recurringEndDate) {
      return next(new Error('Recurring end date is required for recurring events'));
    }
    if (this.recurringEndDate <= this.startDate) {
      return next(new Error('Recurring end date must be after start date'));
    }
  }
  
  // Validate time settings for non-all-day events
  if (!this.isAllDay) {
    if (!this.startTime || !this.endTime) {
      return next(new Error('Start time and end time are required for non-all-day events'));
    }
  }
  
  next();
});

// Instance method to check if event is today
AcademicCalendarSchema.methods.isEventToday = function(): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventStart = new Date(this.startDate);
  eventStart.setHours(0, 0, 0, 0);
  
  const eventEnd = new Date(this.endDate);
  eventEnd.setHours(23, 59, 59, 999);
  
  return today >= eventStart && today <= eventEnd;
};

// Instance method to check if event is this week
AcademicCalendarSchema.methods.isEventThisWeek = function(): boolean {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const eventStart = new Date(this.startDate);
  const eventEnd = new Date(this.endDate);
  
  return (eventStart <= endOfWeek && eventEnd >= startOfWeek);
};

// Instance method to get event duration in days
AcademicCalendarSchema.methods.getDuration = function(): number {
  const startDate = new Date(this.startDate);
  const endDate = new Date(this.endDate);
  
  const timeDifference = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
};

// Instance method to get formatted date
AcademicCalendarSchema.methods.getFormattedDate = function(): string {
  const startDate = this.startDate.toISOString().split('T')[0];
  const endDate = this.endDate.toISOString().split('T')[0];
  
  if (startDate === endDate) {
    return startDate;
  } else {
    return `${startDate} to ${endDate}`;
  }
};

// Instance method to check if event is targeted to specific audience
AcademicCalendarSchema.methods.isTargetedTo = function(audience: string): boolean {
  return this.targetAudience.includes('all') || this.targetAudience.includes(audience);
};

// Static method to find events by date range
AcademicCalendarSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, academicYear?: string) {
  const query: any = {
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ],
    isActive: true
  };
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query).sort({ startDate: 1, priority: -1 });
};

// Static method to find events by audience
AcademicCalendarSchema.statics.findByAudience = function(audience: string, academicYear?: string) {
  const query: any = {
    $or: [
      { targetAudience: 'all' },
      { targetAudience: audience }
    ],
    isActive: true
  };
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query).sort({ startDate: 1, priority: -1 });
};

// Static method to find events by class
AcademicCalendarSchema.statics.findByClass = function(classId: string, academicYear?: string) {
  const query: any = {
    $or: [
      { targetAudience: 'all' },
      { targetAudience: 'students', classIds: { $in: [classId] } },
      { targetAudience: 'students', classIds: { $exists: false } }, // Events for all students
      { targetAudience: 'students', classIds: { $size: 0 } } // Events for all students
    ],
    isActive: true
  };
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query).sort({ startDate: 1, priority: -1 });
};

// Static method to find upcoming events
AcademicCalendarSchema.statics.findUpcomingEvents = function(days: number = 7, academicYear?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  futureDate.setHours(23, 59, 59, 999);
  
  const query: any = {
    startDate: { $gte: today, $lte: futureDate },
    isActive: true
  };
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query).sort({ startDate: 1, priority: -1 });
};

// Static method to find events by type
AcademicCalendarSchema.statics.findByEventType = function(eventType: EventType, academicYear?: string) {
  const query: any = { eventType, isActive: true };
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  return this.find(query).sort({ startDate: 1 });
};

// Static method to find holidays
AcademicCalendarSchema.statics.findHolidays = function(academicYear?: string) {
  return this.findByEventType('holiday', academicYear);
};

export const AcademicCalendar = mongoose.model<IAcademicCalendar>('AcademicCalendar', AcademicCalendarSchema);