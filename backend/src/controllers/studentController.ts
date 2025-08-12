import { Request, Response } from 'express';
import { StudentService, StudentFilters, PaginationOptions } from '../services/studentService';

/**
 * Student controller handling all student-related HTTP requests
 */
export class StudentController {
  /**
   * Create a new student
   * POST /api/students
   */
  static async createStudent(req: Request, res: Response): Promise<void> {
    try {
      const result = await StudentService.createStudent(req.body);

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
      console.error('Create student controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get students with filtering and pagination
   * GET /api/students
   */
  static async getStudents(req: Request, res: Response): Promise<void> {
    try {
      const filters: StudentFilters = {
        standard: req.query.standard as string,
        section: req.query.section as string,
        status: req.query.status as 'active' | 'left',
        search: req.query.search as string
      };

      const pagination: PaginationOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await StudentService.getStudents(filters, pagination);

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
      console.error('Get students controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get student by ID
   * GET /api/students/:id
   */
  static async getStudentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await StudentService.getStudentById(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Student not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Get student by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update student by ID
   * PUT /api/students/:id
   */
  static async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await StudentService.updateStudent(id, req.body);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Student not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Update student controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Transfer student to different class
   * PUT /api/students/:id/transfer
   */
  static async transferStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { standard, section, rollNo } = req.body;

      if (!standard || !section) {
        res.status(400).json({
          success: false,
          message: 'Standard and section are required for transfer'
        });
        return;
      }

      const result = await StudentService.transferStudent(id, standard, section, rollNo);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Student not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Transfer student controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Archive student (soft delete)
   * DELETE /api/students/:id
   */
  static async archiveStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await StudentService.archiveStudent(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message === 'Student not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Archive student controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get student count by class
   * GET /api/students/count/by-class
   */
  static async getStudentCountByClass(req: Request, res: Response): Promise<void> {
    try {
      const result = await StudentService.getStudentCountByClass();

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
      console.error('Get student count controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get students by class
   * GET /api/students/class/:standard/:section
   */
  static async getStudentsByClass(req: Request, res: Response): Promise<void> {
    try {
      const { standard, section } = req.params;
      const result = await StudentService.getStudentsByClass(standard, section);

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
      console.error('Get students by class controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}