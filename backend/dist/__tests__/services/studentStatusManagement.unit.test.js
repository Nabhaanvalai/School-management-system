"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const studentService_1 = require("../../services/studentService");
const Student_1 = require("../../models/Student");
const mongoose_1 = __importDefault(require("mongoose"));
// Mock the Student model
jest.mock('../../models/Student');
const MockedStudent = Student_1.Student;
describe('Student Status Management Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('markStudentAsLeft', () => {
        const mockStudentId = new mongoose_1.default.Types.ObjectId().toString();
        const mockStudent = {
            _id: mockStudentId,
            rollNo: 'STU001',
            name: 'Test Student',
            status: 'active',
            admissionDate: new Date('2020-04-01'),
            markAsLeft: jest.fn(),
            save: jest.fn()
        };
        it('should mark student as left with current date when no leaving date provided', async () => {
            MockedStudent.findById.mockResolvedValue(mockStudent);
            mockStudent.save.mockResolvedValue(mockStudent);
            const result = await studentService_1.StudentService.markStudentAsLeft(mockStudentId);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Student marked as left successfully');
            expect(MockedStudent.findById).toHaveBeenCalledWith(mockStudentId);
            expect(mockStudent.markAsLeft).toHaveBeenCalled();
            expect(mockStudent.save).toHaveBeenCalled();
        });
        it('should mark student as left with specific leaving date', async () => {
            MockedStudent.findById.mockResolvedValue(mockStudent);
            mockStudent.save.mockResolvedValue(mockStudent);
            const leavingDate = '2023-12-15';
            const result = await studentService_1.StudentService.markStudentAsLeft(mockStudentId, leavingDate);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Student marked as left successfully');
            expect(mockStudent.markAsLeft).toHaveBeenCalledWith(new Date(leavingDate));
        });
        it('should reject invalid student ID', async () => {
            const result = await studentService_1.StudentService.markStudentAsLeft('invalid-id');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid student ID');
            expect(MockedStudent.findById).not.toHaveBeenCalled();
        });
        it('should return error when student not found', async () => {
            MockedStudent.findById.mockResolvedValue(null);
            const result = await studentService_1.StudentService.markStudentAsLeft(mockStudentId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Student not found');
        });
        it('should reject marking already left student as left', async () => {
            const leftStudent = { ...mockStudent, status: 'left' };
            MockedStudent.findById.mockResolvedValue(leftStudent);
            const result = await studentService_1.StudentService.markStudentAsLeft(mockStudentId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Student is already marked as left');
            expect(mockStudent.save).not.toHaveBeenCalled();
        });
        it('should reject invalid leaving date format', async () => {
            MockedStudent.findById.mockResolvedValue(mockStudent);
            const result = await studentService_1.StudentService.markStudentAsLeft(mockStudentId, 'invalid-date');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid leaving date format');
            expect(mockStudent.save).not.toHaveBeenCalled();
        });
        it('should reject leaving date before admission date', async () => {
            MockedStudent.findById.mockResolvedValue(mockStudent);
            const leavingDate = '2019-01-01'; // Before admission date (2020-04-01)
            const result = await studentService_1.StudentService.markStudentAsLeft(mockStudentId, leavingDate);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Leaving date cannot be before admission date');
            expect(mockStudent.save).not.toHaveBeenCalled();
        });
        it('should reject future leaving date', async () => {
            MockedStudent.findById.mockResolvedValue(mockStudent);
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const leavingDate = futureDate.toISOString().split('T')[0];
            const result = await studentService_1.StudentService.markStudentAsLeft(mockStudentId, leavingDate);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Leaving date cannot be in the future');
            expect(mockStudent.save).not.toHaveBeenCalled();
        });
        it('should handle database errors gracefully', async () => {
            MockedStudent.findById.mockRejectedValue(new Error('Database error'));
            const result = await studentService_1.StudentService.markStudentAsLeft(mockStudentId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Failed to mark student as left');
            expect(result.error).toBe('Database error');
        });
    });
    describe('getStudentCountByClass', () => {
        it('should return detailed student count statistics', async () => {
            const mockClassCounts = [
                {
                    standard: '10',
                    section: 'A',
                    classIdentifier: '10-A',
                    totalStudents: 3,
                    activeStudents: 2,
                    leftStudents: 1
                },
                {
                    standard: '10',
                    section: 'B',
                    classIdentifier: '10-B',
                    totalStudents: 1,
                    activeStudents: 1,
                    leftStudents: 0
                }
            ];
            const mockOverallStats = {
                totalStudents: 4,
                activeStudents: 3,
                leftStudents: 1
            };
            MockedStudent.aggregate
                .mockResolvedValueOnce(mockClassCounts) // First aggregation for class counts
                .mockResolvedValueOnce([mockOverallStats]); // Second aggregation for overall stats
            const result = await studentService_1.StudentService.getStudentCountByClass();
            expect(result.success).toBe(true);
            expect(result.message).toBe('Student counts retrieved successfully');
            expect(result.data).toEqual({
                classCounts: mockClassCounts,
                overallStats: mockOverallStats
            });
            expect(MockedStudent.aggregate).toHaveBeenCalledTimes(2);
        });
        it('should handle empty database gracefully', async () => {
            MockedStudent.aggregate
                .mockResolvedValueOnce([]) // Empty class counts
                .mockResolvedValueOnce([]); // Empty overall stats
            const result = await studentService_1.StudentService.getStudentCountByClass();
            expect(result.success).toBe(true);
            expect(result.data.classCounts).toEqual([]);
            expect(result.data.overallStats).toEqual({
                totalStudents: 0,
                activeStudents: 0,
                leftStudents: 0
            });
        });
        it('should handle database errors gracefully', async () => {
            MockedStudent.aggregate.mockRejectedValue(new Error('Database error'));
            const result = await studentService_1.StudentService.getStudentCountByClass();
            expect(result.success).toBe(false);
            expect(result.message).toBe('Failed to retrieve student counts');
            expect(result.error).toBe('Database error');
        });
    });
    describe('archiveStudent', () => {
        const mockStudentId = new mongoose_1.default.Types.ObjectId().toString();
        const mockStudent = {
            _id: mockStudentId,
            rollNo: 'STU001',
            name: 'Test Student',
            status: 'active',
            markAsLeft: jest.fn(),
            save: jest.fn()
        };
        it('should archive student by marking as left', async () => {
            MockedStudent.findById.mockResolvedValue(mockStudent);
            mockStudent.save.mockResolvedValue(mockStudent);
            const result = await studentService_1.StudentService.archiveStudent(mockStudentId);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Student archived successfully');
            expect(mockStudent.markAsLeft).toHaveBeenCalled();
            expect(mockStudent.save).toHaveBeenCalled();
        });
        it('should handle archiving already left student', async () => {
            const leftStudent = { ...mockStudent, status: 'left' };
            MockedStudent.findById.mockResolvedValue(leftStudent);
            leftStudent.save = jest.fn().mockResolvedValue(leftStudent);
            const result = await studentService_1.StudentService.archiveStudent(mockStudentId);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Student archived successfully');
        });
        it('should reject invalid student ID', async () => {
            const result = await studentService_1.StudentService.archiveStudent('invalid-id');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid student ID');
        });
        it('should return error when student not found', async () => {
            MockedStudent.findById.mockResolvedValue(null);
            const result = await studentService_1.StudentService.archiveStudent(mockStudentId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Student not found');
        });
    });
    describe('getStudents with status filtering', () => {
        it('should filter students by status', async () => {
            const mockStudents = [
                { _id: '1', name: 'Student 1', status: 'active' },
                { _id: '2', name: 'Student 2', status: 'active' }
            ];
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockStudents)
            };
            MockedStudent.find.mockReturnValue(mockQuery);
            MockedStudent.countDocuments.mockResolvedValue(2);
            const filters = { status: 'active' };
            const pagination = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
            const result = await studentService_1.StudentService.getStudents(filters, pagination);
            expect(result.success).toBe(true);
            expect(result.data.data).toEqual(mockStudents);
            expect(result.data.pagination.totalItems).toBe(2);
            expect(MockedStudent.find).toHaveBeenCalledWith({ status: 'active' });
        });
        it('should return all students when no status filter applied', async () => {
            const mockStudents = [
                { _id: '1', name: 'Student 1', status: 'active' },
                { _id: '2', name: 'Student 2', status: 'left' }
            ];
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockStudents)
            };
            MockedStudent.find.mockReturnValue(mockQuery);
            MockedStudent.countDocuments.mockResolvedValue(2);
            const filters = {};
            const pagination = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
            const result = await studentService_1.StudentService.getStudents(filters, pagination);
            expect(result.success).toBe(true);
            expect(result.data.data).toEqual(mockStudents);
            expect(result.data.pagination.totalItems).toBe(2);
            expect(MockedStudent.find).toHaveBeenCalledWith({});
        });
    });
});
//# sourceMappingURL=studentStatusManagement.unit.test.js.map