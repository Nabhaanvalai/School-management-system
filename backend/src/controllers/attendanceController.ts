import { Request, Response } from "express";
import { AttendanceService } from "../services/attendanceService";
import { AttendanceStatus } from "../models/Attendance";

export class AttendanceController {
  /**
   * Mark attendance for a student
   * POST /api/attendance/mark
   */
  static async markAttendance(req: Request, res: Response): Promise<void> {
    try {
      const {
        studentId,
        classId,
        subject,
        date,
        status,
        academicYear,
        remarks,
      } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Only teachers and admins can mark attendance
      if (req.user.role !== "teacher" && req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only teachers and admins can mark attendance",
        });
        return;
      }

      const attendanceData = {
        studentId,
        teacherId: req.user.id,
        classId,
        subject,
        date: new Date(date),
        status: status as AttendanceStatus,
        academicYear,
        remarks,
      };

      const attendance = await AttendanceService.markAttendance(attendanceData);

      res.status(201).json({
        success: true,
        message: "Attendance marked successfully",
        data: attendance,
      });
    } catch (error: any) {
      console.error("Error marking attendance:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to mark attendance",
      });
    }
  }

  /**
   * Update existing attendance record
   * PUT /api/attendance/:id
   */
  static async updateAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Only teachers and admins can update attendance
      if (req.user.role !== "teacher" && req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only teachers and admins can update attendance",
        });
        return;
      }

      const updates: any = {};
      if (status) updates.status = status;
      if (remarks !== undefined) updates.remarks = remarks;

      const attendance = await AttendanceService.updateAttendance(
        id,
        req.user.id,
        updates
      );

      res.json({
        success: true,
        message: "Attendance updated successfully",
        data: attendance,
      });
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update attendance",
      });
    }
  }

  /**
   * Get attendance records for a specific student
   * GET /api/attendance/student/:id
   */
  static async getStudentAttendance(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const {
        subject,
        startDate,
        endDate,
        academicYear,
        page = "1",
        limit = "10",
      } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Students can only view their own attendance, teachers and admins can view any
      if (req.user.role === "student" && req.user.id !== id) {
        res.status(403).json({
          success: false,
          message: "Students can only view their own attendance",
        });
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      if (subject) options.subject = subject as string;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (academicYear) options.academicYear = academicYear as string;

      const result = await AttendanceService.getStudentAttendance(id, options);

      res.json({
        success: true,
        message: "Student attendance retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting student attendance:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve student attendance",
      });
    }
  }

  /**
   * Get attendance records for a specific class and subject
   * GET /api/attendance/class/:classId/subject/:subject
   */
  static async getClassAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { classId, subject } = req.params;
      const {
        date,
        startDate,
        endDate,
        academicYear,
        page = "1",
        limit = "50",
      } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Only teachers and admins can view class attendance
      if (req.user.role !== "teacher" && req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only teachers and admins can view class attendance",
        });
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      if (date) options.date = new Date(date as string);
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (academicYear) options.academicYear = academicYear as string;

      const result = await AttendanceService.getClassAttendance(
        classId,
        subject,
        options
      );

      res.json({
        success: true,
        message: "Class attendance retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting class attendance:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve class attendance",
      });
    }
  }

  /**
   * Get attendance percentage for a student
   * GET /api/attendance/student/:id/percentage
   */
  static async getStudentAttendancePercentage(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { subject, academicYear, startDate, endDate } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Students can only view their own attendance, teachers and admins can view any
      if (req.user.role === "student" && req.user.id !== id) {
        res.status(403).json({
          success: false,
          message: "Students can only view their own attendance",
        });
        return;
      }

      const options: any = {};
      if (subject) options.subject = subject as string;
      if (academicYear) options.academicYear = academicYear as string;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const result = await AttendanceService.calculateAttendancePercentage(
        id,
        options
      );

      res.json({
        success: true,
        message: "Attendance percentage calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating attendance percentage:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate attendance percentage",
      });
    }
  }

  /**
   * Get attendance summary for a class and subject
   * GET /api/attendance/class/:classId/subject/:subject/summary
   */
  static async getClassAttendanceSummary(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { classId, subject } = req.params;
      const { startDate, endDate, academicYear } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Only teachers and admins can view class attendance summary
      if (req.user.role !== "teacher" && req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only teachers and admins can view class attendance summary",
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required for summary",
        });
        return;
      }

      const result = await AttendanceService.getClassAttendanceSummary(
        classId,
        subject,
        new Date(startDate as string),
        new Date(endDate as string),
        academicYear as string
      );

      res.json({
        success: true,
        message: "Class attendance summary retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting class attendance summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve class attendance summary",
      });
    }
  }

  /**
   * Get attendance records marked by the current teacher
   * GET /api/attendance/teacher/my-records
   */
  static async getMyAttendanceRecords(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const {
        classId,
        subject,
        startDate,
        endDate,
        academicYear,
        page = "1",
        limit = "20",
      } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Only teachers can view their own attendance records
      if (req.user.role !== "teacher") {
        res.status(403).json({
          success: false,
          message: "Only teachers can view their attendance records",
        });
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      if (classId) options.classId = classId as string;
      if (subject) options.subject = subject as string;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (academicYear) options.academicYear = academicYear as string;

      const result = await AttendanceService.getTeacherAttendanceRecords(
        req.user.id,
        options
      );

      res.json({
        success: true,
        message: "Teacher attendance records retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting teacher attendance records:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to retrieve teacher attendance records",
      });
    }
  }

  /**
   * Get attendance records marked by a specific teacher (admin only)
   * GET /api/attendance/teacher/:teacherId/records
   */
  static async getTeacherAttendanceRecords(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { teacherId } = req.params;
      const {
        classId,
        subject,
        startDate,
        endDate,
        academicYear,
        page = "1",
        limit = "20",
      } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Only admins can view any teacher's attendance records
      if (req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only admins can view teacher attendance records",
        });
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      if (classId) options.classId = classId as string;
      if (subject) options.subject = subject as string;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (academicYear) options.academicYear = academicYear as string;

      const result = await AttendanceService.getTeacherAttendanceRecords(
        teacherId,
        options
      );

      res.json({
        success: true,
        message: "Teacher attendance records retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting teacher attendance records:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to retrieve teacher attendance records",
      });
    }
  }

  /**
   * Get monthly attendance summary for a student
   * GET /api/attendance/student/:id/monthly-summary
   */
  static async getStudentMonthlySummary(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate, academicYear } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Students can only view their own attendance, teachers and admins can view any
      if (req.user.role === "student" && req.user.id !== id) {
        res.status(403).json({
          success: false,
          message: "Students can only view their own attendance",
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required for monthly summary",
        });
        return;
      }

      const result = await AttendanceService.getStudentMonthlySummary(
        id,
        new Date(startDate as string),
        new Date(endDate as string),
        academicYear as string
      );

      res.json({
        success: true,
        message: "Student monthly attendance summary retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting student monthly summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve student monthly summary",
      });
    }
  }

  /**
   * Get yearly attendance summary for a student
   * GET /api/attendance/student/:id/yearly-summary
   */
  static async getStudentYearlySummary(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate, academicYear } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Students can only view their own attendance, teachers and admins can view any
      if (req.user.role === "student" && req.user.id !== id) {
        res.status(403).json({
          success: false,
          message: "Students can only view their own attendance",
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required for yearly summary",
        });
        return;
      }

      const result = await AttendanceService.getStudentYearlySummary(
        id,
        new Date(startDate as string),
        new Date(endDate as string),
        academicYear as string
      );

      res.json({
        success: true,
        message: "Student yearly attendance summary retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting student yearly summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve student yearly summary",
      });
    }
  }

  /**
   * Get monthly attendance summary for a class and subject
   * GET /api/attendance/class/:classId/subject/:subject/monthly-summary
   */
  static async getClassMonthlySummary(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { classId, subject } = req.params;
      const { startDate, endDate, academicYear } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Only teachers and admins can view class attendance summary
      if (req.user.role !== "teacher" && req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only teachers and admins can view class attendance summary",
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required for monthly summary",
        });
        return;
      }

      const result = await AttendanceService.getClassMonthlySummary(
        classId,
        subject,
        new Date(startDate as string),
        new Date(endDate as string),
        academicYear as string
      );

      res.json({
        success: true,
        message: "Class monthly attendance summary retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting class monthly summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve class monthly summary",
      });
    }
  }

  /**
   * Get yearly attendance summary for a class and subject
   * GET /api/attendance/class/:classId/subject/:subject/yearly-summary
   */
  static async getClassYearlySummary(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { classId, subject } = req.params;
      const { startDate, endDate, academicYear } = req.query;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Only teachers and admins can view class attendance summary
      if (req.user.role !== "teacher" && req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only teachers and admins can view class attendance summary",
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required for yearly summary",
        });
        return;
      }

      const result = await AttendanceService.getClassYearlySummary(
        classId,
        subject,
        new Date(startDate as string),
        new Date(endDate as string),
        academicYear as string
      );

      res.json({
        success: true,
        message: "Class yearly attendance summary retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting class yearly summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve class yearly summary",
      });
    }
  }
}
