import mongoose, { Document, Schema } from 'mongoose';

// Student status enum
export type StudentStatus = 'active' | 'left';

// Parent contact information interface
export interface ParentContact {
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  address: string;
}

// Main Student interface
export interface IStudent extends Document {
  rollNo: string;
  name: string;
  dateOfBirth: Date;
  admissionDate: Date;
  standard: string;
  section: string;
  parentContact: ParentContact;
  status: StudentStatus;
  leavingDate?: Date;
  userId?: mongoose.Types.ObjectId; // Reference to User document
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsLeft(leavingDate?: Date): void;
  markAsActive(): void;
  getFullName(): string;
  getAge(): number;
  getClassIdentifier(): string;
}

// Student Schema
const StudentSchema = new Schema<IStudent>({
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name must be less than 100 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value: Date) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 3 && age <= 25; // Reasonable age range for students
      },
      message: 'Student age must be between 3 and 25 years'
    }
  },
  admissionDate: {
    type: Date,
    required: [true, 'Admission date is required'],
    validate: {
      validator: function(value: Date) {
        return value <= new Date(); // Admission date cannot be in the future
      },
      message: 'Admission date cannot be in the future'
    }
  },
  standard: {
    type: String,
    required: [true, 'Standard is required'],
    trim: true,
    enum: {
      values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      message: 'Standard must be between 1 and 12'
    }
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true,
    enum: {
      values: ['A', 'B', 'C', 'D', 'E', 'F'],
      message: 'Section must be one of: A, B, C, D, E, F'
    }
  },
  parentContact: {
    fatherName: {
      type: String,
      required: [true, 'Father name is required'],
      trim: true,
      minlength: [2, 'Father name must be at least 2 characters long'],
      maxlength: [100, 'Father name must be less than 100 characters']
    },
    motherName: {
      type: String,
      required: [true, 'Mother name is required'],
      trim: true,
      minlength: [2, 'Mother name must be at least 2 characters long'],
      maxlength: [100, 'Mother name must be less than 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Parent phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
    },
    email: {
      type: String,
      required: [true, 'Parent email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      minlength: [10, 'Address must be at least 10 characters long'],
      maxlength: [500, 'Address must be less than 500 characters']
    }
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['active', 'left'],
      message: 'Status must be either active or left'
    },
    default: 'active'
  },
  leavingDate: {
    type: Date,
    validate: {
      validator: function(this: IStudent, value: Date) {
        // If status is 'left', leaving date is required
        if (this.status === 'left' && !value) {
          return false;
        }
        // If leaving date is provided, it should not be before admission date
        if (value && this.admissionDate && value < this.admissionDate) {
          return false;
        }
        // Leaving date cannot be in the future
        if (value && value > new Date()) {
          return false;
        }
        return true;
      },
      message: 'Invalid leaving date'
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true // Allow null values but create index for non-null values
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

// Compound index for unique roll number per standard and section
StudentSchema.index(
  { rollNo: 1, standard: 1, section: 1 }, 
  { 
    unique: true,
    name: 'unique_roll_per_class'
  }
);

// Additional indexes for efficient querying
StudentSchema.index({ standard: 1, section: 1 }); // Class-based queries
StudentSchema.index({ status: 1, admissionDate: -1 }); // Status and date filtering
StudentSchema.index({ name: 1 }); // Name-based searches
StudentSchema.index({ 'parentContact.phone': 1 }); // Parent contact searches
StudentSchema.index({ 'parentContact.email': 1 }); // Parent email searches

// Pre-save middleware for business logic validation
StudentSchema.pre<IStudent>('save', function(next) {
  // Ensure leaving date is set when status is 'left'
  if (this.status === 'left' && !this.leavingDate) {
    this.leavingDate = new Date();
  }
  
  // Clear leaving date when status is 'active'
  if (this.status === 'active') {
    this.leavingDate = undefined;
  }
  
  next();
});

// Instance method to mark student as left
StudentSchema.methods.markAsLeft = function(leavingDate?: Date): void {
  this.status = 'left';
  this.leavingDate = leavingDate || new Date();
};

// Instance method to mark student as active
StudentSchema.methods.markAsActive = function(): void {
  this.status = 'active';
  this.leavingDate = undefined;
};

// Instance method to get full name
StudentSchema.methods.getFullName = function(): string {
  return this.name;
};

// Instance method to calculate age
StudentSchema.methods.getAge = function(): number {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Instance method to get class identifier
StudentSchema.methods.getClassIdentifier = function(): string {
  return `${this.standard}-${this.section}`;
};

// Static method to find students by class
StudentSchema.statics.findByClass = function(standard: string, section: string) {
  return this.find({ standard, section, status: 'active' }).sort({ rollNo: 1 });
};

// Static method to get student count by class
StudentSchema.statics.getCountByClass = function(standard: string, section: string) {
  return this.countDocuments({ standard, section, status: 'active' });
};

// Static method to find students by status
StudentSchema.statics.findByStatus = function(status: StudentStatus) {
  return this.find({ status }).sort({ admissionDate: -1 });
};

// Static method to validate roll number uniqueness
StudentSchema.statics.isRollNoUnique = async function(rollNo: string, standard: string, section: string, excludeId?: string) {
  const query: any = { rollNo, standard, section };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingStudent = await this.findOne(query);
  return !existingStudent;
};

export const Student = mongoose.model<IStudent>('Student', StudentSchema);