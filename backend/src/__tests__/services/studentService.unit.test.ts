import { StudentService } from '../../services/studentService';

// Mock the Student model
jest.mock('../../models/Student', () => ({
  Student: {
    isRollNoUnique: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    findByClass: jest.fn(),
    prototype: {
      save: jest.fn(),
      markAsLeft: jest.fn()
    }
  }
}));

describe('StudentService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStudent', () => {
    it('should be defined', () => {
      expect(StudentService.createStudent).toBeDefined();
    });

    it('should have correct method signature', () => {
      expect(typeof StudentService.createStudent).toBe('function');
    });
  });

  describe('getStudents', () => {
    it('should be defined', () => {
      expect(StudentService.getStudents).toBeDefined();
    });

    it('should have correct method signature', () => {
      expect(typeof StudentService.getStudents).toBe('function');
    });
  });

  describe('getStudentById', () => {
    it('should be defined', () => {
      expect(StudentService.getStudentById).toBeDefined();
    });

    it('should have correct method signature', () => {
      expect(typeof StudentService.getStudentById).toBe('function');
    });

    it('should return error for invalid ID format', async () => {
      const result = await StudentService.getStudentById('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid student ID');
    });
  });

  describe('updateStudent', () => {
    it('should be defined', () => {
      expect(StudentService.updateStudent).toBeDefined();
    });

    it('should have correct method signature', () => {
      expect(typeof StudentService.updateStudent).toBe('function');
    });

    it('should return error for invalid ID format', async () => {
      const result = await StudentService.updateStudent('invalid-id', {});
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid student ID');
    });
  });

  describe('transferStudent', () => {
    it('should be defined', () => {
      expect(StudentService.transferStudent).toBeDefined();
    });

    it('should have correct method signature', () => {
      expect(typeof StudentService.transferStudent).toBe('function');
    });

    it('should return error for invalid ID format', async () => {
      const result = await StudentService.transferStudent('invalid-id', '6', 'A');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid student ID');
    });
  });

  describe('archiveStudent', () => {
    it('should be defined', () => {
      expect(StudentService.archiveStudent).toBeDefined();
    });

    it('should have correct method signature', () => {
      expect(typeof StudentService.archiveStudent).toBe('function');
    });

    it('should return error for invalid ID format', async () => {
      const result = await StudentService.archiveStudent('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid student ID');
    });
  });

  describe('getStudentCountByClass', () => {
    it('should be defined', () => {
      expect(StudentService.getStudentCountByClass).toBeDefined();
    });

    it('should have correct method signature', () => {
      expect(typeof StudentService.getStudentCountByClass).toBe('function');
    });
  });

  describe('getStudentsByClass', () => {
    it('should be defined', () => {
      expect(StudentService.getStudentsByClass).toBeDefined();
    });

    it('should have correct method signature', () => {
      expect(typeof StudentService.getStudentsByClass).toBe('function');
    });
  });
});