"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const studentService_1 = require("../../services/studentService");
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
            expect(studentService_1.StudentService.createStudent).toBeDefined();
        });
        it('should have correct method signature', () => {
            expect(typeof studentService_1.StudentService.createStudent).toBe('function');
        });
    });
    describe('getStudents', () => {
        it('should be defined', () => {
            expect(studentService_1.StudentService.getStudents).toBeDefined();
        });
        it('should have correct method signature', () => {
            expect(typeof studentService_1.StudentService.getStudents).toBe('function');
        });
    });
    describe('getStudentById', () => {
        it('should be defined', () => {
            expect(studentService_1.StudentService.getStudentById).toBeDefined();
        });
        it('should have correct method signature', () => {
            expect(typeof studentService_1.StudentService.getStudentById).toBe('function');
        });
        it('should return error for invalid ID format', async () => {
            const result = await studentService_1.StudentService.getStudentById('invalid-id');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid student ID');
        });
    });
    describe('updateStudent', () => {
        it('should be defined', () => {
            expect(studentService_1.StudentService.updateStudent).toBeDefined();
        });
        it('should have correct method signature', () => {
            expect(typeof studentService_1.StudentService.updateStudent).toBe('function');
        });
        it('should return error for invalid ID format', async () => {
            const result = await studentService_1.StudentService.updateStudent('invalid-id', {});
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid student ID');
        });
    });
    describe('transferStudent', () => {
        it('should be defined', () => {
            expect(studentService_1.StudentService.transferStudent).toBeDefined();
        });
        it('should have correct method signature', () => {
            expect(typeof studentService_1.StudentService.transferStudent).toBe('function');
        });
        it('should return error for invalid ID format', async () => {
            const result = await studentService_1.StudentService.transferStudent('invalid-id', '6', 'A');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid student ID');
        });
    });
    describe('archiveStudent', () => {
        it('should be defined', () => {
            expect(studentService_1.StudentService.archiveStudent).toBeDefined();
        });
        it('should have correct method signature', () => {
            expect(typeof studentService_1.StudentService.archiveStudent).toBe('function');
        });
        it('should return error for invalid ID format', async () => {
            const result = await studentService_1.StudentService.archiveStudent('invalid-id');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid student ID');
        });
    });
    describe('getStudentCountByClass', () => {
        it('should be defined', () => {
            expect(studentService_1.StudentService.getStudentCountByClass).toBeDefined();
        });
        it('should have correct method signature', () => {
            expect(typeof studentService_1.StudentService.getStudentCountByClass).toBe('function');
        });
    });
    describe('getStudentsByClass', () => {
        it('should be defined', () => {
            expect(studentService_1.StudentService.getStudentsByClass).toBeDefined();
        });
        it('should have correct method signature', () => {
            expect(typeof studentService_1.StudentService.getStudentsByClass).toBe('function');
        });
    });
});
//# sourceMappingURL=studentService.unit.test.js.map