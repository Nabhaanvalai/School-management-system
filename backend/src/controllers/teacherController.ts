import { Request, Response } from 'express';
import { TeacherService, TeacherFilters, PaginationOptions } from '../services/teacherService';

/**
 * Teacher controller handling all teacher-related HTTP requests
 */
export class TeacherController {
  /**
   * Create a new teacher
   * POST /api/teachers
   */
  static async createTeacher(req: Request, res: Response): Promise<void> {
    try {
      const result = await TeacherService.createTeacher(req.body);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Create teacher controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get teachers with filtering and pagination
   * GET /api/teachers
   */
  static async getTeachers(req: Request, res: Response): Promise<void> {
    try {
      const filters: TeacherFilters = {
        subjects: req.query.subjects ? (req.query.subjects as string).split(',') : undefined,
        standard: req.query.standard as string,
        section: req.query.section as string,
        salaryStatus: req.query.salaryStatus as 'paid' | 'unpaid',
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };

      const pagination: PaginationOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await TeacherService.getTeachers(filters, pagination);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Get teachers controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get teacher by ID
   * GET /api/teachers/:id
   */
  static async getTeacherById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TeacherService.getTeacherById(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Teacher not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Get teacher by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update teacher by ID
   * PUT /api/teachers/:id
   */
  static async updateTeacher(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TeacherService.updateTeacher(id, req.body);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Teacher not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Update teacher controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Assign teacher to class and subject
   * POST /api/teachers/:id/assignments
   */
  static async assignTeacherToClass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { standard, section, subject, academicYear } = req.body;

      if (!standard || !section || !subject) {
        res.status(400).json({
          success: false,
          message: 'Standard, section, and subject are required'
        });
        return;
      }

      const result = await TeacherService.assignTeacherToClass(
        id,
        standard,
        section,
        subject,
        academicYear
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Teacher not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Assign teacher controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Remove teacher from class assignment
   * DELETE /api/teachers/:id/assignments
   */
  static async removeTeacherFromClass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { standard, section, subject } = req.body;

      if (!standard || !section || !subject) {
        res.status(400).json({
          success: false,
          message: 'Standard, section, and subject are required'
        });
        return;
      }

      const result = await TeacherService.removeTeacherFromClass(
        id,
        standard,
        section,
        subject
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Teacher not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Remove teacher assignment controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get teachers by subject
   * GET /api/teachers/subject/:subject
   */
  static async getTeachersBySubject(req: Request, res: Response): Promise<void> {
    try {
      const { subject } = req.params;
      const result = await TeacherService.getTeachersBySubject(subject);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Get teachers by subject controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get teachers by class
   * GET /api/teachers/class/:standard/:section
   */
  static async getTeachersByClass(req: Request, res: Response): Promise<void> {
    try {
      const { standard, section } = req.params;
      const result = await TeacherService.getTeachersByClass(standard, section);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Get teachers by class controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get teachers with unpaid salary
   * GET /api/teachers/salary/unpaid
   */
  static async getTeachersWithUnpaidSalary(req: Request, res: Response): Promise<void> {
    try {
      const result = await TeacherService.getTeachersWithUnpaidSalary();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Get teachers with unpaid salary controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update teacher salary status
   * PUT /api/teachers/:id/salary
   */
  static async updateSalaryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, amount, month, year } = req.body;

      if (!status || !['paid', 'unpaid'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid salary status (paid/unpaid) is required'
        });
        return;
      }

      const result = await TeacherService.updateSalaryStatus(id, status, amount, month, year);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Teacher not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Update salary status controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Archive teacher (soft delete)
   * DELETE /api/teachers/:id
   */
  static async archiveTeacher(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TeacherService.archiveTeacher(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Teacher not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Archive teacher controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}