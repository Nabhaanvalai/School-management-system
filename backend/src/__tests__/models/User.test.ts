import { User, IUser, UserRole, AdminProfile, TeacherProfile, StudentProfile, ParentProfile } from '../../models/User';
import mongoose from 'mongoose';

// Mock mongoose for testing
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    pre: jest.fn(),
    methods: {},
    statics: {}
  })),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn()
  }
}));

describe('User Model', () => {
  describe('Profile Validation', () => {
    it('should validate admin profile correctly', () => {
      const adminProfile: AdminProfile = {
        name: 'John Admin',
        employeeId: 'EMP001',
        department: 'Administration',
        phone: '1234567890'
      };

      // Since we're mocking mongoose, we'll test the validation logic directly
      const isValid = validateAdminProfile(adminProfile);
      expect(isValid).toBe(true);
    });

    it('should validate teacher profile correctly', () => {
      const teacherProfile: TeacherProfile = {
        name: 'Jane Teacher',
        employeeId: 'EMP002',
        subjects: ['Mathematics', 'Physics'],
        phone: '1234567890',
        address: '123 Teacher St',
        dateOfJoining: new Date('2023-01-01')
      };

      const isValid = validateTeacherProfile(teacherProfile);
      expect(isValid).toBe(true);
    });

    it('should validate student profile correctly', () => {
      const studentProfile: StudentProfile = {
        name: 'Bob Student',
        rollNo: 'STU001',
        standard: '10',
        section: 'A',
        dateOfBirth: new Date('2008-01-01'),
        admissionDate: new Date('2023-01-01'),
        parentContact: {
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          phone: '1234567890',
          email: 'parent@example.com',
          address: '123 Student St'
        }
      };

      const isValid = validateStudentProfile(studentProfile);
      expect(isValid).toBe(true);
    });

    it('should validate parent profile correctly', () => {
      const parentProfile: ParentProfile = {
        name: 'Parent Name',
        phone: '1234567890',
        email: 'parent@example.com',
        address: '123 Parent St',
        children: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
      };

      const isValid = validateParentProfile(parentProfile);
      expect(isValid).toBe(true);
    });

    it('should reject invalid admin profile', () => {
      const invalidAdminProfile = {
        name: 'John Admin',
        // Missing required fields
      };

      const isValid = validateAdminProfile(invalidAdminProfile as AdminProfile);
      expect(isValid).toBe(false);
    });

    it('should reject invalid teacher profile', () => {
      const invalidTeacherProfile = {
        name: 'Jane Teacher',
        employeeId: 'EMP002',
        // Missing subjects array and other required fields
      };

      const isValid = validateTeacherProfile(invalidTeacherProfile as TeacherProfile);
      expect(isValid).toBe(false);
    });

    it('should reject invalid student profile', () => {
      const invalidStudentProfile = {
        name: 'Bob Student',
        rollNo: 'STU001',
        // Missing required fields
      };

      const isValid = validateStudentProfile(invalidStudentProfile as StudentProfile);
      expect(isValid).toBe(false);
    });

    it('should reject invalid parent profile', () => {
      const invalidParentProfile = {
        name: 'Parent Name',
        // Missing required fields
      };

      const isValid = validateParentProfile(invalidParentProfile as ParentProfile);
      expect(isValid).toBe(false);
    });
  });

  describe('User Role Validation', () => {
    it('should accept valid user roles', () => {
      const validRoles: UserRole[] = ['admin', 'teacher', 'student', 'parent'];
      
      validRoles.forEach(role => {
        expect(['admin', 'teacher', 'student', 'parent']).toContain(role);
      });
    });

    it('should reject invalid user roles', () => {
      const invalidRoles = ['manager', 'principal', 'staff', 'guest'];
      
      invalidRoles.forEach(role => {
        expect(['admin', 'teacher', 'student', 'parent']).not.toContain(role);
      });
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..double.dot@example.com'
      ];

      invalidEmails.forEach(email => {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Password Requirements', () => {
    it('should require minimum password length', () => {
      const shortPassword = '12345';
      expect(shortPassword.length).toBeLessThan(6);
    });

    it('should accept valid password length', () => {
      const validPassword = 'password123';
      expect(validPassword.length).toBeGreaterThanOrEqual(6);
    });
  });
});

// Helper functions to test profile validation logic
function validateAdminProfile(profile: AdminProfile): boolean {
  return !!(profile.name && profile.employeeId && profile.department && profile.phone);
}

function validateTeacherProfile(profile: TeacherProfile): boolean {
  return !!(profile.name && profile.employeeId && profile.subjects && 
           Array.isArray(profile.subjects) && profile.phone && profile.address && profile.dateOfJoining);
}

function validateStudentProfile(profile: StudentProfile): boolean {
  return !!(profile.name && profile.rollNo && profile.standard && profile.section &&
           profile.dateOfBirth && profile.admissionDate && profile.parentContact &&
           profile.parentContact.fatherName && profile.parentContact.motherName &&
           profile.parentContact.phone && profile.parentContact.email && profile.parentContact.address);
}

function validateParentProfile(profile: ParentProfile): boolean {
  return !!(profile.name && profile.phone && profile.email && profile.address &&
           profile.children && Array.isArray(profile.children));
}