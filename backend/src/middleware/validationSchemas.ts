import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validation schemas for common request types
 */

// User authentication schemas
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
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
export const createStudentSchema = Joi.object({
  rollNo: Joi.string()
    .required()
    .messages({
      'any.required': 'Roll number is required'
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  dateOfBirth: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required'
    }),
  admissionDate: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Admission date cannot be in the future',
      'any.required': 'Admission date is required'
    }),
  standard: Joi.string()
    .required()
    .messages({
      'any.required': 'Standard is required'
    }),
  section: Joi.string()
    .required()
    .messages({
      'any.required': 'Section is required'
    }),
  parentContact: Joi.object({
    fatherName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Father name must be at least 2 characters long',
        'string.max': 'Father name cannot exceed 100 characters',
        'any.required': 'Father name is required'
      }),
    motherName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Mother name must be at least 2 characters long',
        'string.max': 'Mother name cannot exceed 100 characters',
        'any.required': 'Mother name is required'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'any.required': 'Phone number is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    address: Joi.string()
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

export const updateStudentSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  dateOfBirth: Joi.date()
    .max('now')
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
  standard: Joi.string(),
  section: Joi.string(),
  parentContact: Joi.object({
    fatherName: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Father name must be at least 2 characters long',
        'string.max': 'Father name cannot exceed 100 characters'
      }),
    motherName: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Mother name must be at least 2 characters long',
        'string.max': 'Mother name cannot exceed 100 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    email: Joi.string()
      .email()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    address: Joi.string()
      .min(10)
      .max(500)
      .messages({
        'string.min': 'Address must be at least 10 characters long',
        'string.max': 'Address cannot exceed 500 characters'
      })
  }),
  status: Joi.string()
    .valid('active', 'left')
    .messages({
      'any.only': 'Status must be either active or left'
    }),
  leavingDate: Joi.date()
    .max('now')
    .messages({
      'date.max': 'Leaving date cannot be in the future'
    })
});

// Teacher management schemas
export const createTeacherSchema = Joi.object({
  employeeId: Joi.string()
    .required()
    .messages({
      'any.required': 'Employee ID is required'
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  subjects: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one subject is required',
      'any.required': 'Subjects are required'
    }),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required'
    }),
  address: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Address must be at least 10 characters long',
      'string.max': 'Address cannot exceed 500 characters',
      'any.required': 'Address is required'
    }),
  dateOfJoining: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Date of joining cannot be in the future',
      'any.required': 'Date of joining is required'
    }),
  salary: Joi.object({
    amount: Joi.number()
      .positive()
      .required()
      .messages({
        'number.positive': 'Salary amount must be positive',
        'any.required': 'Salary amount is required'
      }),
    status: Joi.string()
      .valid('paid', 'unpaid')
      .default('unpaid')
      .messages({
        'any.only': 'Salary status must be either paid or unpaid'
      })
  }).required()
});

// Attendance schemas
export const markAttendanceSchema = Joi.object({
  studentId: Joi.string()
    .required()
    .messages({
      'any.required': 'Student ID is required'
    }),
  classId: Joi.string()
    .required()
    .messages({
      'any.required': 'Class ID is required'
    }),
  subject: Joi.string()
    .required()
    .messages({
      'any.required': 'Subject is required'
    }),
  date: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Attendance date cannot be in the future',
      'any.required': 'Date is required'
    }),
  status: Joi.string()
    .valid('present', 'absent', 'late')
    .required()
    .messages({
      'any.only': 'Status must be present, absent, or late',
      'any.required': 'Attendance status is required'
    }),
  academicYear: Joi.string()
    .required()
    .messages({
      'any.required': 'Academic year is required'
    })
});

