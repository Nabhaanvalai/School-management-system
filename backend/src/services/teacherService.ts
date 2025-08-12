import { Teacher, ITeacher } from '../models/Teacher';
import mongoose from 'mongoose';

export interface TeacherFilters {
  subjects?: string[];
  standard?: string;
  section?: string;
  salaryStatus?: 'paid' | 'unpaid';
  search?: string;
  isActive?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface TeacherServiceResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Teacher service handling all teacher-related business logic
 */
export class TeacherService {
  /**
   * Create a new teacher
   */
  static async createTeacher(teacherData: Partial<ITeacher>): Promise<TeacherServiceResult> {
    try {
      const teacher = new Teacher(teacherData);
      await teacher.save();

      return {
        success: true,
        message: 'Teacher created successfully',
        data: teacher
      };
    } catch (error: any) {
      console.error('Create teacher service error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return {
          success: false,
          message: 'Validation failed',
          error: validationErrors.join(', ')
        };
      }

      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        return {
          success: false,
          message: `Teacher with this ${duplicateField} already exists`
        };
      }

      return {
        success: false,
        message: 'Failed to create teacher',
        error: error.message
      };
    }
  }

  /**
   * Get teachers with filtering and pagination
   */
  static async getTeachers(
    filters: TeacherFilters = {},
    pagination: PaginationOptions
  ): Promise<TeacherServiceResult> {
    try {
      const { page, limit, sortBy, sortOrder } = pagination;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (filters.subjects && filters.subjects.length > 0) {
        query.subjects = { $in: filters.subjects };
      }

      if (filters.standard && filters.section) {
        query.$and = [
          { 'assignedClasses.standard': filters.standard },
          { 'assignedClasses.section': filters.section }
        ];
      } else if (filters.standard) {
        query['assignedClasses.standard'] = filters.standard;
      } else if (filters.section) {
        query['assignedClasses.section'] = filters.section;
      }

      if (filters.salaryStatus) {
        query['salary.status'] = filters.salaryStatus;
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { employeeId: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { phone: { $regex: filters.search, $options: 'i' } },
          { subjects: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const [teachers, totalCount] = await Promise.all([
        Teacher.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Teacher.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      const result: PaginatedResult<ITeacher> = {
        data: teachers as ITeacher[],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

      return {
        success: true,
        message: 'Teachers retrieved successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Get teachers service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve teachers',
        error: error.message
      };
    }
  }

  /**
   * Get teacher by ID
   */
  static async getTeacherById(id: string): Promise<TeacherServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid teacher ID'
        };
      }

      const teacher = await Teacher.findById(id);

      if (!teacher) {
        return {
          success: false,
          message: 'Teacher not found'
        };
      }

      return {
        success: true,
        message: 'Teacher retrieved successfully',
        data: teacher
      };
    } catch (error: any) {
      console.error('Get teacher by ID service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve teacher',
        error: error.message
      };
    }
  }

  /**
   * Update teacher by ID
   */
  static async updateTeacher(id: string, updateData: Partial<ITeacher>): Promise<TeacherServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid teacher ID'
        };
      }

      const existingTeacher = await Teacher.findById(id);
      if (!existingTeacher) {
        return {
          success: false,
          message: 'Teacher not found'
        };
      }

      const updatedTeacher = await Teacher.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        message: 'Teacher updated successfully',
        data: updatedTeacher
      };
    } catch (error: any) {
      console.error('Update teacher service error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return {
          success: false,
          message: 'Validation failed',
          error: validationErrors.join(', ')
        };
      }

      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        return {
          success: false,
          message: `Teacher with this ${duplicateField} already exists`
        };
      }

      return {
        success: false,
        message: 'Failed to update teacher',
        error: error.message
      };
    }
  }

  /**
   * Assign teacher to class and subject
   */
  static async assignTeacherToClass(
    teacherId: string,
    standard: string,
    section: string,
    subject: string,
    academicYear?: string
  ): Promise<TeacherServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return {
          success: false,
          message: 'Invalid teacher ID'
        };
      }

      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return {
          success: false,
          message: 'Teacher not found'
        };
      }

      if (!teacher.isActive) {
        return {
          success: false,
          message: 'Cannot assign inactive teacher'
        };
      }

      // Check if teacher teaches this subject
      if (!teacher.subjects.map(s => s.toLowerCase()).includes(subject.toLowerCase())) {
        return {
          success: false,
          message: `Teacher does not teach ${subject}`
        };
      }

      // Check for assignment conflicts
      const currentYear = academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      const conflictingTeacher = await Teacher.findOne({
        _id: { $ne: teacherId },
        'assignedClasses.standard': standard,
        'assignedClasses.section': section.toUpperCase(),
        'assignedClasses.subject': subject,
        'assignedClasses.academicYear': currentYear,
        isActive: true
      });

      if (conflictingTeacher) {
        return {
          success: false,
          message: `Another teacher (${conflictingTeacher.name}) is already assigned to ${standard}-${section} for ${subject}`
        };
      }

      // Assign teacher to class
      teacher.assignToClass(standard, section, subject, academicYear);
      await teacher.save();

      return {
        success: true,
        message: `Teacher assigned to ${standard}-${section} for ${subject} successfully`,
        data: teacher
      };
    } catch (error: any) {
      console.error('Assign teacher service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign teacher',
        error: error.message
      };
    }
  }

  /**
   * Remove teacher from class assignment
   */
  static async removeTeacherFromClass(
    teacherId: string,
    standard: string,
    section: string,
    subject: string
  ): Promise<TeacherServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return {
          success: false,
          message: 'Invalid teacher ID'
        };
      }

      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return {
          success: false,
          message: 'Teacher not found'
        };
      }

      // Check if assignment exists
      const assignmentExists = teacher.assignedClasses.some(assignment =>
        assignment.standard === standard &&
        assignment.section === section.toUpperCase() &&
        assignment.subject.toLowerCase() === subject.toLowerCase()
      );

      if (!assignmentExists) {
        return {
          success: false,
          message: `Teacher is not assigned to ${standard}-${section} for ${subject}`
        };
      }

      // Remove assignment
      teacher.removeFromClass(standard, section, subject);
      await teacher.save();

      return {
        success: true,
        message: `Teacher removed from ${standard}-${section} for ${subject} successfully`,
        data: teacher
      };
    } catch (error: any) {
      console.error('Remove teacher assignment service error:', error);
      return {
        success: false,
        message: 'Failed to remove teacher assignment',
        error: error.message
      };
    }
  }

  /**
   * Get teachers by subject
   */
  static async getTeachersBySubject(subject: string): Promise<TeacherServiceResult> {
    try {
      const teachers = await Teacher.find({ 
        subjects: { $regex: new RegExp(subject, 'i') },
        isActive: true 
      }).sort({ name: 1 });

      return {
        success: true,
        message: 'Teachers retrieved successfully',
        data: teachers
      };
    } catch (error: any) {
      console.error('Get teachers by subject service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve teachers',
        error: error.message
      };
    }
  }

  /**
   * Get teachers by class
   */
  static async getTeachersByClass(standard: string, section: string): Promise<TeacherServiceResult> {
    try {
      const teachers = await Teacher.find({ 
        'assignedClasses.standard': standard,
        'assignedClasses.section': section.toUpperCase(),
        isActive: true 
      }).sort({ name: 1 });

      return {
        success: true,
        message: 'Teachers retrieved successfully',
        data: teachers
      };
    } catch (error: any) {
      console.error('Get teachers by class service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve teachers',
        error: error.message
      };
    }
  }

  /**
   * Get teachers with unpaid salary
   */
  static async getTeachersWithUnpaidSalary(): Promise<TeacherServiceResult> {
    try {
      const teachers = await Teacher.find({ 
        'salary.status': 'unpaid',
        isActive: true 
      }).sort({ 'salary.lastPaidDate': 1 });

      return {
        success: true,
        message: 'Teachers with unpaid salary retrieved successfully',
        data: teachers
      };
    } catch (error: any) {
      console.error('Get teachers with unpaid salary service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve teachers with unpaid salary',
        error: error.message
      };
    }
  }

  /**
   * Update teacher salary status
   */
  static async updateSalaryStatus(
    id: string,
    status: 'paid' | 'unpaid',
    amount?: number,
    month?: string,
    year?: number
  ): Promise<TeacherServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid teacher ID'
        };
      }

      const teacher = await Teacher.findById(id);
      if (!teacher) {
        return {
          success: false,
          message: 'Teacher not found'
        };
      }

      if (status === 'paid') {
        // If marking as paid, update last paid date
        teacher.updateSalaryStatus(status, new Date());
        
        // If amount, month, and year are provided, add payment record
        if (amount && month && year) {
          try {
            teacher.addPaymentRecord(amount, month, year);
          } catch (paymentError: any) {
            return {
              success: false,
              message: paymentError.message
            };
          }
        }
      } else {
        // If marking as unpaid, just update status
        teacher.updateSalaryStatus(status);
      }

      await teacher.save();

      return {
        success: true,
        message: `Teacher salary status updated to ${status} successfully`,
        data: teacher
      };
    } catch (error: any) {
      console.error('Update salary status service error:', error);
      return {
        success: false,
        message: 'Failed to update salary status',
        error: error.message
      };
    }
  }

  /**
   * Archive teacher (soft delete)
   */
  static async archiveTeacher(id: string): Promise<TeacherServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid teacher ID'
        };
      }

      const teacher = await Teacher.findById(id);
      if (!teacher) {
        return {
          success: false,
          message: 'Teacher not found'
        };
      }

      // Mark as inactive instead of deleting
      teacher.isActive = false;
      await teacher.save();

      return {
        success: true,
        message: 'Teacher archived successfully',
        data: teacher
      };
    } catch (error: any) {
      console.error('Archive teacher service error:', error);
      return {
        success: false,
        message: 'Failed to archive teacher',
        error: error.message
      };
    }
  }
}