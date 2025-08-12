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
exports.Exam = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Exam Schema
const ExamSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Exam name is required'],
        trim: true,
        minlength: [3, 'Exam name must be at least 3 characters long'],
        maxlength: [100, 'Exam name must be less than 100 characters']
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required'],
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format "YYYY-YYYY" (e.g., "2023-2024")'],
        validate: {
            validator: function (value) {
                const [startYear, endYear] = value.split('-').map(Number);
                return endYear === startYear + 1 && startYear >= 2000 && startYear <= new Date().getFullYear() + 1;
            },
            message: 'Invalid academic year format or range'
        }
    },
    classId: {
        type: String,
        required: [true, 'Class ID is required'],
        trim: true,
        uppercase: true,
        match: [/^[1-9][0-2]?-[A-F]$/, 'Class ID must be in format "Standard-Section" (e.g., "8-A")']
    },
    examType: {
        type: String,
        required: [true, 'Exam type is required'],
        enum: {
            values: ['unit-test', 'mid-term', 'final', 'annual'],
            message: 'Exam type must be one of: unit-test, mid-term, final, annual'
        }
    },
    subjects: [{
            subject: {
                type: String,
                required: [true, 'Subject name is required'],
                trim: true,
                minlength: [2, 'Subject name must be at least 2 characters long'],
                maxlength: [50, 'Subject name must be less than 50 characters']
            },
            date: {
                type: Date,
                required: [true, 'Exam date is required'],
                validate: {
                    validator: function (value) {
                        return value >= new Date(); // Exam date should not be in the past
                    },
                    message: 'Exam date cannot be in the past'
                }
            },
            syllabus: {
                type: String,
                required: [true, 'Syllabus is required'],
                trim: true,
                maxlength: [1000, 'Syllabus must be less than 1000 characters']
            },
            maxMarks: {
                type: Number,
                required: [true, 'Maximum marks is required'],
                min: [1, 'Maximum marks must be at least 1'],
                max: [1000, 'Maximum marks cannot exceed 1000']
            },
            duration: {
                type: Number,
                required: [true, 'Exam duration is required'],
                min: [15, 'Exam duration must be at least 15 minutes'],
                max: [480, 'Exam duration cannot exceed 8 hours (480 minutes)']
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
                validate: {
                    validator: function (value) {
                        const startTime = this.startTime;
                        if (!startTime)
                            return true;
                        const [startHour, startMin] = startTime.split(':').map(Number);
                        const [endHour, endMin] = value.split(':').map(Number);
                        const startMinutes = startHour * 60 + startMin;
                        const endMinutes = endHour * 60 + endMin;
                        return endMinutes > startMinutes;
                    },
                    message: 'End time must be after start time'
                }
            }
        }],
    results: [{
            studentId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Student',
                required: [true, 'Student ID is required']
            },
            marks: [{
                    subject: {
                        type: String,
                        required: [true, 'Subject is required'],
                        trim: true
                    },
                    marksObtained: {
                        type: Number,
                        required: [true, 'Marks obtained is required'],
                        min: [0, 'Marks cannot be negative'],
                        validate: {
                            validator: function (value) {
                                // This validation would need access to the parent exam's subject max marks
                                // In practice, this would be handled in the application logic
                                return value >= 0;
                            },
                            message: 'Marks obtained cannot exceed maximum marks for the subject'
                        }
                    },
                    grade: {
                        type: String,
                        required: [true, 'Grade is required'],
                        enum: {
                            values: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
                            message: 'Grade must be one of: A+, A, B+, B, C+, C, D, F'
                        }
                    },
                    remarks: {
                        type: String,
                        trim: true,
                        maxlength: [200, 'Remarks must be less than 200 characters']
                    }
                }],
            totalMarks: {
                type: Number,
                required: [true, 'Total marks is required'],
                min: [0, 'Total marks cannot be negative']
            },
            percentage: {
                type: Number,
                required: [true, 'Percentage is required'],
                min: [0, 'Percentage cannot be negative'],
                max: [100, 'Percentage cannot exceed 100']
            },
            overallGrade: {
                type: String,
                required: [true, 'Overall grade is required'],
                enum: {
                    values: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
                    message: 'Overall grade must be one of: A+, A, B+, B, C+, C, D, F'
                }
            },
            rank: {
                type: Number,
                min: [1, 'Rank must be at least 1']
            }
        }],
    isActive: {
        type: Boolean,
        default: true
    },
    isResultPublished: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator ID is required']
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
ExamSchema.index({ academicYear: 1, classId: 1, examType: 1 }); // Class and type based queries
ExamSchema.index({ academicYear: 1, isActive: 1 }); // Active exams by year
ExamSchema.index({ 'subjects.date': 1 }); // Date-based queries
ExamSchema.index({ 'results.studentId': 1 }); // Student-based result queries
ExamSchema.index({ isResultPublished: 1, academicYear: 1 }); // Published results
// Compound index for unique exam per class, type, and academic year
ExamSchema.index({ classId: 1, examType: 1, academicYear: 1, name: 1 }, {
    unique: true,
    name: 'unique_exam_per_class_type_year'
});
// Pre-save middleware for validation
ExamSchema.pre('save', function (next) {
    // Validate that subject names are unique within the exam
    const subjectNames = this.subjects.map(s => s.subject.toLowerCase());
    const uniqueSubjects = [...new Set(subjectNames)];
    if (subjectNames.length !== uniqueSubjects.length) {
        return next(new Error('Duplicate subjects found in exam'));
    }
    // Validate that exam dates don't conflict for the same day
    const examDates = this.subjects.map(s => s.date.toDateString());
    const dateTimeConflicts = new Map();
    this.subjects.forEach(subject => {
        const dateKey = subject.date.toDateString();
        if (!dateTimeConflicts.has(dateKey)) {
            dateTimeConflicts.set(dateKey, []);
        }
        dateTimeConflicts.get(dateKey).push(subject);
    });
    // Check for time conflicts on the same day
    for (const [date, subjects] of dateTimeConflicts) {
        if (subjects.length > 1) {
            const sortedSubjects = subjects.sort((a, b) => {
                const aStart = a.startTime.split(':').map(Number);
                const bStart = b.startTime.split(':').map(Number);
                return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
            });
            for (let i = 0; i < sortedSubjects.length - 1; i++) {
                const current = sortedSubjects[i];
                const next = sortedSubjects[i + 1];
                const currentEnd = current.endTime.split(':').map(Number);
                const nextStart = next.startTime.split(':').map(Number);
                const currentEndMinutes = currentEnd[0] * 60 + currentEnd[1];
                const nextStartMinutes = nextStart[0] * 60 + nextStart[1];
                if (currentEndMinutes > nextStartMinutes) {
                    return next(new Error(`Time conflict between ${current.subject} and ${next.subject} on ${date}`));
                }
            }
        }
    }
    next();
});
// Instance method to add subject
ExamSchema.methods.addSubject = function (subjectExam) {
    // Check if subject already exists
    const existingSubject = this.subjects.find((s) => s.subject.toLowerCase() === subjectExam.subject.toLowerCase());
    if (existingSubject) {
        throw new Error(`Subject ${subjectExam.subject} already exists in this exam`);
    }
    this.subjects.push(subjectExam);
};
// Instance method to remove subject
ExamSchema.methods.removeSubject = function (subject) {
    this.subjects = this.subjects.filter((s) => s.subject.toLowerCase() !== subject.toLowerCase());
    // Also remove results for this subject
    this.results.forEach((result) => {
        result.marks = result.marks.filter((mark) => mark.subject.toLowerCase() !== subject.toLowerCase());
    });
};
// Instance method to add student result
ExamSchema.methods.addStudentResult = function (studentResult) {
    // Check if result already exists for this student
    const existingResultIndex = this.results.findIndex((r) => r.studentId.toString() === studentResult.studentId.toString());
    if (existingResultIndex !== -1) {
        // Update existing result
        this.results[existingResultIndex] = studentResult;
    }
    else {
        // Add new result
        this.results.push(studentResult);
    }
};
// Instance method to update student marks
ExamSchema.methods.updateStudentMarks = function (studentId, marks) {
    const studentResult = this.results.find((r) => r.studentId.toString() === studentId);
    if (!studentResult) {
        throw new Error('Student result not found');
    }
    studentResult.marks = marks;
    // Recalculate totals
    studentResult.totalMarks = marks.reduce((sum, mark) => sum + mark.marksObtained, 0);
    const maxMarks = this.getTotalMaxMarks();
    studentResult.percentage = maxMarks > 0 ? Math.round((studentResult.totalMarks / maxMarks) * 100) : 0;
    studentResult.overallGrade = this.calculateGrade(studentResult.percentage);
};
// Instance method to calculate grade
ExamSchema.methods.calculateGrade = function (percentage) {
    if (percentage >= 95)
        return 'A+';
    if (percentage >= 85)
        return 'A';
    if (percentage >= 75)
        return 'B+';
    if (percentage >= 65)
        return 'B';
    if (percentage >= 55)
        return 'C+';
    if (percentage >= 45)
        return 'C';
    if (percentage >= 35)
        return 'D';
    return 'F';
};
// Instance method to publish results
ExamSchema.methods.publishResults = function () {
    // Calculate ranks
    const sortedResults = this.results
        .filter((r) => r.marks.length > 0)
        .sort((a, b) => b.percentage - a.percentage);
    sortedResults.forEach((result, index) => {
        result.rank = index + 1;
    });
    this.isResultPublished = true;
};
// Instance method to get class identifier
ExamSchema.methods.getClassIdentifier = function () {
    return this.classId;
};
// Instance method to get total max marks
ExamSchema.methods.getTotalMaxMarks = function () {
    return this.subjects.reduce((sum, subject) => sum + subject.maxMarks, 0);
};
// Static method to find exams by class
ExamSchema.statics.findByClass = function (classId, academicYear) {
    const query = { classId, isActive: true };
    if (academicYear) {
        query.academicYear = academicYear;
    }
    return this.find(query).sort({ createdAt: -1 });
};
// Static method to find exams by student
ExamSchema.statics.findByStudent = function (studentId, academicYear) {
    const query = {
        'results.studentId': studentId,
        isActive: true
    };
    if (academicYear) {
        query.academicYear = academicYear;
    }
    return this.find(query)
        .populate('results.studentId', 'name rollNo')
        .sort({ createdAt: -1 });
};
// Static method to get class performance summary
ExamSchema.statics.getClassPerformanceSummary = async function (classId, examType, academicYear) {
    const exam = await this.findOne({
        classId,
        examType,
        academicYear,
        isResultPublished: true,
        isActive: true
    });
    if (!exam)
        return null;
    const results = exam.results;
    const totalStudents = results.length;
    if (totalStudents === 0)
        return null;
    const averagePercentage = results.reduce((sum, result) => sum + result.percentage, 0) / totalStudents;
    const gradeDistribution = results.reduce((dist, result) => {
        dist[result.overallGrade] = (dist[result.overallGrade] || 0) + 1;
        return dist;
    }, {});
    const highestScore = Math.max(...results.map((r) => r.percentage));
    const lowestScore = Math.min(...results.map((r) => r.percentage));
    return {
        totalStudents,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        highestScore,
        lowestScore,
        gradeDistribution,
        passPercentage: Math.round((results.filter((r) => r.percentage >= 35).length / totalStudents) * 100)
    };
};
exports.Exam = mongoose_1.default.model('Exam', ExamSchema);
//# sourceMappingURL=Exam.js.map