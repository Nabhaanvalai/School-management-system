import { AttendanceService } from '../../services/attendanceService';
import { Attendance } from '../../models/Attendance';
import { Student } from '../../models/Student';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../models/Attendance');
jest.mock('../../models/Student');

const MockedAttendance = Attendance as jest.Mocked<typeof Attendance>;
const MockedStudent = Student as jest.Mocked<typeof Student>;

describe('AttendanceService - Summary Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudentMonthlySummary', () => {
    it('should generate monthly attendance summary for student', async () => {
      const mockAggregateResult = [
        {
          _id: {
            year: 2024,
            month: 1,
            subject: 'Mathematics'
          },
          totalDays: 20,
          presentDays: 16,
          absentDays: 3,
          lateDays: 1,
          percentage: 80
        }
      ];

      MockedAttendance.aggregate = jest.fn().mockResolvedValue(mockAggregateResult);

      const result = await AttendanceService.getStudentMonthlySummary(
        'student123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        '2024-2025'
      );

      expect(result.monthlyData).toBeDefined();
      expect(result.dateRange).toBeDefined();
      expect(MockedAttendance.aggregate).toHaveBeenCalled();
    });
  });

  describe('getStudentYearlySummary', () => {
    it('should generate yearly attendance summary for student', async () => {
      const mockAggregateResult = [
        {
          _id: {
            year: 2024,
            subject: 'Mathematics'
          },
          totalDays: 200,
          presentDays: 160,
          absentDays: 30,
          lateDays: 10,
          percentage: 80
        }
      ];

      MockedAttendance.aggregate = jest.fn().mockResolvedValue(mockAggregateResult);

      const result = await AttendanceService.getStudentYearlySummary(
        'student123',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        '2024-2025'
      );

      expect(result.yearlyData).toBeDefined();
      expect(result.dateRange).toBeDefined();
      expect(MockedAttendance.aggregate).toHaveBeenCalled();
    });
  });

  describe('getClassMonthlySummary', () => {
    it('should generate monthly class attendance summary', async () => {
      const mockAggregateResult = [
        {
          _id: {
            year: 2024,
            month: 1
          },
          totalStudents: 30,
          totalDays: 600,
          totalPresentDays: 480,
          totalAbsentDays: 90,
          totalLateDays: 30,
          overallPercentage: 80,
          studentStats: [
            {
              studentId: 'student123',
              totalDays: 20,
              presentDays: 16,
              absentDays: 3,
              lateDays: 1,
              percentage: 80
            }
          ]
        }
      ];

      MockedAttendance.aggregate = jest.fn().mockResolvedValue(mockAggregateResult);
      MockedStudent.findById = jest.fn().mockResolvedValue({
        _id: 'student123',
        name: 'John Doe',
        rollNo: 'S001'
      });

      const result = await AttendanceService.getClassMonthlySummary(
        '8-A',
        'Mathematics',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        '2024-2025'
      );

      expect(result.classId).toBe('8-A');
      expect(result.subject).toBe('Mathematics');
      expect(result.monthlyData).toBeDefined();
      expect(MockedAttendance.aggregate).toHaveBeenCalled();
    });
  });

  describe('getClassYearlySummary', () => {
    it('should generate yearly class attendance summary', async () => {
      const mockAggregateResult = [
        {
          _id: {
            year: 2024
          },
          totalStudents: 30,
          totalDays: 6000,
          totalPresentDays: 4800,
          totalAbsentDays: 900,
          totalLateDays: 300,
          overallPercentage: 80,
          studentStats: [
            {
              studentId: 'student123',
              totalDays: 200,
              presentDays: 160,
              absentDays: 30,
              lateDays: 10,
              percentage: 80
            }
          ]
        }
      ];

      MockedAttendance.aggregate = jest.fn().mockResolvedValue(mockAggregateResult);
      MockedStudent.findById = jest.fn().mockResolvedValue({
        _id: 'student123',
        name: 'John Doe',
        rollNo: 'S001'
      });

      const result = await AttendanceService.getClassYearlySummary(
        '8-A',
        'Mathematics',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        '2024-2025'
      );

      expect(result.classId).toBe('8-A');
      expect(result.subject).toBe('Mathematics');
      expect(result.yearlyData).toBeDefined();
      expect(MockedAttendance.aggregate).toHaveBeenCalled();
    });
  });
});