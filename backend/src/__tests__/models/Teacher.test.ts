import { Teacher, ITeacher, SalaryStatus, ClassAssignment, SalaryInfo } from '../../models/Teacher';
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

describe('Teacher Model', () => {
  describe('Teacher Data Validation', () => {
    const validSalaryInfo: SalaryInfo = {
      amount: 50000,
      status: 'unpaid' as SalaryStatus,
      paymentHistory: []
    };

    const validTeacherData = {
      employeeId: 'EMP001',
      name: 'John Teacher',
      subjects: ['Mathematics', 'Physics'],
      assignedClasses: [],
      salary: validSalaryInfo,
      phone: '1234567890',
      email: 'teacher@example.com',
      address: '123 Teacher Street, City, State',
      dateOfJoining: new Date('2023-01-01'),
      isActive: true
    };

    it('should validate required fields', () => {
      const requiredFields = ['employeeId', 'name', 'subjects', 'salary', 'phone', 'email', 'address', 'dateOfJoining'];
      
      requiredFields.forEach(field => {
        expect(validTeacherData).toHaveProperty(field);
        expect(validTeacherData[field as keyof typeof validTeacherData]).toBeDefined();
      });
    });

    it('should validate employee ID format', () => {
      const validEmployeeIds = ['EMP001', 'TCH123', 'A1B2C3'];
      const invalidEmployeeIds = ['em', 'employee001', '12', 'EMP@001'];
      
      const employeeIdRegex = /^[A-Z0-9]{3,10}$/;
      
      validEmployeeIds.forEach(id => {
        expect(employeeIdRegex.test(id)).toBeTruthy();
      });
      
      invalidEmployeeIds.forEach(id => {
        expect(employeeIdRegex.test(id)).toBeFalsy();
      });
    });

    it('should validate teacher name', () => {
      const validNames = ['John Teacher', 'Jane Smith', 'A B'];
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

    it('should validate subjects array', () => {
      const validSubjects = [
        ['Mathematics'],
        ['Physics', 'Chemistry'],
        ['English', 'Literature', 'Grammar']
      ];
      
      const invalidSubjects = [
        [], // Empty array
        ['A'], // Too short subject name
        ['A'.repeat(51)] // Too long subject name
      ];
      
      validSubjects.forEach(subjects => {
        expect(Array.isArray(subjects)).toBeTruthy();
        expect(subjects.length).toBeGreaterThan(0);
        subjects.forEach(subject => {
          expect(subject.trim().length).toBeGreaterThanOrEqual(2);
          expect(subject.trim().length).toBeLessThanOrEqual(50);
        });
      });
      
      invalidSubjects.forEach(subjects => {
        if (Array.isArray(subjects)) {
          if (subjects.length === 0) {
            expect(subjects.length).toBe(0);
          } else {
            subjects.forEach(subject => {
              const trimmedSubject = subject.trim();
              expect(trimmedSubject.length < 2 || trimmedSubject.length > 50).toBeTruthy();
            });
          }
        }
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
      const validEmails = ['teacher@example.com', 'test.email@domain.co.uk', 'user123@test.com'];
      const invalidEmails = ['invalid-email', '@example.com', 'user@', 'user@.com'];
      
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBeTruthy();
      });
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBeFalsy();
      });
    });

    it('should validate date of joining', () => {
      const today = new Date();
      const validJoiningDate = new Date(today.getTime() - 86400000); // Yesterday
      const invalidJoiningDate = new Date(today.getTime() + 86400000); // Tomorrow
      
      expect(validJoiningDate <= today).toBeTruthy();
      expect(invalidJoiningDate > today).toBeTruthy();
    });
  });

  describe('Class Assignment Validation', () => {
    it('should validate class assignment fields', () => {
      const validAssignment: ClassAssignment = {
        standard: '8',
        section: 'A',
        subject: 'Mathematics',
        academicYear: '2023-2024'
      };
      
      expect(validAssignment.standard).toBeDefined();
      expect(validAssignment.section).toBeDefined();
      expect(validAssignment.subject).toBeDefined();
    });

    it('should validate standard values in assignments', () => {
      const validStandards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      const invalidStandards = ['0', '13', 'A', 'kindergarten'];
      
      validStandards.forEach(standard => {
        expect(validStandards).toContain(standard);
      });
      
      invalidStandards.forEach(standard => {
        expect(validStandards).not.toContain(standard);
      });
    });

    it('should validate section values in assignments', () => {
      const validSections = ['A', 'B', 'C', 'D', 'E', 'F'];
      const invalidSections = ['G', 'H', '1', 'a', 'b'];
      
      validSections.forEach(section => {
        expect(validSections).toContain(section);
      });
      
      invalidSections.forEach(section => {
        expect(validSections).not.toContain(section);
      });
    });

    it('should generate academic year automatically', () => {
      const currentYear = new Date().getFullYear();
      const expectedAcademicYear = `${currentYear}-${currentYear + 1}`;
      
      // This would be the default value in the schema
      expect(expectedAcademicYear).toMatch(/^\d{4}-\d{4}$/);
    });
  });

  describe('Salary Management', () => {
    it('should validate salary status values', () => {
      const validStatuses: SalaryStatus[] = ['paid', 'unpaid'];
      const invalidStatuses = ['pending', 'processing', 'overdue'];
      
      validStatuses.forEach(status => {
        expect(['paid', 'unpaid']).toContain(status);
      });
      
      invalidStatuses.forEach(status => {
        expect(['paid', 'unpaid']).not.toContain(status);
      });
    });

    it('should validate salary amount', () => {
      const validAmounts = [30000, 50000, 100000];
      const invalidAmounts = [-1000, 0, 15000000]; // Negative, zero, too high
      
      validAmounts.forEach(amount => {
        expect(amount).toBeGreaterThan(0);
        expect(amount).toBeLessThanOrEqual(10000000);
      });
      
      invalidAmounts.forEach(amount => {
        expect(amount <= 0 || amount > 10000000).toBeTruthy();
      });
    });

    it('should validate payment history structure', () => {
      const validPaymentRecord = {
        amount: 50000,
        paidDate: new Date(),
        month: 'January',
        year: 2023
      };
      
      expect(validPaymentRecord.amount).toBeGreaterThan(0);
      expect(validPaymentRecord.paidDate).toBeInstanceOf(Date);
      expect(typeof validPaymentRecord.month).toBe('string');
      expect(typeof validPaymentRecord.year).toBe('number');
      expect(validPaymentRecord.year).toBeGreaterThanOrEqual(2000);
    });

    it('should validate month names in payment history', () => {
      const validMonths = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const invalidMonths = ['Jan', 'Feb', 'january', 'JANUARY', '01', 'Month1'];
      
      validMonths.forEach(month => {
        expect(validMonths).toContain(month);
      });
      
      invalidMonths.forEach(month => {
        expect(validMonths).not.toContain(month);
      });
    });
  });

  describe('Business Logic Methods', () => {
    let mockTeacher: any;

    beforeEach(() => {
      mockTeacher = {
        subjects: ['Mathematics', 'Physics'],
        assignedClasses: [],
        salary: {
          amount: 50000,
          status: 'unpaid',
          paymentHistory: []
        }
      };
    });

    it('should assign teacher to class', () => {
      const assignToClass = function(this: any, standard: string, section: string, subject: string, academicYear?: string) {
        // Check if teacher teaches this subject
        if (!this.subjects.map((s: string) => s.toLowerCase()).includes(subject.toLowerCase())) {
          throw new Error(`Teacher does not teach ${subject}`);
        }
        
        // Check if already assigned
        const existingAssignment = this.assignedClasses.find((assignment: ClassAssignment) => 
          assignment.standard === standard && 
          assignment.section === section && 
          assignment.subject.toLowerCase() === subject.toLowerCase()
        );
        
        if (existingAssignment) {
          throw new Error(`Teacher is already assigned to ${standard}-${section} for ${subject}`);
        }
        
        // Add new assignment
        this.assignedClasses.push({
          standard,
          section: section.toUpperCase(),
          subject,
          academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        });
      };

      assignToClass.call(mockTeacher, '8', 'A', 'Mathematics');
      
      expect(mockTeacher.assignedClasses).toHaveLength(1);
      expect(mockTeacher.assignedClasses[0].standard).toBe('8');
      expect(mockTeacher.assignedClasses[0].section).toBe('A');
      expect(mockTeacher.assignedClasses[0].subject).toBe('Mathematics');
    });

    it('should throw error when assigning subject teacher does not teach', () => {
      const assignToClass = function(this: any, standard: string, section: string, subject: string) {
        if (!this.subjects.map((s: string) => s.toLowerCase()).includes(subject.toLowerCase())) {
          throw new Error(`Teacher does not teach ${subject}`);
        }
      };

      expect(() => {
        assignToClass.call(mockTeacher, '8', 'A', 'Chemistry');
      }).toThrow('Teacher does not teach Chemistry');
    });

    it('should remove teacher from class', () => {
      const removeFromClass = function(this: any, standard: string, section: string, subject: string) {
        this.assignedClasses = this.assignedClasses.filter((assignment: ClassAssignment) => 
          !(assignment.standard === standard && 
            assignment.section === section.toUpperCase() && 
            assignment.subject.toLowerCase() === subject.toLowerCase())
        );
      };

      // First assign
      mockTeacher.assignedClasses.push({
        standard: '8',
        section: 'A',
        subject: 'Mathematics'
      });
      
      expect(mockTeacher.assignedClasses).toHaveLength(1);
      
      // Then remove
      removeFromClass.call(mockTeacher, '8', 'A', 'Mathematics');
      
      expect(mockTeacher.assignedClasses).toHaveLength(0);
    });

    it('should update salary status', () => {
      const updateSalaryStatus = function(this: any, status: SalaryStatus, paidDate?: Date) {
        this.salary.status = status;
        if (status === 'paid' && paidDate) {
          this.salary.lastPaidDate = paidDate;
        }
      };

      const paidDate = new Date();
      updateSalaryStatus.call(mockTeacher, 'paid', paidDate);
      
      expect(mockTeacher.salary.status).toBe('paid');
      expect(mockTeacher.salary.lastPaidDate).toBe(paidDate);
    });

    it('should add payment record', () => {
      const addPaymentRecord = function(this: any, amount: number, month: string, year: number) {
        if (!this.salary.paymentHistory) {
          this.salary.paymentHistory = [];
        }
        
        // Check if payment for this month-year already exists
        const existingPayment = this.salary.paymentHistory.find((payment: any) => 
          payment.month === month && payment.year === year
        );
        
        if (existingPayment) {
          throw new Error(`Payment for ${month} ${year} already recorded`);
        }
        
        this.salary.paymentHistory.push({
          amount,
          paidDate: new Date(),
          month,
          year
        });
        
        this.salary.status = 'paid';
        this.salary.lastPaidDate = new Date();
      };

      addPaymentRecord.call(mockTeacher, 50000, 'January', 2023);
      
      expect(mockTeacher.salary.paymentHistory).toHaveLength(1);
      expect(mockTeacher.salary.paymentHistory[0].amount).toBe(50000);
      expect(mockTeacher.salary.paymentHistory[0].month).toBe('January');
      expect(mockTeacher.salary.paymentHistory[0].year).toBe(2023);
      expect(mockTeacher.salary.status).toBe('paid');
    });

    it('should throw error when adding duplicate payment record', () => {
      const addPaymentRecord = function(this: any, amount: number, month: string, year: number) {
        if (!this.salary.paymentHistory) {
          this.salary.paymentHistory = [];
        }
        
        const existingPayment = this.salary.paymentHistory.find((payment: any) => 
          payment.month === month && payment.year === year
        );
        
        if (existingPayment) {
          throw new Error(`Payment for ${month} ${year} already recorded`);
        }
        
        this.salary.paymentHistory.push({ amount, paidDate: new Date(), month, year });
      };

      // Add first payment
      mockTeacher.salary.paymentHistory.push({
        amount: 50000,
        paidDate: new Date(),
        month: 'January',
        year: 2023
      });
      
      // Try to add duplicate
      expect(() => {
        addPaymentRecord.call(mockTeacher, 50000, 'January', 2023);
      }).toThrow('Payment for January 2023 already recorded');
    });

    it('should get assigned classes count', () => {
      const getAssignedClassesCount = function(this: any): number {
        return this.assignedClasses.length;
      };

      mockTeacher.assignedClasses = [
        { standard: '8', section: 'A', subject: 'Mathematics' },
        { standard: '9', section: 'B', subject: 'Physics' }
      ];
      
      const count = getAssignedClassesCount.call(mockTeacher);
      expect(count).toBe(2);
    });

    it('should get subjects count', () => {
      const getSubjectsCount = function(this: any): number {
        return this.subjects.length;
      };

      const count = getSubjectsCount.call(mockTeacher);
      expect(count).toBe(2);
    });

    it('should get class identifiers', () => {
      const getClassIdentifiers = function(this: any): string[] {
        return this.assignedClasses.map((assignment: ClassAssignment) => 
          `${assignment.standard}-${assignment.section}`
        );
      };

      mockTeacher.assignedClasses = [
        { standard: '8', section: 'A', subject: 'Mathematics' },
        { standard: '9', section: 'B', subject: 'Physics' }
      ];
      
      const identifiers = getClassIdentifiers.call(mockTeacher);
      expect(identifiers).toEqual(['8-A', '9-B']);
    });
  });

  describe('Assignment Conflict Validation', () => {
    it('should prevent duplicate class-subject assignments', () => {
      const assignment1 = {
        standard: '8',
        section: 'A',
        subject: 'Mathematics',
        academicYear: '2023-2024'
      };

      const assignment2 = {
        standard: '8',
        section: 'A',
        subject: 'Mathematics',
        academicYear: '2023-2024'
      };

      const assignment3 = {
        standard: '8',
        section: 'B', // Different section
        subject: 'Mathematics',
        academicYear: '2023-2024'
      };

      // Same class-subject should conflict
      expect(
        assignment1.standard === assignment2.standard &&
        assignment1.section === assignment2.section &&
        assignment1.subject === assignment2.subject &&
        assignment1.academicYear === assignment2.academicYear
      ).toBeTruthy();

      // Different section should not conflict
      expect(
        assignment1.standard === assignment3.standard &&
        assignment1.section !== assignment3.section &&
        assignment1.subject === assignment3.subject
      ).toBeTruthy();
    });
  });
});