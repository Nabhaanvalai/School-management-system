import { TimetableService } from '../../services/timetableService';
import { Timetable } from '../../models/Timetable';
import { Teacher } from '../../models/Teacher';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../models/Timetable');
jest.mock('../../models/Teacher');

const MockedTimetable = Timetable as jest.Mocked<typeof Timetable>;
const MockedTeacher = Teacher as jest.Mocked<typeof Teacher>;

describe('TimetableService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTimetable', () => {
    const validTimetableData = {
      classId: '8-A',
      academicYear: '2023-2024',
      schedule: [
        {
          day: 'monday' as const,
          periods: [
            {
              slot: 'A1',
              subject: 'Mathematics',
              teacherId: '507f1f77bcf86cd799439011',
              startTime: '09:00',
              endTime: '09:45'
            }
          ]
        }
      ],
      createdBy: '507f1f77bcf86cd799439012'
    };

    it('should create timetable successfully', async () => {
      const mockTeacher = { _id: '507f1f77bcf86cd799439011', name: 'John Doe' };
      const mockSavedTimetable = { 
        _id: '507f1f77bcf86cd799439013',
        ...validTimetableData 
      };
      const mockPopulatedTimetable = {
        ...mockSavedTimetable,
        schedule: [{
          day: 'monday',
          periods: [{
            ...validTimetableData.schedule[0].periods[0],
            teacherId: mockTeacher
          }]
        }],
        createdBy: { email: 'admin@school.com' }
      };

      MockedTimetable.findOne.mockResolvedValue(null);
      MockedTeacher.find.mockResolvedValue([mockTeacher]);
      (MockedTimetable as any).checkTeacherAvailability = jest.fn().mockResolvedValue(true);
      
      const mockTimetableInstance = {
        save: jest.fn().mockResolvedValue(mockSavedTimetable)
      };
      (MockedTimetable as any).mockImplementation(() => mockTimetableInstance);
      
      MockedTimetable.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockPopulatedTimetable)
        })
      } as any);

      const result = await TimetableService.createTimetable(validTimetableData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Timetable created successfully');
      expect(result.data).toEqual(mockPopulatedTimetable);
      expect(MockedTimetable.findOne).toHaveBeenCalledWith({
        classId: '8-A',
        academicYear: '2023-2024',
        isActive: true
      });
    });

    it('should fail if timetable already exists', async () => {
      const existingTimetable = { _id: '507f1f77bcf86cd799439013' };
      MockedTimetable.findOne.mockResolvedValue(existingTimetable as any);

      const result = await TimetableService.createTimetable(validTimetableData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Active timetable already exists for this class and academic year');
      expect(result.error).toBe('TIMETABLE_EXISTS');
    });

    it('should fail if teacher not found', async () => {
      MockedTimetable.findOne.mockResolvedValue(null);
      MockedTeacher.find.mockResolvedValue([]); // No teachers found

      const result = await TimetableService.createTimetable(validTimetableData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('One or more teachers not found');
      expect(result.error).toBe('INVALID_TEACHERS');
    });

    it('should fail if teacher is not available', async () => {
      const mockTeacher = { _id: '507f1f77bcf86cd799439011', name: 'John Doe' };
      
      MockedTimetable.findOne.mockResolvedValue(null);
      MockedTeacher.find.mockResolvedValue([mockTeacher]);
      (MockedTimetable as any).checkTeacherAvailability = jest.fn().mockResolvedValue(false);

      const result = await TimetableService.createTimetable(validTimetableData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Teacher is not available for monday 09:00-09:45');
      expect(result.error).toBe('TEACHER_CONFLICT');
    });

    it('should handle database errors', async () => {
      MockedTimetable.findOne.mockRejectedValue(new Error('Database error'));

      const result = await TimetableService.createTimetable(validTimetableData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
      expect(result.error).toBe('CREATE_ERROR');
    });
  });

  describe('getTimetableByClass', () => {
    it('should get timetable by class successfully', async () => {
      const mockTimetable = {
        _id: '507f1f77bcf86cd799439013',
        classId: '8-A',
        academicYear: '2023-2024',
        schedule: [{
          day: 'monday',
          periods: [{
            slot: 'A1',
            subject: 'Mathematics',
            teacherId: { name: 'John Doe', employeeId: 'T001' }
          }]
        }]
      };

      MockedTimetable.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTimetable)
        })
      } as any);

      const result = await TimetableService.getTimetableByClass('8-A', '2023-2024');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Timetable retrieved successfully');
      expect(result.data).toEqual(mockTimetable);
      expect(MockedTimetable.findOne).toHaveBeenCalledWith({
        classId: '8-A',
        academicYear: '2023-2024',
        isActive: true
      });
    });

    it('should handle timetable not found', async () => {
      MockedTimetable.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      } as any);

      const result = await TimetableService.getTimetableByClass('8-A', '2023-2024');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Timetable not found for this class');
      expect(result.error).toBe('NOT_FOUND');
    });

    it('should handle database errors', async () => {
      MockedTimetable.findOne.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await TimetableService.getTimetableByClass('8-A', '2023-2024');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to retrieve timetable');
      expect(result.error).toBe('FETCH_ERROR');
    });
  });

  describe('getTeacherSchedule', () => {
    const teacherId = '507f1f77bcf86cd799439011';

    it('should get teacher schedule successfully', async () => {
      const mockTeacher = { _id: teacherId, name: 'John Doe', employeeId: 'T001' };
      const mockTimetables = [
        {
          classId: '8-A',
          academicYear: '2023-2024',
          schedule: [{
            day: 'monday',
            periods: [{
              slot: 'A1',
              subject: 'Mathematics',
              teacherId: { _id: teacherId },
              startTime: '09:00',
              endTime: '09:45'
            }]
          }]
        },
        {
          classId: '9-B',
          academicYear: '2023-2024',
          schedule: [{
            day: 'tuesday',
            periods: [{
              slot: 'B1',
              subject: 'Physics',
              teacherId: { _id: teacherId },
              startTime: '10:00',
              endTime: '10:45'
            }]
          }]
        }
      ];

      MockedTeacher.findById.mockResolvedValue(mockTeacher as any);
      MockedTimetable.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTimetables)
        })
      } as any);

      const result = await TimetableService.getTeacherSchedule(teacherId, '2023-2024');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teacher schedule retrieved successfully');
      expect(result.data.teacher.name).toBe('John Doe');
      expect(result.data.schedule).toHaveLength(2);
      expect(result.data.totalPeriods).toBe(2);
    });

    it('should handle teacher not found', async () => {
      MockedTeacher.findById.mockResolvedValue(null);

      const result = await TimetableService.getTeacherSchedule(teacherId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Teacher not found');
      expect(result.error).toBe('TEACHER_NOT_FOUND');
    });

    it('should handle database errors', async () => {
      MockedTeacher.findById.mockRejectedValue(new Error('Database error'));

      const result = await TimetableService.getTeacherSchedule(teacherId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to retrieve teacher schedule');
      expect(result.error).toBe('FETCH_ERROR');
    });
  });

  describe('updateTimetable', () => {
    const timetableId = '507f1f77bcf86cd799439013';
    const updateData = {
      schedule: [{
        day: 'monday' as const,
        periods: [{
          slot: 'A1',
          subject: 'Physics',
          teacherId: '507f1f77bcf86cd799439011',
          startTime: '09:00',
          endTime: '09:45'
        }]
      }]
    };

    it('should update timetable successfully', async () => {
      const mockTimetable = {
        _id: timetableId,
        classId: '8-A',
        academicYear: '2023-2024',
        save: jest.fn().mockResolvedValue({ _id: timetableId })
      };
      const mockTeacher = { _id: '507f1f77bcf86cd799439011', name: 'John Doe' };
      const mockUpdatedTimetable = { ...mockTimetable, ...updateData };

      MockedTimetable.findById.mockResolvedValue(mockTimetable as any);
      MockedTeacher.find.mockResolvedValue([mockTeacher]);
      (MockedTimetable as any).checkTeacherAvailability = jest.fn().mockResolvedValue(true);
      
      MockedTimetable.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUpdatedTimetable)
        })
      } as any);

      const result = await TimetableService.updateTimetable(timetableId, updateData, 'adminId');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Timetable updated successfully');
      expect(mockTimetable.save).toHaveBeenCalled();
    });

    it('should handle timetable not found', async () => {
      MockedTimetable.findById.mockResolvedValue(null);

      const result = await TimetableService.updateTimetable(timetableId, updateData, 'adminId');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Timetable not found');
      expect(result.error).toBe('NOT_FOUND');
    });

    it('should handle teacher conflicts', async () => {
      const mockTimetable = {
        _id: timetableId,
        classId: '8-A',
        academicYear: '2023-2024'
      };
      const mockTeacher = { _id: '507f1f77bcf86cd799439011', name: 'John Doe' };

      MockedTimetable.findById.mockResolvedValue(mockTimetable as any);
      MockedTeacher.find.mockResolvedValue([mockTeacher]);
      (MockedTimetable as any).checkTeacherAvailability = jest.fn().mockResolvedValue(false);

      const result = await TimetableService.updateTimetable(timetableId, updateData, 'adminId');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Teacher is not available');
      expect(result.error).toBe('TEACHER_CONFLICT');
    });
  });

  describe('getTimetables', () => {
    it('should get all timetables with filters', async () => {
      const mockTimetables = [
        { _id: '1', classId: '8-A', academicYear: '2023-2024' },
        { _id: '2', classId: '9-B', academicYear: '2023-2024' }
      ];

      MockedTimetable.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockTimetables)
          })
        })
      } as any);

      const filters = { academicYear: '2023-2024', isActive: true };
      const result = await TimetableService.getTimetables(filters);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Timetables retrieved successfully');
      expect(result.data).toEqual(mockTimetables);
    });

    it('should handle database errors', async () => {
      MockedTimetable.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await TimetableService.getTimetables();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to retrieve timetables');
      expect(result.error).toBe('FETCH_ERROR');
    });
  });

  describe('deactivateTimetable', () => {
    const timetableId = '507f1f77bcf86cd799439013';

    it('should deactivate timetable successfully', async () => {
      const mockTimetable = {
        _id: timetableId,
        isActive: true,
        save: jest.fn().mockResolvedValue({ _id: timetableId, isActive: false })
      };

      MockedTimetable.findById.mockResolvedValue(mockTimetable as any);

      const result = await TimetableService.deactivateTimetable(timetableId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Timetable deactivated successfully');
      expect(mockTimetable.isActive).toBe(false);
      expect(mockTimetable.save).toHaveBeenCalled();
    });

    it('should handle timetable not found', async () => {
      MockedTimetable.findById.mockResolvedValue(null);

      const result = await TimetableService.deactivateTimetable(timetableId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Timetable not found');
      expect(result.error).toBe('NOT_FOUND');
    });

    it('should handle database errors', async () => {
      MockedTimetable.findById.mockRejectedValue(new Error('Database error'));

      const result = await TimetableService.deactivateTimetable(timetableId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to deactivate timetable');
      expect(result.error).toBe('DELETE_ERROR');
    });
  });

  describe('isValidClassId', () => {
    it('should validate class ID format correctly', () => {
      const validClassIds = ['1-A', '8-B', '10-C', '12-F'];
      const invalidClassIds = ['0-A', '13-A', '8-G', '8A', 'Class8A'];

      validClassIds.forEach(classId => {
        expect(TimetableService.isValidClassId(classId)).toBe(true);
      });

      invalidClassIds.forEach(classId => {
        expect(TimetableService.isValidClassId(classId)).toBe(false);
      });
    });
  });

  describe('getAvailableSlots', () => {
    it('should return all slots as available when no timetable exists', async () => {
      jest.spyOn(TimetableService, 'getTimetableByClass').mockResolvedValue({
        success: false,
        error: 'NOT_FOUND'
      });

      const result = await TimetableService.getAvailableSlots('8-A', 'monday');

      expect(result.success).toBe(true);
      expect(result.data.availableSlots).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2']);
      expect(result.data.occupiedSlots).toEqual([]);
    });

    it('should return correct available slots when timetable exists', async () => {
      const mockTimetable = {
        schedule: [{
          day: 'monday',
          periods: [
            { slot: 'A1' },
            { slot: 'B1' }
          ]
        }]
      };

      jest.spyOn(TimetableService, 'getTimetableByClass').mockResolvedValue({
        success: true,
        data: mockTimetable
      });

      const result = await TimetableService.getAvailableSlots('8-A', 'monday');

      expect(result.success).toBe(true);
      expect(result.data.availableSlots).toEqual(['A2', 'B2', 'C1', 'C2', 'D1', 'D2']);
      expect(result.data.occupiedSlots).toEqual(['A1', 'B1']);
    });

    it('should handle errors', async () => {
      jest.spyOn(TimetableService, 'getTimetableByClass').mockRejectedValue(new Error('Database error'));

      const result = await TimetableService.getAvailableSlots('8-A', 'monday');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to retrieve available slots');
      expect(result.error).toBe('FETCH_ERROR');
    });
  });
});