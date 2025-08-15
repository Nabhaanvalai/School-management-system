"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Teacher = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Teacher Schema
const TeacherSchema = new mongoose_1.Schema({
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9]{3,10}$/, 'Employee ID must be 3-10 alphanumeric characters']
    },
    name: {
        type: String,
        required: [true, 'Teacher name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name must be less than 100 characters']
    },
    subjects: [{
            type: String,
            required: true,
            trim: true,
            minlength: [2, 'Subject name must be at least 2 characters long'],
            maxlength: [50, 'Subject name must be less than 50 characters']
        }],
    assignedClasses: [{
            standard: {
                type: String,
                required: [true, 'Standard is required for class assignment'],
                enum: {
                    values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
                    message: 'Standard must be between 1 and 12'
                }
            },
            section: {
                type: String,
                required: [true, 'Section is required for class assignment'],
                uppercase: true,
                enum: {
                    values: ['A', 'B', 'C', 'D', 'E', 'F'],
                    message: 'Section must be one of: A, B, C, D, E, F'
                }
            },
            subject: {
                type: String,
                required: [true, 'Subject is required for class assignment'],
                trim: true
            },
            academicYear: {
                type: String,
                default: function () {
                    const currentYear = new Date().getFullYear();
                    return `${currentYear}-${currentYear + 1}`;
                }
            }
        }],
    salary: {
        amount: {
            type: Number,
            required: [true, 'Salary amount is required'],
            min: [0, 'Salary amount must be positive'],
            max: [10000000, 'Salary amount seems too high']
        },
        status: {
            type: String,
            required: true,
            enum: {
                values: ['paid', 'unpaid'],
                message: 'Salary status must be either paid or unpaid'
            },
            default: 'unpaid'
        },
        lastPaidDate: {
            type: Date,
            validate: {
                validator: function (value) {
                    return !value || value <= new Date(); // Cannot be in the future
                },
                message: 'Last paid date cannot be in the future'
            }
        },
        paymentHistory: [{
                amount: {
                    type: Number,
                    required: true,
                    min: [0, 'Payment amount must be positive']
                },
                paidDate: {
                    type: Date,
                    required: true,
                    default: Date.now
                },
                month: {
                    type: String,
                    required: true,
                    enum: {
                        values: ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'],
                        message: 'Invalid month name'
                    }
                },
                year: {
                    type: Number,
                    required: true,
                    min: [2000, 'Year must be 2000 or later'],
                    max: [new Date().getFullYear() + 1, 'Year cannot be more than next year']
                }
            }]
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
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
    },
    dateOfJoining: {
        type: Date,
        required: [true, 'Date of joining is required'],
        validate: {
            validator: function (value) {
                return value <= new Date(); // Cannot be in the future
            },
            message: 'Date of joining cannot be in the future'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true // Allow null values but create index for non-null values
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});
// Indexes for efficient querying
TeacherSchema.index({ employeeId: 1 }, { unique: true });
TeacherSchema.index({ email: 1 }, { unique: true });
TeacherSchema.index({ subjects: 1 }); // Subject-based queries
TeacherSchema.index({ 'assignedClasses.standard': 1, 'assignedClasses.section': 1 }); // Class-based queries
TeacherSchema.index({ 'assignedClasses.subject': 1 }); // Subject assignment queries
TeacherSchema.index({ isActive: 1, dateOfJoining: -1 }); // Active teachers by joining date
TeacherSchema.index({ 'salary.status': 1 }); // Salary status queries
TeacherSchema.index({ name: 1 }); // Name-based searches
// Compound index for unique class-subject assignments per teacher
TeacherSchema.index({
    'assignedClasses.standard': 1,
    'assignedClasses.section': 1,
    'assignedClasses.subject': 1,
    'assignedClasses.academicYear': 1
}, {
    name: 'unique_class_subject_assignment',
    partialFilterExpression: { isActive: true }
});
// Pre-save middleware for business logic validation
TeacherSchema.pre('save', function (next) {
    // Validate that assigned subjects are in the teacher's subjects list
    const teacherSubjects = this.subjects.map(s => s.toLowerCase());
    const invalidAssignments = this.assignedClasses.filter(assignment => !teacherSubjects.includes(assignment.subject.toLowerCase()));
    if (invalidAssignments.length > 0) {
        return next(new Error(`Teacher cannot be assigned to subjects they don't teach: ${invalidAssignments.map(a => a.subject).join(', ')}`));
    }
    // Update salary status based on last payment
    if (this.salary.lastPaidDate) {
        const daysSinceLastPayment = Math.floor((Date.now() - this.salary.lastPaidDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastPayment > 35) { // More than 35 days since last payment
            this.salary.status = 'unpaid';
        }
    }
    next();
});
// Instance method to assign teacher to a class
TeacherSchema.methods.assignToClass = function (standard, section, subject, academicYear) {
    // Check if teacher teaches this subject
    if (!this.subjects.map((s) => s.toLowerCase()).includes(subject.toLowerCase())) {
        throw new Error(`Teacher does not teach ${subject}`);
    }
    // Check if already assigned to this class-subject combination
    const existingAssignment = this.assignedClasses.find((assignment) => assignment.standard === standard &&
        assignment.section === section &&
        assignment.subject.toLowerCase() === subject.toLowerCase() &&
        assignment.academicYear === (academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`));
    if (existingAssignment) {
        throw new Error(`Teacher is already assigned to ${standard}-${section} for ${subject}`);
    }
    // Add new assignment
    this.assignedClasses.push({
        standard,
        section: section.toUpperCase(),
        subject,
        academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    });
};
// Instance method to remove teacher from a class
TeacherSchema.methods.removeFromClass = function (standard, section, subject) {
    this.assignedClasses = this.assignedClasses.filter((assignment) => !(assignment.standard === standard &&
        assignment.section === section.toUpperCase() &&
        assignment.subject.toLowerCase() === subject.toLowerCase()));
};
// Instance method to update salary status
TeacherSchema.methods.updateSalaryStatus = function (status, paidDate) {
    this.salary.status = status;
    if (status === 'paid' && paidDate) {
        this.salary.lastPaidDate = paidDate;
    }
};
// Instance method to add payment record
TeacherSchema.methods.addPaymentRecord = function (amount, month, year) {
    if (!this.salary.paymentHistory) {
        this.salary.paymentHistory = [];
    }
    // Check if payment for this month-year already exists
    const existingPayment = this.salary.paymentHistory.find((payment) => payment.month === month && payment.year === year);
    if (existingPayment) {
        throw new Error(`Payment for ${month} ${year} already recorded`);
    }
    this.salary.paymentHistory.push({
        amount,
        paidDate: new Date(),
        month,
        year
    });
    this.salary.status = 'paid';
    this.salary.lastPaidDate = new Date();
};
// Instance method to get assigned classes count
TeacherSchema.methods.getAssignedClassesCount = function () {
    return this.assignedClasses.length;
};
// Instance method to get subjects count
TeacherSchema.methods.getSubjectsCount = function () {
    return this.subjects.length;
};
// Instance method to get class identifiers
TeacherSchema.methods.getClassIdentifiers = function () {
    return this.assignedClasses.map((assignment) => `${assignment.standard}-${assignment.section}`);
};
// Static method to find teachers by subject
TeacherSchema.statics.findBySubject = function (subject) {
    return this.find({
        subjects: { $regex: new RegExp(subject, 'i') },
        isActive: true
    }).sort({ name: 1 });
};
// Static method to find teachers by class
TeacherSchema.statics.findByClass = function (standard, section) {
    return this.find({
        'assignedClasses.standard': standard,
        'assignedClasses.section': section.toUpperCase(),
        isActive: true
    }).sort({ name: 1 });
};
// Static method to find teachers with unpaid salary
TeacherSchema.statics.findWithUnpaidSalary = function () {
    return this.find({
        'salary.status': 'unpaid',
        isActive: true
    }).sort({ 'salary.lastPaidDate': 1 });
};
// Static method to validate assignment conflicts
TeacherSchema.statics.checkAssignmentConflict = async function (teacherId, standard, section, subject, academicYear) {
    const currentYear = academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const conflictingTeacher = await this.findOne({
        _id: { $ne: teacherId },
        'assignedClasses.standard': standard,
        'assignedClasses.section': section.toUpperCase(),
        'assignedClasses.subject': subject,
        'assignedClasses.academicYear': currentYear,
        isActive: true
    });
    return conflictingTeacher;
};
exports.Teacher = mongoose_1.default.model('Teacher', TeacherSchema);
//# sourceMappingURL=Teacher.js.map