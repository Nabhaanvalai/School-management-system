import { TeacherService } from '../../services/teacherService';
import { Teacher } from '../../models/Teacher';
import mongoose from 'mongoose';

// Mock the Teacher model
jest.mock('../../models/Teacher');
const MockedTeacher = Teacher as jest.Mocked<typeof Teacher>;

describe('Teacher Assignment System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Teacher Assignment Functionality', () => {
    it('should assign teacher to class successfully', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        subjects: ['Mathematics'],
        assignedClasses: [],
        isActive: true,
        assignToClass: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);
      MockedTeacher.findOne = jest.fn().mockResolvedValue(null); // No conflict

      const result = await TeacherService.assignTeacherToClass(
        teacherId,
        '10',
        'A',
        'Mathematics'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teacher assigned to 10-A for Mathematics successfully');
      expect(mockTeacher.assignToClass).toHaveBeenCalledWith('10', 'A', 'Mathematics', undefined);
      expect(mockTeacher.save).toHaveBeenCalled();
    });

    it('should detect assignment conflicts', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        subjects: ['Mathematics'],
        assignedClasses: [],
        isActive: true
      };

      const conflictingTeacher = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Jane Smith'
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);
      MockedTeacher.findOne = jest.fn().mockResolvedValue(conflictingTeacher);

      const result = await TeacherService.assignTeacherToClass(
        teacherId,
        '10',
        'A',
        'Mathematics'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Another teacher (Jane Smith) is already assigned to 10-A for Mathematics');
    });

    it('should prevent assignment to subject teacher does not teach', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        subjects: ['Mathematics'], // Does not include Physics
        assignedClasses: [],
        isActive: true
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);

      const result = await TeacherService.assignTeacherToClass(
        teacherId,
        '10',
        'A',
        'Physics' // Subject not taught by teacher
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Teacher does not teach Physics');
    });

    it('should prevent assignment to inactive teacher', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        subjects: ['Mathematics'],
        assignedClasses: [],
        isActive: false // Inactive teacher
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);

      const result = await TeacherService.assignTeacherToClass(
        teacherId,
        '10',
        'A',
        'Mathematics'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot assign inactive teacher');
    });

    it('should remove teacher from class assignment', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        subjects: ['Mathematics'],
        assignedClasses: [
          {
            standard: '10',
            section: 'A',
            subject: 'Mathematics',
            academicYear: '2023-2024'
          }
        ],
        isActive: true,
        removeFromClass: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);

      const result = await TeacherService.removeTeacherFromClass(
        teacherId,
        '10',
        'A',
        'Mathematics'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teacher removed from 10-A for Mathematics successfully');
      expect(mockTeacher.removeFromClass).toHaveBeenCalledWith('10', 'A', 'Mathematics');
      expect(mockTeacher.save).toHaveBeenCalled();
    });

    it('should handle removal of non-existent assignment', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        subjects: ['Mathematics'],
        assignedClasses: [], // No assignments
        isActive: true
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);

      const result = await TeacherService.removeTeacherFromClass(
        teacherId,
        '10',
        'A',
        'Mathematics'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Teacher is not assigned to 10-A for Mathematics');
    });
  });

  describe('Salary Management System', () => {
    it('should update salary status to paid', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        salary: {
          amount: 50000,
          status: 'unpaid'
        },
        updateSalaryStatus: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);

      const result = await TeacherService.updateSalaryStatus(
        teacherId,
        'paid'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teacher salary status updated to paid successfully');
      expect(mockTeacher.updateSalaryStatus).toHaveBeenCalledWith('paid', expect.any(Date));
      expect(mockTeacher.save).toHaveBeenCalled();
    });

    it('should update salary status to paid with payment record', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        salary: {
          amount: 50000,
          status: 'unpaid'
        },
        updateSalaryStatus: jest.fn(),
        addPaymentRecord: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);

      const result = await TeacherService.updateSalaryStatus(
        teacherId,
        'paid',
        50000,
        'January',
        2024
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teacher salary status updated to paid successfully');
      expect(mockTeacher.updateSalaryStatus).toHaveBeenCalledWith('paid', expect.any(Date));
      expect(mockTeacher.addPaymentRecord).toHaveBeenCalledWith(50000, 'January', 2024);
      expect(mockTeacher.save).toHaveBeenCalled();
    });

    it('should handle duplicate payment record error', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        salary: {
          amount: 50000,
          status: 'unpaid'
        },
        updateSalaryStatus: jest.fn(),
        addPaymentRecord: jest.fn().mockImplementation(() => {
          throw new Error('Payment for January 2024 already recorded');
        }),
        save: jest.fn().mockResolvedValue(true)
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);

      const result = await TeacherService.updateSalaryStatus(
        teacherId,
        'paid',
        50000,
        'January',
        2024
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Payment for January 2024 already recorded');
    });

    it('should update salary status to unpaid', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockTeacher = {
        _id: teacherId,
        employeeId: 'T001',
        name: 'John Doe',
        salary: {
          amount: 50000,
          status: 'paid'
        },
        updateSalaryStatus: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);

      const result = await TeacherService.updateSalaryStatus(
        teacherId,
        'unpaid'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teacher salary status updated to unpaid successfully');
      expect(mockTeacher.updateSalaryStatus).toHaveBeenCalledWith('unpaid');
      expect(mockTeacher.save).toHaveBeenCalled();
    });
  });

  describe('Teacher Query Operations', () => {
    it('should get teachers by subject', async () => {
      const mockTeachers = [
        {
          _id: new mongoose.Types.ObjectId(),
          employeeId: 'T001',
          name: 'John Doe',
          subjects: ['Mathematics'],
          isActive: true
        },
        {
          _id: new mongoose.Types.ObjectId(),
          employeeId: 'T002',
          name: 'Jane Smith',
          subjects: ['Mathematics', 'Physics'],
          isActive: true
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockTeachers)
      };

      MockedTeacher.find = jest.fn().mockReturnValue(mockQuery);

      const result = await TeacherService.getTeachersBySubject('Mathematics');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teachers retrieved successfully');
      expect(result.data).toEqual(mockTeachers);
      expect(MockedTeacher.find).toHaveBeenCalledWith({
        subjects: { $regex: new RegExp('Mathematics', 'i') },
        isActive: true
      });
    });

    it('should get teachers by class', async () => {
      const mockTeachers = [
        {
          _id: new mongoose.Types.ObjectId(),
          employeeId: 'T001',
          name: 'John Doe',
          assignedClasses: [
            {
              standard: '10',
              section: 'A',
              subject: 'Mathematics'
            }
          ],
          isActive: true
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockTeachers)
      };

      MockedTeacher.find = jest.fn().mockReturnValue(mockQuery);

      const result = await TeacherService.getTeachersByClass('10', 'A');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teachers retrieved successfully');
      expect(result.data).toEqual(mockTeachers);
      expect(MockedTeacher.find).toHaveBeenCalledWith({
        'assignedClasses.standard': '10',
        'assignedClasses.section': 'A',
        isActive: true
      });
    });

    it('should get teachers with unpaid salary', async () => {
      const mockTeachers = [
        {
          _id: new mongoose.Types.ObjectId(),
          employeeId: 'T001',
          name: 'John Doe',
          salary: { amount: 50000, status: 'unpaid' },
          isActive: true
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockTeachers)
      };

      MockedTeacher.find = jest.fn().mockReturnValue(mockQuery);

      const result = await TeacherService.getTeachersWithUnpaidSalary();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Teachers with unpaid salary retrieved successfully');
      expect(result.data).toEqual(mockTeachers);
      expect(MockedTeacher.find).toHaveBeenCalledWith({
        'salary.status': 'unpaid',
        isActive: true
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid teacher ID', async () => {
      const result = await TeacherService.assignTeacherToClass(
        'invalid-id',
        '10',
        'A',
        'Mathematics'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid teacher ID');
    });

    it('should handle teacher not found', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      MockedTeacher.findById = jest.fn().mockResolvedValue(null);

      const result = await TeacherService.assignTeacherToClass(
        teacherId,
        '10',
        'A',
        'Mathematics'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Teacher not found');
    });

    it('should handle database errors gracefully', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      MockedTeacher.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const result = await TeacherService.assignTeacherToClass(
        teacherId,
        '10',
        'A',
        'Mathematics'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database connection failed');
      expect(result.error).toBe('Database connection failed');
    });
  });
});