// Timetable schemas
export const createTimetableSchema = Joi.object({
  classId: Joi.string()
    .required()
    .messages({
      'any.required': 'Class ID is required'
    }),
  academicYear: Joi.string()
    .required()
    .messages({
      'any.required': 'Academic year is required'
    }),
  schedule: Joi.array()
    .items(
      Joi.object({
        day: Joi.string()
          .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday')
          .required()
          .messages({
            'any.only': 'Day must be a valid weekday',
            'any.required': 'Day is required'
          }),
        periods: Joi.array()
          .items(
            Joi.object({
              slot: Joi.string()
                .required()
                .messages({
                  'any.required': 'Time slot is required'
                }),
              subject: Joi.string()
                .required()
                .messages({
                  'any.required': 'Subject is required'
                }),
              teacherId: Joi.string()
                .required()
                .messages({
                  'any.required': 'Teacher ID is required'
                }),
              startTime: Joi.string()
                .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .required()
                .messages({
                  'string.pattern.base': 'Start time must be in HH:MM format',
                  'any.required': 'Start time is required'
                }),
              endTime: Joi.string()
                .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .required()
                .messages({
                  'string.pattern.base': 'End time must be in HH:MM format',
                  'any.required': 'End time is required'
                })
            })
          )
          .required()
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one day schedule is required',
      'any.required': 'Schedule is required'
    })
});

// Exam schemas
export const createExamSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Exam name must be at least 2 characters long',
      'string.max': 'Exam name cannot exceed 100 characters',
      'any.required': 'Exam name is required'
    }),
  academicYear: Joi.string()
    .required()
    .messages({
      'any.required': 'Academic year is required'
    }),
  subjects: Joi.array()
    .items(
      Joi.object({
        subject: Joi.string()
          .required()
          .messages({
            'any.required': 'Subject name is required'
          }),
        date: Joi.date()
          .min('now')
          .required()
          .messages({
            'date.min': 'Exam date cannot be in the past',
            'any.required': 'Exam date is required'
          }),
        syllabus: Joi.string()
          .max(1000)
          .messages({
            'string.max': 'Syllabus cannot exceed 1000 characters'
          }),
        maxMarks: Joi.number()
          .positive()
          .required()
          .messages({
            'number.positive': 'Maximum marks must be positive',
            'any.required': 'Maximum marks is required'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one subject is required',
      'any.required': 'Subjects are required'
    })
});

// Leave request schemas
export const createLeaveRequestSchema = Joi.object({
  reason: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Reason must be at least 10 characters long',
      'string.max': 'Reason cannot exceed 500 characters',
      'any.required': 'Reason is required'
    }),
  startDate: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.min': 'Start date cannot be in the past',
      'any.required': 'Start date is required'
    }),
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'date.min': 'End date must be after start date',
      'any.required': 'End date is required'
    })
});

// Common query parameter schemas
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  sortBy: Joi.string()
    .default('createdAt'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc'
    })
});

export const studentFilterSchema = Joi.object({
  standard: Joi.string(),
  section: Joi.string(),
  status: Joi.string()
    .valid('active', 'left')
    .messages({
      'any.only': 'Status must be either active or left'
    }),
  search: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    })
}).concat(paginationSchema);

export const updateTeacherSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  subjects: Joi.array()
    .items(Joi.string())
    .min(1)
    .messages({
      'array.min': 'At least one subject is required'
    }),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  address: Joi.string()
    .min(10)
    .max(500)
    .messages({
      'string.min': 'Address must be at least 10 characters long',
      'string.max': 'Address cannot exceed 500 characters'
    }),
  salary: Joi.object({
    amount: Joi.number()
      .positive()
      .messages({
        'number.positive': 'Salary amount must be positive'
      }),
    status: Joi.string()
      .valid('paid', 'unpaid')
      .messages({
        'any.only': 'Salary status must be either paid or unpaid'
      })
  }),
  isActive: Joi.boolean()
});

export const teacherFilterSchema = Joi.object({
  subjects: Joi.string(), // Will be split by comma in controller
  standard: Joi.string(),
  section: Joi.string(),
  salaryStatus: Joi.string()
    .valid('paid', 'unpaid')
    .messages({
      'any.only': 'Salary status must be either paid or unpaid'
    }),
  isActive: Joi.string()
    .valid('true', 'false')
    .messages({
      'any.only': 'isActive must be true or false'
    }),
  search: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    })
}).concat(paginationSchema);

export const teacherAssignmentSchema = Joi.object({
  standard: Joi.string()
    .required()
    .messages({
      'any.required': 'Standard is required'
    }),
  section: Joi.string()
    .required()
    .messages({
      'any.required': 'Section is required'
    }),
  subject: Joi.string()
    .required()
    .messages({
      'any.required': 'Subject is required'
    }),
  academicYear: Joi.string()
    .messages({
      'string.base': 'Academic year must be a string'
    })
});

export const salaryUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('paid', 'unpaid')
    .required()
    .messages({
      'any.only': 'Status must be either paid or unpaid',
      'any.required': 'Status is required'
    }),
  amount: Joi.number()
    .positive()
    .when('status', {
      is: 'paid',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'number.positive': 'Amount must be positive',
      'any.unknown': 'Amount is only allowed when status is paid'
    }),
  month: Joi.string()
    .valid('January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December')
    .when('amount', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.only': 'Invalid month name',
      'any.required': 'Month is required when amount is provided'
    }),
  year: Joi.number()
    .integer()
    .min(2000)
    .max(new Date().getFullYear() + 1)
    .when('amount', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'number.integer': 'Year must be an integer',
      'number.min': 'Year must be 2000 or later',
      'number.max': 'Year cannot be more than next year',
      'any.required': 'Year is required when amount is provided'
    })
});