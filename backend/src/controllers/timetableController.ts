import { Request, Response } from 'express';
import { TimetableService, TimetableFilters } from '../services/timetableService';

/**
 * Timetable controller handling all timetable-related HTTP requests
 */
export class TimetableController {
  /**
   * Create a new timetable
   * POST /api/timetable
   */
  static async createTimetable(req: Request, res: Response): Promise<void> {
    try {
      const timetableData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const result = await TimetableService.createTimetable(timetableData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.error === 'TIMETABLE_EXISTS' ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Create timetable controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get timetable by class ID
   * GET /api/timetable/class/:classId
   */
  static async getTimetableByClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const academicYear = req.query.academicYear as string;

      // Validate class ID format
      if (!TimetableService.isValidClassId(classId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid class ID format. Expected format: "Standard-Section" (e.g., "8-A")'
        });
        return;
      }

      const result = await TimetableService.getTimetableByClass(classId, academicYear);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Get timetable by class controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get teacher's schedule
   * GET /api/timetable/teacher/:teacherId
   */
  static async getTeacherSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { teacherId } = req.params;
      const academicYear = req.query.academicYear as string;

      const result = await TimetableService.getTeacherSchedule(teacherId, academicYear);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.error === 'TEACHER_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Get teacher schedule controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all timetables with filtering
   * GET /api/timetable
   */
  static async getTimetables(req: Request, res: Response): Promise<void> {
    try {
      const filters: TimetableFilters = {
        classId: req.query.classId as string,
        academicYear: req.query.academicYear as string,
        teacherId: req.query.teacherId as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
      };

      const result = await TimetableService.getTimetables(filters);

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
      console.error('Get timetables controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update timetable
   * PUT /api/timetable/:id
   */
  static async updateTimetable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = req.user?.id || '';

      const result = await TimetableService.updateTimetable(id, updateData, updatedBy);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Update timetable controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Deactivate timetable
   * DELETE /api/timetable/:id
   */
  static async deactivateTimetable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await TimetableService.deactivateTimetable(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Deactivate timetable controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get available time slots for a class
   * GET /api/timetable/class/:classId/available-slots/:day
   */
  static async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { classId, day } = req.params;
      const academicYear = req.query.academicYear as string;

      // Validate class ID format
      if (!TimetableService.isValidClassId(classId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid class ID format. Expected format: "Standard-Section" (e.g., "8-A")'
        });
        return;
      }

      // Validate day
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      if (!validDays.includes(day.toLowerCase())) {
        res.status(400).json({
          success: false,
          message: 'Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday'
        });
        return;
      }

      const result = await TimetableService.getAvailableSlots(
        classId, 
        day.toLowerCase() as any, 
        academicYear
      );

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
      console.error('Get available slots controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}