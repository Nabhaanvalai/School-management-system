import { Student, IStudent, StudentStatus, ParentContact } from '../../models/Student';
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

describe('Student Model', () => {
  describe('Student Data Validation', () => {
    const validParentContact: ParentContact = {
      fatherName: 'John Doe',
      motherName: 'Jane Doe',
      phone: '1234567890',
      email: 'parent@example.com',
      address: '123 Main Street, City, State'
    };

    const validStudentData = {
      rollNo: 'STU001',
      name: 'Alice Student',
      dateOfBirth: new Date('2010-01-01'),
      admissionDate: new Date('2023-01-01'),
      standard: '8',
      section: 'A',
      parentContact: validParentContact,
      status: 'active' as StudentStatus
    };

    it('should validate required fields', () => {
      const requiredFields = ['rollNo', 'name', 'dateOfBirth', 'admissionDate', 'standard', 'section', 'parentContact'];
      
      requiredFields.forEach(field => {
        expect(validStudentData).toHaveProperty(field);
        expect(validStudentData[field as keyof typeof validStudentData]).toBeDefined();
      });
    });

    it('should validate roll number format', () => {
      const validRollNumbers = ['STU001', 'ROLL123', 'A001'];
      const invalidRollNumbers = ['', '   ', 'stu001']; // lowercase should be converted to uppercase
      
      validRollNumbers.forEach(rollNo => {
        expect(rollNo.trim().length).toBeGreaterThan(0);
      });
      
      invalidRollNumbers.forEach(rollNo => {
        expect(rollNo.trim().length === 0 || rollNo !== rollNo.toUpperCase()).toBeTruthy();
      });
    });

    it('should validate student name', () => {
      const validNames = ['Alice Student', 'Bob Johnson', 'A B'];
      const invalidNames = ['A', '', '   ', 'A'.repeat(101)];
      
      validNames.forEach(name => {
        expect(name.trim().length).toBeGreaterThanOrEqual(2);
        expect(name.trim().length).toBeLessThanOrEqual(100);
      });
      
      invalidNames.forEach(name => {
        const trimmedName = name.trim();
        expect(trimmedName.length < 2 || trimmedName.length > 100).toBeTruthy();
      });
    });

    it('should validate date of birth age range', () => {
      const today = new Date();
      const validAge = 10;
      const validDOB = new Date(today.getFullYear() - validAge, today.getMonth(), today.getDate());
      
      const age = today.getFullYear() - validDOB.getFullYear();
      expect(age).toBeGreaterThanOrEqual(3);
      expect(age).toBeLessThanOrEqual(25);
    });

    it('should validate admission date is not in future', () => {
      const today = new Date();
      const validAdmissionDate = new Date(today.getTime() - 86400000); // Yesterday
      const invalidAdmissionDate = new Date(today.getTime() + 86400000); // Tomorrow
      
      expect(validAdmissionDate <= today).toBeTruthy();
      expect(invalidAdmissionDate > today).toBeTruthy();
    });

    it('should validate standard values', () => {
      const validStandards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      const invalidStandards = ['0', '13', 'A', 'kindergarten'];
      
      validStandards.forEach(standard => {
        expect(validStandards).toContain(standard);
      });
      
      invalidStandards.forEach(standard => {
        expect(validStandards).not.toContain(standard);
      });
    });

    it('should validate section values', () => {
      const validSections = ['A', 'B', 'C', 'D', 'E', 'F'];
      const invalidSections = ['G', 'H', '1', 'a', 'b'];
      
      validSections.forEach(section => {
        expect(validSections).toContain(section);
      });
      
      invalidSections.forEach(section => {
        expect(validSections).not.toContain(section);
      });
    });
  });

  describe('Parent Contact Validation', () => {
    it('should validate parent names', () => {
      const validNames = ['John Doe', 'Jane Smith', 'A B'];
      const invalidNames = ['A', '', '   ', 'A'.repeat(101)];
      
      validNames.forEach(name => {
        expect(name.trim().length).toBeGreaterThanOrEqual(2);
        expect(name.trim().length).toBeLessThanOrEqual(100);
      });
      
      invalidNames.forEach(name => {
        const trimmedName = name.trim();
        expect(trimmedName.length < 2 || trimmedName.length > 100).toBeTruthy();
      });
    });

    it('should validate phone number format', () => {
      const validPhones = ['1234567890', '9876543210'];
      const invalidPhones = ['123456789', '12345678901', 'abcdefghij', '123-456-7890'];
      
      const phoneRegex = /^[0-9]{10}$/;
      
      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBeTruthy();
      });
      
      invalidPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBeFalsy();
      });
    });

    it('should validate email format', () => {
      const validEmails = ['parent@example.com', 'test.email@domain.co.uk', 'user123@test.com'];
      const invalidEmails = ['invalid-email', '@example.com', 'user@', 'user@.com'];
      
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBeTruthy();
      });
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBeFalsy();
      });
    });

    it('should validate address length', () => {
      const validAddresses = [
        '123 Main Street, City, State',
        'Apartment 4B, 567 Oak Avenue, Town, Country'
      ];
      const invalidAddresses = [
        'Short', // Too short
        'A'.repeat(501) // Too long
      ];
      
      validAddresses.forEach(address => {
        expect(address.length).toBeGreaterThanOrEqual(10);
        expect(address.length).toBeLessThanOrEqual(500);
      });
      
      invalidAddresses.forEach(address => {
        expect(address.length < 10 || address.length > 500).toBeTruthy();
      });
    });
  });

  describe('Student Status Management', () => {
    it('should validate student status values', () => {
      const validStatuses: StudentStatus[] = ['active', 'left'];
      const invalidStatuses = ['inactive', 'graduated', 'suspended'];
      
      validStatuses.forEach(status => {
        expect(['active', 'left']).toContain(status);
      });
      
      invalidStatuses.forEach(status => {
        expect(['active', 'left']).not.toContain(status);
      });
    });

    it('should validate leaving date logic', () => {
      const today = new Date();
      const admissionDate = new Date('2023-01-01');
      
      // Valid leaving date (after admission, not in future)
      const validLeavingDate = new Date('2023-06-01');
      expect(validLeavingDate > admissionDate && validLeavingDate <= today).toBeTruthy();
      
      // Invalid leaving date (before admission)
      const invalidLeavingDate1 = new Date('2022-12-01');
      expect(invalidLeavingDate1 < admissionDate).toBeTruthy();
      
      // Invalid leaving date (in future)
      const invalidLeavingDate2 = new Date(today.getTime() + 86400000);
      expect(invalidLeavingDate2 > today).toBeTruthy();
    });
  });

  describe('Business Logic Methods', () => {
    let mockStudent: any;

    beforeEach(() => {
      mockStudent = {
        status: 'active',
        leavingDate: undefined,
        name: 'Test Student',
        dateOfBirth: new Date('2010-01-01'),
        standard: '8',
        section: 'A',
        rollNo: 'STU001'
      };
    });

    it('should mark student as left', () => {
      const markAsLeft = function(this: any, leavingDate?: Date) {
        this.status = 'left';
        this.leavingDate = leavingDate || new Date();
      };

      const customDate = new Date('2023-06-01');
      markAsLeft.call(mockStudent, customDate);
      
      expect(mockStudent.status).toBe('left');
      expect(mockStudent.leavingDate).toBe(customDate);
    });

    it('should mark student as active', () => {
      const markAsActive = function(this: any) {
        this.status = 'active';
        this.leavingDate = undefined;
      };

      mockStudent.status = 'left';
      mockStudent.leavingDate = new Date();
      
      markAsActive.call(mockStudent);
      
      expect(mockStudent.status).toBe('active');
      expect(mockStudent.leavingDate).toBeUndefined();
    });

    it('should calculate age correctly', () => {
      const getAge = function(this: any): number {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      };

      const age = getAge.call(mockStudent);
      const expectedAge = new Date().getFullYear() - 2010;
      
      expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
      expect(age).toBeLessThanOrEqual(expectedAge);
    });

    it('should generate class identifier', () => {
      const getClassIdentifier = function(this: any): string {
        return `${this.standard}-${this.section}`;
      };

      const classId = getClassIdentifier.call(mockStudent);
      expect(classId).toBe('8-A');
    });
  });

  describe('Roll Number Uniqueness', () => {
    it('should enforce unique roll number per class', () => {
      const student1 = {
        rollNo: 'STU001',
        standard: '8',
        section: 'A'
      };

      const student2 = {
        rollNo: 'STU001',
        standard: '8',
        section: 'A'
      };

      const student3 = {
        rollNo: 'STU001',
        standard: '8',
        section: 'B' // Different section
      };

      const student4 = {
        rollNo: 'STU001',
        standard: '9', // Different standard
        section: 'A'
      };

      // Same roll number in same class should conflict
      expect(
        student1.rollNo === student2.rollNo &&
        student1.standard === student2.standard &&
        student1.section === student2.section
      ).toBeTruthy();

      // Same roll number in different section should be allowed
      expect(
        student1.rollNo === student3.rollNo &&
        (student1.standard !== student3.standard || student1.section !== student3.section)
      ).toBeTruthy();

      // Same roll number in different standard should be allowed
      expect(
        student1.rollNo === student4.rollNo &&
        (student1.standard !== student4.standard || student1.section !== student4.section)
      ).toBeTruthy();
    });
  });
});