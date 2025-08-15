"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.salaryUpdateSchema = exports.teacherAssignmentSchema = exports.teacherFilterSchema = exports.updateTeacherSchema = exports.studentFilterSchema = exports.paginationSchema = exports.createLeaveRequestSchema = exports.createExamSchema = exports.createTimetableSchema = exports.markAttendanceSchema = exports.createTeacherSchema = exports.updateStudentSchema = exports.createStudentSchema = exports.changePasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.handleValidationErrors = void 0;
const joi_1 = __importDefault(require("joi"));
const express_validator_1 = require("express-validator");
// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
/**
 * Validation schemas for common request types
 */
// User authentication schemas
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: joi_1.default.string()
        .min(6)
        .required()
        .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
    })
});
exports.refreshTokenSchema = joi_1.default.object({
    refreshToken: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Refresh token is required'
    })
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Current password is required'
    }),
    newPassword: joi_1.default.string()
        .min(6)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
        'string.min': 'New password must be at least 6 characters long',
        'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, and one number',
        'any.required': 'New password is required'
    })
});
// Student management schemas
exports.createStudentSchema = joi_1.default.object({
    rollNo: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Roll number is required'
    }),
    name: joi_1.default.string()
        .min(2)
        .max(100)
        .required()
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
    }),
    dateOfBirth: joi_1.default.date()
        .max('now')
        .required()
        .messages({
        'date.max': 'Date of birth cannot be in the future',
        'any.required': 'Date of birth is required'
    }),
    admissionDate: joi_1.default.date()
        .max('now')
        .required()
        .messages({
        'date.max': 'Admission date cannot be in the future',
        'any.required': 'Admission date is required'
    }),
    standard: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Standard is required'
    }),
    section: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Section is required'
    }),
    parentContact: joi_1.default.object({
        fatherName: joi_1.default.string()
            .min(2)
            .max(100)
            .required()
            .messages({
            'string.min': 'Father name must be at least 2 characters long',
            'string.max': 'Father name cannot exceed 100 characters',
            'any.required': 'Father name is required'
        }),
        motherName: joi_1.default.string()
            .min(2)
            .max(100)
            .required()
            .messages({
            'string.min': 'Mother name must be at least 2 characters long',
            'string.max': 'Mother name cannot exceed 100 characters',
            'any.required': 'Mother name is required'
        }),
        phone: joi_1.default.string()
            .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
            .required()
            .messages({
            'string.pattern.base': 'Please provide a valid phone number',
            'any.required': 'Phone number is required'
        }),
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        address: joi_1.default.string()
            .min(10)
            .max(500)
            .required()
            .messages({
            'string.min': 'Address must be at least 10 characters long',
            'string.max': 'Address cannot exceed 500 characters',
            'any.required': 'Address is required'
        })
    }).required()
});
exports.updateStudentSchema = joi_1.default.object({
    name: joi_1.default.string()
        .min(2)
        .max(100)
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
    }),
    dateOfBirth: joi_1.default.date()
        .max('now')
        .messages({
        'date.max': 'Date of birth cannot be in the future'
    }),
    standard: joi_1.default.string(),
    section: joi_1.default.string(),
    parentContact: joi_1.default.object({
        fatherName: joi_1.default.string()
            .min(2)
            .max(100)
            .messages({
            'string.min': 'Father name must be at least 2 characters long',
            'string.max': 'Father name cannot exceed 100 characters'
        }),
        motherName: joi_1.default.string()
            .min(2)
            .max(100)
            .messages({
            'string.min': 'Mother name must be at least 2 characters long',
            'string.max': 'Mother name cannot exceed 100 characters'
        }),
        phone: joi_1.default.string()
            .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
            .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),
        email: joi_1.default.string()
            .email()
            .messages({
            'string.email': 'Please provide a valid email address'
        }),
        address: joi_1.default.string()
            .min(10)
            .max(500)
            .messages({
            'string.min': 'Address must be at least 10 characters long',
            'string.max': 'Address cannot exceed 500 characters'
        })
    }),
    status: joi_1.default.string()
        .valid('active', 'left')
        .messages({
        'any.only': 'Status must be either active or left'
    }),
    leavingDate: joi_1.default.date()
        .max('now')
        .messages({
        'date.max': 'Leaving date cannot be in the future'
    })
});
// Teacher management schemas
exports.createTeacherSchema = joi_1.default.object({
    employeeId: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Employee ID is required'
    }),
    name: joi_1.default.string()
        .min(2)
        .max(100)
        .required()
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
    }),
    subjects: joi_1.default.array()
        .items(joi_1.default.string())
        .min(1)
        .required()
        .messages({
        'array.min': 'At least one subject is required',
        'any.required': 'Subjects are required'
    }),
    phone: joi_1.default.string()
        .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
        .required()
        .messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'any.required': 'Phone number is required'
    }),
    address: joi_1.default.string()
        .min(10)
        .max(500)
        .required()
        .messages({
        'string.min': 'Address must be at least 10 characters long',
        'string.max': 'Address cannot exceed 500 characters',
        'any.required': 'Address is required'
    }),
    dateOfJoining: joi_1.default.date()
        .max('now')
        .required()
        .messages({
        'date.max': 'Date of joining cannot be in the future',
        'any.required': 'Date of joining is required'
    }),
    salary: joi_1.default.object({
        amount: joi_1.default.number()
            .positive()
            .required()
            .messages({
            'number.positive': 'Salary amount must be positive',
            'any.required': 'Salary amount is required'
        }),
        status: joi_1.default.string()
            .valid('paid', 'unpaid')
            .default('unpaid')
            .messages({
            'any.only': 'Salary status must be either paid or unpaid'
        })
    }).required()
});
// Attendance schemas
exports.markAttendanceSchema = joi_1.default.object({
    studentId: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Student ID is required'
    }),
    classId: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Class ID is required'
    }),
    subject: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Subject is required'
    }),
    date: joi_1.default.date()
        .max('now')
        .required()
        .messages({
        'date.max': 'Attendance date cannot be in the future',
        'any.required': 'Date is required'
    }),
    status: joi_1.default.string()
        .valid('present', 'absent', 'late')
        .required()
        .messages({
        'any.only': 'Status must be present, absent, or late',
        'any.required': 'Attendance status is required'
    }),
    academicYear: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Academic year is required'
    })
});
// Timetable schemas
exports.createTimetableSchema = joi_1.default.object({
    classId: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Class ID is required'
    }),
    academicYear: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Academic year is required'
    }),
    schedule: joi_1.default.array()
        .items(joi_1.default.object({
        day: joi_1.default.string()
            .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday')
            .required()
            .messages({
            'any.only': 'Day must be a valid weekday',
            'any.required': 'Day is required'
        }),
        periods: joi_1.default.array()
            .items(joi_1.default.object({
            slot: joi_1.default.string()
                .required()
                .messages({
                'any.required': 'Time slot is required'
            }),
            subject: joi_1.default.string()
                .required()
                .messages({
                'any.required': 'Subject is required'
            }),
            teacherId: joi_1.default.string()
                .required()
                .messages({
                'any.required': 'Teacher ID is required'
            }),
            startTime: joi_1.default.string()
                .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .required()
                .messages({
                'string.pattern.base': 'Start time must be in HH:MM format',
                'any.required': 'Start time is required'
            }),
            endTime: joi_1.default.string()
                .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .required()
                .messages({
                'string.pattern.base': 'End time must be in HH:MM format',
                'any.required': 'End time is required'
            })
        }))
            .required()
    }))
        .min(1)
        .required()
        .messages({
        'array.min': 'At least one day schedule is required',
        'any.required': 'Schedule is required'
    })
});
// Exam schemas
exports.createExamSchema = joi_1.default.object({
    name: joi_1.default.string()
        .min(2)
        .max(100)
        .required()
        .messages({
        'string.min': 'Exam name must be at least 2 characters long',
        'string.max': 'Exam name cannot exceed 100 characters',
        'any.required': 'Exam name is required'
    }),
    academicYear: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Academic year is required'
    }),
    subjects: joi_1.default.array()
        .items(joi_1.default.object({
        subject: joi_1.default.string()
            .required()
            .messages({
            'any.required': 'Subject name is required'
        }),
        date: joi_1.default.date()
            .min('now')
            .required()
            .messages({
            'date.min': 'Exam date cannot be in the past',
            'any.required': 'Exam date is required'
        }),
        syllabus: joi_1.default.string()
            .max(1000)
            .messages({
            'string.max': 'Syllabus cannot exceed 1000 characters'
        }),
        maxMarks: joi_1.default.number()
            .positive()
            .required()
            .messages({
            'number.positive': 'Maximum marks must be positive',
            'any.required': 'Maximum marks is required'
        })
    }))
        .min(1)
        .required()
        .messages({
        'array.min': 'At least one subject is required',
        'any.required': 'Subjects are required'
    })
});
// Leave request schemas
exports.createLeaveRequestSchema = joi_1.default.object({
    reason: joi_1.default.string()
        .min(10)
        .max(500)
        .required()
        .messages({
        'string.min': 'Reason must be at least 10 characters long',
        'string.max': 'Reason cannot exceed 500 characters',
        'any.required': 'Reason is required'
    }),
    startDate: joi_1.default.date()
        .min('now')
        .required()
        .messages({
        'date.min': 'Start date cannot be in the past',
        'any.required': 'Start date is required'
    }),
    endDate: joi_1.default.date()
        .min(joi_1.default.ref('startDate'))
        .required()
        .messages({
        'date.min': 'End date must be after start date',
        'any.required': 'End date is required'
    })
});
// Common query parameter schemas
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
    }),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    }),
    sortBy: joi_1.default.string()
        .default('createdAt'),
    sortOrder: joi_1.default.string()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
        'any.only': 'Sort order must be asc or desc'
    })
});
exports.studentFilterSchema = joi_1.default.object({
    standard: joi_1.default.string(),
    section: joi_1.default.string(),
    status: joi_1.default.string()
        .valid('active', 'left')
        .messages({
        'any.only': 'Status must be either active or left'
    }),
    search: joi_1.default.string()
        .max(100)
        .messages({
        'string.max': 'Search term cannot exceed 100 characters'
    })
}).concat(exports.paginationSchema);
exports.updateTeacherSchema = joi_1.default.object({
    name: joi_1.default.string()
        .min(2)
        .max(100)
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
    }),
    subjects: joi_1.default.array()
        .items(joi_1.default.string())
        .min(1)
        .messages({
        'array.min': 'At least one subject is required'
    }),
    phone: joi_1.default.string()
        .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
        .messages({
        'string.pattern.base': 'Please provide a valid phone number'
    }),
    email: joi_1.default.string()
        .email()
        .messages({
        'string.email': 'Please provide a valid email address'
    }),
    address: joi_1.default.string()
        .min(10)
        .max(500)
        .messages({
        'string.min': 'Address must be at least 10 characters long',
        'string.max': 'Address cannot exceed 500 characters'
    }),
    salary: joi_1.default.object({
        amount: joi_1.default.number()
            .positive()
            .messages({
            'number.positive': 'Salary amount must be positive'
        }),
        status: joi_1.default.string()
            .valid('paid', 'unpaid')
            .messages({
            'any.only': 'Salary status must be either paid or unpaid'
        })
    }),
    isActive: joi_1.default.boolean()
});
exports.teacherFilterSchema = joi_1.default.object({
    subjects: joi_1.default.string(), // Will be split by comma in controller
    standard: joi_1.default.string(),
    section: joi_1.default.string(),
    salaryStatus: joi_1.default.string()
        .valid('paid', 'unpaid')
        .messages({
        'any.only': 'Salary status must be either paid or unpaid'
    }),
    isActive: joi_1.default.string()
        .valid('true', 'false')
        .messages({
        'any.only': 'isActive must be true or false'
    }),
    search: joi_1.default.string()
        .max(100)
        .messages({
        'string.max': 'Search term cannot exceed 100 characters'
    })
}).concat(exports.paginationSchema);
exports.teacherAssignmentSchema = joi_1.default.object({
    standard: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Standard is required'
    }),
    section: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Section is required'
    }),
    subject: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Subject is required'
    }),
    academicYear: joi_1.default.string()
        .messages({
        'string.base': 'Academic year must be a string'
    })
});
exports.salaryUpdateSchema = joi_1.default.object({
    status: joi_1.default.string()
        .valid('paid', 'unpaid')
        .required()
        .messages({
        'any.only': 'Status must be either paid or unpaid',
        'any.required': 'Status is required'
    }),
    amount: joi_1.default.number()
        .positive()
        .when('status', {
        is: 'paid',
        then: joi_1.default.optional(),
        otherwise: joi_1.default.forbidden()
    })
        .messages({
        'number.positive': 'Amount must be positive',
        'any.unknown': 'Amount is only allowed when status is paid'
    }),
    month: joi_1.default.string()
        .valid('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December')
        .when('amount', {
        is: joi_1.default.exist(),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .messages({
        'any.only': 'Invalid month name',
        'any.required': 'Month is required when amount is provided'
    }),
    year: joi_1.default.number()
        .integer()
        .min(2000)
        .max(new Date().getFullYear() + 1)
        .when('amount', {
        is: joi_1.default.exist(),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .messages({
        'number.integer': 'Year must be an integer',
        'number.min': 'Year must be 2000 or later',
        'number.max': 'Year cannot be more than next year',
        'any.required': 'Year is required when amount is provided'
    })
});
//# sourceMappingURL=validationSchemas.js.map