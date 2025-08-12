import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define user roles
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

// Profile interfaces for different user types
export interface AdminProfile {
  name: string;
  employeeId: string;
  department: string;
  phone: string;
}

export interface TeacherProfile {
  name: string;
  employeeId: string;
  subjects: string[];
  phone: string;
  address: string;
  dateOfJoining: Date;
}

export interface StudentProfile {
  name: string;
  rollNo: string;
  standard: string;
  section: string;
  dateOfBirth: Date;
  admissionDate: Date;
  parentContact: {
    fatherName: string;
    motherName: string;
    phone: string;
    email: string;
    address: string;
  };
}

export interface ParentProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  children: mongoose.Types.ObjectId[]; // References to Student documents
}

// Main User interface
export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  profile: AdminProfile | TeacherProfile | StudentProfile | ParentProfile;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hashPassword(): Promise<void>;
}

// User Schema
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    required: [true, 'User role is required'],
    enum: {
      values: ['admin', 'teacher', 'student', 'parent'],
      message: 'Role must be one of: admin, teacher, student, parent'
    }
  },
  profile: {
    type: Schema.Types.Mixed,
    required: [true, 'User profile is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete (ret as any).password;
      return ret;
    }
  }
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.employeeId': 1 }, { sparse: true });
UserSchema.index({ 'profile.rollNo': 1, 'profile.standard': 1, 'profile.section': 1 }, { sparse: true });

// Pre-save middleware to hash password
UserSchema.pre<IUser>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    await this.hashPassword();
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to hash password
UserSchema.methods.hashPassword = async function(): Promise<void> {
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
};

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to validate profile based on role
UserSchema.statics.validateProfile = function(role: UserRole, profile: any): boolean {
  switch (role) {
    case 'admin':
      return profile.name && profile.employeeId && profile.department && profile.phone;
    case 'teacher':
      return profile.name && profile.employeeId && profile.subjects && 
             Array.isArray(profile.subjects) && profile.phone && profile.address && profile.dateOfJoining;
    case 'student':
      return profile.name && profile.rollNo && profile.standard && profile.section &&
             profile.dateOfBirth && profile.admissionDate && profile.parentContact &&
             profile.parentContact.fatherName && profile.parentContact.motherName &&
             profile.parentContact.phone && profile.parentContact.email && profile.parentContact.address;
    case 'parent':
      return profile.name && profile.phone && profile.email && profile.address &&
             profile.children && Array.isArray(profile.children);
    default:
      return false;
  }
};

// Custom validation for profile based on role
UserSchema.pre<IUser>('validate', function(next) {
  const UserModel = this.constructor as any;
  if (!UserModel.validateProfile(this.role, this.profile)) {
    return next(new Error(`Invalid profile data for role: ${this.role}`));
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);