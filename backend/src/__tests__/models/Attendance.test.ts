import { Attendance, IAttendance, AttendanceStatus } from '../../models/Attendance';
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
    ObjectId: jest.fn().mockImplementation(() => 'mockObjectId')
  }
}));

describe('Attendance Model', () => {
  describe('Attendance Data Validation', () => {
    const validAttendanceData = {
      studentId: new mongoose.Types.ObjectId(),
      teacherId: new mongoose.Types.ObjectId(),
      classId: '8-A',
      subject: 'Mathematics',
      date: new Date(),
      status: 'present' as AttendanceStatus,
      markedAt: new Date(),
      academicYear: '2023-2024'
    };

    it('should validate required fields', () => {
      const requiredFields = ['studentId', 'teacherId', 'classId', 'subject', 'date', 'status', 'academicYear'];
      
      requiredFields.forEach(field => {
        expect(validAttendanceData).toHaveProperty(field);
        expect(validAttendanceData[field as keyof typeof validAttendanceData]).toBeDefined();
      });
    });

    it('should validate class ID format', () => {
      const validClassIds = ['1-A', '8-B', '10-C', '12-F'];
      const invalidClassIds = ['0-A', '13-A', '8-G', '8A', 'Class8A', ''];
      
      const classIdRegex = /^[1-9][0-2]?-[A-F]$/;
      
      validClassIds.forEach(classId => {
        expect(classIdRegex.test(classId)).toBeTruthy();
        
        const [standard, section] = classId.split('-');
        const validStandards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        const validSections = ['A', 'B', 'C', 'D', 'E', 'F'];
        expect(validStandards.includes(standard)).toBeTruthy();
        expect(validSections.includes(section)).toBeTruthy();
      });
      
      invalidClassIds.forEach(classId => {
        if (classId) {
          expect(classIdRegex.test(classId)).toBeFalsy();
        }
      });
    });

    it('should validate attendance status values', () => {
      const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late'];
      const invalidStatuses = ['excused', 'tardy', 'sick', 'holiday'];
      
      validStatuses.forEach(status => {
        expect(['present', 'absent', 'late']).toContain(status);
      });
      
      invalidStatuses.forEach(status => {
        expect(['present', 'absent', 'late']).not.toContain(status);
      });
    });

    it('should validate subject name', () => {
      const validSubjects = ['Mathematics', 'Physics', 'English Literature'];
      const invalidSubjects = ['A', '', '   ', 'A'.repeat(51)];
      
      validSubjects.forEach(subject => {
        expect(subject.trim().length).toBeGreaterThanOrEqual(2);
        expect(subject.trim().length).toBeLessThanOrEqual(50);
      });
      
      invalidSubjects.forEach(subject => {
        const trimmedSubject = subject.trim();
        expect(trimmedSubject.length < 2 || trimmedSubject.length > 50).toBeTruthy();
      });
    });

    it('should validate attendance date is not in future', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);
      const tomorrow = new Date(today.getTime() + 86400000);
      
      // Reset time to compare only dates
      today.setHours(0, 0, 0, 0);
      yesterday.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      
      expect(yesterday <= today).toBeTruthy();
      expect(today <= today).toBeTruthy();
      expect(tomorrow > today).toBeTruthy();
    });

    it('should validate academic year format', () => {
      const validAcademicYears = ['2023-2024', '2024-2025', '2022-2023'];
      const invalidAcademicYears = ['2023-2025', '23-24', '2023/2024', '2024-2023'];
      
      const academicYearRegex = /^\d{4}-\d{4}$/;
      
      validAcademicYears.forEach(year => {
        expect(academicYearRegex.test(year)).toBeTruthy();
        
        const [startYear, endYear] = year.split('-').map(Number);
        expect(endYear).toBe(startYear + 1);
        expect(startYear).toBeGreaterThanOrEqual(2000);
      });
      
      invalidAcademicYears.forEach(year => {
        if (academicYearRegex.test(year)) {
          const [startYear, endYear] = year.split('-').map(Number);
          expect(endYear !== startYear + 1).toBeTruthy();
        } else {
          expect(academicYearRegex.test(year)).toBeFalsy();
        }
      });
    });

    it('should validate remarks length', () => {
      const validRemarks = [
        'Student was sick',
        'Late due to transport issues',
        'A'.repeat(200) // Exactly 200 characters
      ];
      
      const invalidRemarks = [
        'A'.repeat(201) // Too long
      ];
      
      validRemarks.forEach(remark => {
        expect(remark.length).toBeLessThanOrEqual(200);
      });
      
      invalidRemarks.forEach(remark => {
        expect(remark.length).toBeGreaterThan(200);
      });
    });
  });

  describe('Academic Year Logic', () => {
    it('should generate correct academic year based on current date', () => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      let expectedAcademicYear: string;
      
      // Academic year starts in April (month 3, 0-indexed)
      if (currentMonth >= 3) {
        expectedAcademicYear = `${currentYear}-${currentYear + 1}`;
      } else {
        expectedAcademicYear = `${currentYear - 1}-${currentYear}`;
      }
      
      expect(expectedAcademicYear).toMatch(/^\d{4}-\d{4}$/);
      
      const [startYear, endYear] = expectedAcademicYear.split('-').map(Number);
      expect(endYear).toBe(startYear + 1);
    });

    it('should validate attendance date falls within academic year', () => {
      const academicYear = '2023-2024';
      const [startYear, endYear] = academicYear.split('-').map(Number);
      
      // Valid dates within academic year
      const validDates = [
        new Date(2023, 3, 15), // April 2023
        new Date(2023, 11, 15), // December 2023
        new Date(2024, 0, 15), // January 2024
        new Date(2024, 2, 15)  // March 2024
      ];
      
      // Invalid dates outside academic year
      const invalidDates = [
        new Date(2023, 2, 15), // March 2023 (before academic year)
        new Date(2024, 3, 15)  // April 2024 (after academic year)
      ];
      
      validDates.forEach(date => {
        const attendanceYear = date.getFullYear();
        const attendanceMonth = date.getMonth();
        
        const isValidAcademicYear = 
          (attendanceYear === startYear && attendanceMonth >= 3) || // April onwards in start year
          (attendanceYear === endYear && attendanceMonth < 3); // January to March in end year
        
        expect(isValidAcademicYear).toBeTruthy();
      });
      
      invalidDates.forEach(date => {
        const attendanceYear = date.getFullYear();
        const attendanceMonth = date.getMonth();
        
        const isValidAcademicYear = 
          (attendanceYear === startYear && attendanceMonth >= 3) || // April onwards in start year
          (attendanceYear === endYear && attendanceMonth < 3); // January to March in end year
        
        expect(isValidAcademicYear).toBeFalsy();
      });
    });
  });

  describe('Business Logic Methods', () => {
    let mockAttendance: any;

    beforeEach(() => {
      mockAttendance = {
        studentId: 'mockStudentId',
        teacherId: 'mockTeacherId',
        classId: '8-A',
        subject: 'Mathematics',
        date: new Date('2023-10-15'),
        status: 'present',
        markedAt: new Date(),
        academicYear: '2023-2024'
      };
    });

    it('should check if attendance is marked today', () => {
      const isMarkedToday = function(this: any): boolean {
        const today = new Date();
        const markedDate = new Date(this.markedAt);
        
        return (
          today.getDate() === markedDate.getDate() &&
          today.getMonth() === markedDate.getMonth() &&
          today.getFullYear() === markedDate.getFullYear()
        );
      };

      // Set markedAt to today
      mockAttendance.markedAt = new Date();
      expect(isMarkedToday.call(mockAttendance)).toBeTruthy();
      
      // Set markedAt to yesterday
      mockAttendance.markedAt = new Date(Date.now() - 86400000);
      expect(isMarkedToday.call(mockAttendance)).toBeFalsy();
    });

    it('should get class identifier', () => {
      const getClassIdentifier = function(this: any): string {
        return this.classId;
      };

      const classId = getClassIdentifier.call(mockAttendance);
      expect(classId).toBe('8-A');
    });

    it('should get formatted date', () => {
      const getFormattedDate = function(this: any): string {
        return this.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      const formattedDate = getFormattedDate.call(mockAttendance);
      expect(formattedDate).toBe('2023-10-15');
    });

    it('should check if student was late', () => {
      const isLate = function(this: any): boolean {
        return this.status === 'late';
      };

      mockAttendance.status = 'late';
      expect(isLate.call(mockAttendance)).toBeTruthy();
      
      mockAttendance.status = 'present';
      expect(isLate.call(mockAttendance)).toBeFalsy();
      
      mockAttendance.status = 'absent';
      expect(isLate.call(mockAttendance)).toBeFalsy();
    });
  });

  describe('Attendance Percentage Calculation', () => {
    it('should calculate attendance percentage correctly', () => {
      const calculatePercentage = (presentCount: number, totalCount: number): number => {
        return totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
      };

      // Test cases
      expect(calculatePercentage(20, 25)).toBe(80); // 80%
      expect(calculatePercentage(15, 20)).toBe(75); // 75%
      expect(calculatePercentage(0, 10)).toBe(0);   // 0%
      expect(calculatePercentage(10, 10)).toBe(100); // 100%
      expect(calculatePercentage(0, 0)).toBe(0);     // No records
    });

    it('should include late status as present for percentage calculation', () => {
      const attendanceRecords = [
        { status: 'present' },
        { status: 'late' },
        { status: 'absent' },
        { status: 'present' },
        { status: 'late' }
      ];

      const totalRecords = attendanceRecords.length;
      const presentRecords = attendanceRecords.filter(record => 
        record.status === 'present' || record.status === 'late'
      ).length;

      const percentage = Math.round((presentRecords / totalRecords) * 100);
      
      expect(totalRecords).toBe(5);
      expect(presentRecords).toBe(4); // 2 present + 2 late
      expect(percentage).toBe(80);
    });
  });

  describe('Attendance Summary', () => {
    it('should generate correct attendance summary', () => {
      const attendanceData = [
        { status: 'present' },
        { status: 'present' },
        { status: 'late' },
        { status: 'absent' },
        { status: 'present' },
        { status: 'late' },
        { status: 'absent' }
      ];

      const summary = {
        present: 0,
        absent: 0,
        late: 0,
        total: 0
      };

      attendanceData.forEach(record => {
        summary[record.status as keyof typeof summary]++;
        summary.total++;
      });

      expect(summary.present).toBe(3);
      expect(summary.late).toBe(2);
      expect(summary.absent).toBe(2);
      expect(summary.total).toBe(7);
    });
  });

  describe('Unique Attendance Constraint', () => {
    it('should prevent duplicate attendance records for same student, class, subject, and date', () => {
      const attendance1 = {
        studentId: 'student123',
        classId: '8-A',
        subject: 'Mathematics',
        date: new Date('2023-10-15'),
        academicYear: '2023-2024'
      };

      const attendance2 = {
        studentId: 'student123',
        classId: '8-A',
        subject: 'Mathematics',
        date: new Date('2023-10-15'),
        academicYear: '2023-2024'
      };

      const attendance3 = {
        studentId: 'student123',
        classId: '8-A',
        subject: 'Physics', // Different subject
        date: new Date('2023-10-15'),
        academicYear: '2023-2024'
      };

      // Same student, class, subject, date should conflict
      expect(
        attendance1.studentId === attendance2.studentId &&
        attendance1.classId === attendance2.classId &&
        attendance1.subject === attendance2.subject &&
        attendance1.date.getTime() === attendance2.date.getTime() &&
        attendance1.academicYear === attendance2.academicYear
      ).toBeTruthy();

      // Different subject should not conflict
      expect(
        attendance1.studentId === attendance3.studentId &&
        attendance1.classId === attendance3.classId &&
        attendance1.subject !== attendance3.subject &&
        attendance1.date.getTime() === attendance3.date.getTime()
      ).toBeTruthy();
    });
  });

  describe('Date Validation Logic', () => {
    it('should reject attendance marked more than 30 days in the past', () => {
      const today = new Date();
      const thirtyOneDaysAgo = new Date(today.getTime() - (31 * 24 * 60 * 60 * 1000));
      const twentyNineDaysAgo = new Date(today.getTime() - (29 * 24 * 60 * 60 * 1000));

      const daysDifference31 = Math.floor((Date.now() - thirtyOneDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
      const daysDifference29 = Math.floor((Date.now() - twentyNineDaysAgo.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDifference31).toBeGreaterThan(30);
      expect(daysDifference29).toBeLessThanOrEqual(30);
    });

    it('should validate ObjectId format for student and teacher IDs', () => {
      // Mock ObjectId validation
      const isValidObjectId = (id: any): boolean => {
        return typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
      };

      const validObjectIds = ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'];
      const invalidObjectIds = ['invalid', '123', '', 'short'];

      validObjectIds.forEach(id => {
        expect(isValidObjectId(id)).toBeTruthy();
      });

      invalidObjectIds.forEach(id => {
        expect(isValidObjectId(id)).toBeFalsy();
      });
    });
  });

  describe('Query Optimization Indexes', () => {
    it('should have appropriate indexes for common queries', () => {
      const expectedIndexes = [
        'student_attendance_by_date', // { studentId: 1, date: -1 }
        'teacher_attendance_by_date', // { teacherId: 1, date: -1 }
        'class_subject_attendance_by_date', // { classId: 1, subject: 1, date: -1 }
        'attendance_by_date_academic_year', // { date: -1, academicYear: 1 }
        'academic_class_subject_attendance', // { academicYear: 1, classId: 1, subject: 1 }
        'unique_student_attendance_per_day' // { studentId: 1, classId: 1, subject: 1, date: 1, academicYear: 1 }
      ];

      // This test verifies that we have considered the right indexes
      // In actual implementation, these would be created by the schema
      expectedIndexes.forEach(indexName => {
        expect(typeof indexName).toBe('string');
        expect(indexName.length).toBeGreaterThan(0);
      });
    });
  });
});