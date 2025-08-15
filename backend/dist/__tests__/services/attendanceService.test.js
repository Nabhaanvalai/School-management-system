"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const attendanceService_1 = require("../../services/attendanceService");
const Attendance_1 = require("../../models/Attendance");
const Teacher_1 = require("../../models/Teacher");
const Student_1 = require("../../models/Student");
const mongoose_1 = __importDefault(require("mongoose"));
// Mock the models
jest.mock('../../models/Attendance');
jest.mock('../../models/Teacher');
jest.mock('../../models/Student');
const MockedAttendance = Attendance_1.Attendance;
const MockedTeacher = Teacher_1.Teacher;
const MockedStudent = Student_1.Student;
describe('AttendanceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('validateTeacherAuthorization', () => {
        it('should return valid when teacher is authorized', async () => {
            const mockTeacher = {
                _id: new mongoose_1.default.Types.ObjectId(),
                isActive: true,
                assignedClasses: [
                    {
                        standard: '8',
                        section: 'A',
                        subject: 'Mathematics',
                        academicYear: '2024-2025'
                    }
                ]
            };
            MockedTeacher.findById.mockResolvedValue(mockTeacher);
            const result = await attendanceService_1.AttendanceService.validateTeacherAuthorization('teacher123', '8-A', 'Mathematics', '2024-2025');
            expect(result.isValid).toBe(true);
            expect(MockedTeacher.findById).toHaveBeenCalledWith('teacher123');
        });
        it('should return invalid when teacher is not found', async () => {
            MockedTeacher.findById.mockResolvedValue(null);
            const result = await attendanceService_1.AttendanceService.validateTeacherAuthorization('teacher123', '8-A', 'Mathematics');
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Teacher not found');
        });
        it('should return invalid when teacher is not active', async () => {
            const mockTeacher = {
                _id: new mongoose_1.default.Types.ObjectId(),
                isActive: false,
                assignedClasses: []
            };
            MockedTeacher.findById.mockResolvedValue(mockTeacher);
            const result = await attendanceService_1.AttendanceService.validateTeacherAuthorization('teacher123', '8-A', 'Mathematics');
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Teacher is not active');
        });
        it('should return invalid when teacher is not assigned to class-subject', async () => {
            const mockTeacher = {
                _id: new mongoose_1.default.Types.ObjectId(),
                isActive: true,
                assignedClasses: [
                    {
                        standard: '9',
                        section: 'B',
                        subject: 'Physics',
                        academicYear: '2024-2025'
                    }
                ]
            };
            MockedTeacher.findById.mockResolvedValue(mockTeacher);
            const result = await attendanceService_1.AttendanceService.validateTeacherAuthorization('teacher123', '8-A', 'Mathematics', '2024-2025');
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('Teacher is not assigned to teach Mathematics for class 8-A');
        });
        it('should return invalid for malformed class ID', async () => {
            const result = await attendanceService_1.AttendanceService.validateTeacherAuthorization('teacher123', 'invalid-class', 'Mathematics');
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('Invalid class ID format');
        });
    });
    describe('validateStudentClass', () => {
        it('should return valid when student belongs to class', async () => {
            const mockStudent = {
                _id: new mongoose_1.default.Types.ObjectId(),
                status: 'active',
                standard: '8',
                section: 'A'
            };
            MockedStudent.findById.mockResolvedValue(mockStudent);
            const result = await attendanceService_1.AttendanceService.validateStudentClass('student123', '8-A');
            expect(result.isValid).toBe(true);
            expect(MockedStudent.findById).toHaveBeenCalledWith('student123');
        });
        it('should return invalid when student is not found', async () => {
            MockedStudent.findById.mockResolvedValue(null);
            const result = await attendanceService_1.AttendanceService.validateStudentClass('student123', '8-A');
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Student not found');
        });
        it('should return invalid when student is not active', async () => {
            const mockStudent = {
                _id: new mongoose_1.default.Types.ObjectId(),
                status: 'left',
                standard: '8',
                section: 'A'
            };
            MockedStudent.findById.mockResolvedValue(mockStudent);
            const result = await attendanceService_1.AttendanceService.validateStudentClass('student123', '8-A');
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Student is not active');
        });
        it('should return invalid when student does not belong to class', async () => {
            const mockStudent = {
                _id: new mongoose_1.default.Types.ObjectId(),
                status: 'active',
                standard: '9',
                section: 'B'
            };
            MockedStudent.findById.mockResolvedValue(mockStudent);
            const result = await attendanceService_1.AttendanceService.validateStudentClass('student123', '8-A');
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Student belongs to class 9-B, not 8-A');
        });
    });
    describe('markAttendance', () => {
        it('should successfully mark attendance when all validations pass', async () => {
            const mockTeacher = {
                _id: new mongoose_1.default.Types.ObjectId(),
                isActive: true,
                assignedClasses: [
                    {
                        standard: '8',
                        section: 'A',
                        subject: 'Mathematics',
                        academicYear: '2024-2025'
                    }
                ]
            };
            const mockStudent = {
                _id: new mongoose_1.default.Types.ObjectId(),
                status: 'active',
                standard: '8',
                section: 'A'
            };
            const mockAttendance = {
                _id: new mongoose_1.default.Types.ObjectId(),
                studentId: mockStudent._id,
                teacherId: mockTeacher._id,
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date(),
                status: 'present',
                academicYear: '2024-2025',
                save: jest.fn().mockResolvedValue(this),
                populate: jest.fn().mockResolvedValue(this)
            };
            MockedTeacher.findById.mockResolvedValue(mockTeacher);
            MockedStudent.findById.mockResolvedValue(mockStudent);
            MockedAttendance.attendanceExists = jest.fn().mockResolvedValue(false);
            MockedAttendance.prototype.constructor = jest.fn().mockReturnValue(mockAttendance);
            const attendanceData = {
                studentId: mockStudent._id.toString(),
                teacherId: mockTeacher._id.toString(),
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date(),
                status: 'present',
                academicYear: '2024-2025'
            };
            const result = await attendanceService_1.AttendanceService.markAttendance(attendanceData);
            expect(mockAttendance.save).toHaveBeenCalled();
            expect(mockAttendance.populate).toHaveBeenCalledWith([
                { path: 'teacherId', select: 'name employeeId' },
                { path: 'studentId', select: 'name rollNo' }
            ]);
        });
        it('should throw error when attendance already exists', async () => {
            const mockTeacher = {
                _id: new mongoose_1.default.Types.ObjectId(),
                isActive: true,
                assignedClasses: [
                    {
                        standard: '8',
                        section: 'A',
                        subject: 'Mathematics',
                        academicYear: '2024-2025'
                    }
                ]
            };
            const mockStudent = {
                _id: new mongoose_1.default.Types.ObjectId(),
                status: 'active',
                standard: '8',
                section: 'A'
            };
            MockedTeacher.findById.mockResolvedValue(mockTeacher);
            MockedStudent.findById.mockResolvedValue(mockStudent);
            MockedAttendance.attendanceExists = jest.fn().mockResolvedValue(true);
            const attendanceData = {
                studentId: mockStudent._id.toString(),
                teacherId: mockTeacher._id.toString(),
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date(),
                status: 'present',
                academicYear: '2024-2025'
            };
            await expect(attendanceService_1.AttendanceService.markAttendance(attendanceData))
                .rejects
                .toThrow('Attendance already marked for this student, class, subject, and date');
        });
        it('should throw error when teacher is not authorized', async () => {
            MockedTeacher.findById.mockResolvedValue(null);
            const attendanceData = {
                studentId: 'student123',
                teacherId: 'teacher123',
                classId: '8-A',
                subject: 'Mathematics',
                date: new Date(),
                status: 'present',
                academicYear: '2024-2025'
            };
            await expect(attendanceService_1.AttendanceService.markAttendance(attendanceData))
                .rejects
                .toThrow('Teacher not found');
        });
    });
    describe('calculateAttendancePercentage', () => {
        it('should calculate correct attendance percentage', async () => {
            MockedAttendance.countDocuments
                .mockResolvedValueOnce(20) // total records
                .mockResolvedValueOnce(16); // present records
            const result = await attendanceService_1.AttendanceService.calculateAttendancePercentage('student123');
            expect(result.totalDays).toBe(20);
            expect(result.presentDays).toBe(16);
            expect(result.absentDays).toBe(4);
            expect(result.percentage).toBe(80);
        });
        it('should return 0 percentage when no records exist', async () => {
            MockedAttendance.countDocuments
                .mockResolvedValueOnce(0) // total records
                .mockResolvedValueOnce(0); // present records
            const result = await attendanceService_1.AttendanceService.calculateAttendancePercentage('student123');
            expect(result.totalDays).toBe(0);
            expect(result.presentDays).toBe(0);
            expect(result.absentDays).toBe(0);
            expect(result.percentage).toBe(0);
        });
    });
});
//# sourceMappingURL=attendanceService.test.js.map