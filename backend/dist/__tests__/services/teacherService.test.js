"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const teacherService_1 = require("../../services/teacherService");
const Teacher_1 = require("../../models/Teacher");
const mongoose_1 = __importDefault(require("mongoose"));
// Mock the Teacher model
jest.mock('../../models/Teacher');
const MockedTeacher = Teacher_1.Teacher;
describe('TeacherService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('createTeacher', () => {
        it('should create a teacher successfully', async () => {
            const teacherData = {
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics', 'Physics'],
                phone: '1234567890',
                email: 'john.doe@school.com',
                address: '123 Main Street, City',
                dateOfJoining: new Date('2023-01-15'),
                salary: {
                    amount: 50000,
                    status: 'unpaid'
                }
            };
            const mockTeacher = {
                ...teacherData,
                _id: new mongoose_1.default.Types.ObjectId(),
                assignedClasses: [],
                isActive: true,
                save: jest.fn().mockResolvedValue(true)
            };
            MockedTeacher.prototype.constructor = jest.fn().mockReturnValue(mockTeacher);
            MockedTeacher.prototype.save = jest.fn().mockResolvedValue(mockTeacher);
            const result = await teacherService_1.TeacherService.createTeacher(teacherData);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Teacher created successfully');
            expect(result.data).toBeDefined();
        });
        it('should handle validation errors', async () => {
            const teacherData = {
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics'],
                phone: '1234567890',
                email: 'john.doe@school.com',
                address: '123 Main Street, City',
                dateOfJoining: new Date('2023-01-15'),
                salary: {
                    amount: 50000,
                    status: 'unpaid'
                }
            };
            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            validationError.errors = {
                name: { message: 'Name is required' }
            };
            const mockTeacher = {
                save: jest.fn().mockRejectedValue(validationError)
            };
            MockedTeacher.mockImplementation(() => mockTeacher);
            const result = await teacherService_1.TeacherService.createTeacher(teacherData);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Validation failed');
            expect(result.error).toBe('Name is required');
        });
        it('should handle duplicate employee ID error', async () => {
            const teacherData = {
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics'],
                phone: '1234567890',
                email: 'john.doe@school.com',
                address: '123 Main Street, City',
                dateOfJoining: new Date('2023-01-15'),
                salary: {
                    amount: 50000,
                    status: 'unpaid'
                }
            };
            const duplicateError = new Error('Duplicate key error');
            duplicateError.code = 11000;
            duplicateError.keyPattern = { employeeId: 1 };
            const mockTeacher = {
                save: jest.fn().mockRejectedValue(duplicateError)
            };
            MockedTeacher.mockImplementation(() => mockTeacher);
            const result = await teacherService_1.TeacherService.createTeacher(teacherData);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Teacher with this employeeId already exists');
        });
    });
    describe('getTeachers', () => {
        it('should get teachers with pagination', async () => {
            const mockTeachers = [
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    employeeId: 'T001',
                    name: 'John Doe',
                    subjects: ['Mathematics'],
                    assignedClasses: [],
                    salary: { amount: 50000, status: 'paid' },
                    isActive: true
                },
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    employeeId: 'T002',
                    name: 'Jane Smith',
                    subjects: ['English'],
                    assignedClasses: [],
                    salary: { amount: 45000, status: 'unpaid' },
                    isActive: true
                }
            ];
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockTeachers)
            };
            MockedTeacher.find = jest.fn().mockReturnValue(mockQuery);
            MockedTeacher.countDocuments = jest.fn().mockResolvedValue(2);
            const filters = { search: 'John' };
            const pagination = { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' };
            const result = await teacherService_1.TeacherService.getTeachers(filters, pagination);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Teachers retrieved successfully');
            expect(result.data.data).toHaveLength(2);
            expect(result.data.pagination.totalItems).toBe(2);
            expect(result.data.pagination.currentPage).toBe(1);
        });
        it('should filter teachers by subjects', async () => {
            const mockTeachers = [
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    employeeId: 'T001',
                    name: 'John Doe',
                    subjects: ['Mathematics'],
                    assignedClasses: [],
                    salary: { amount: 50000, status: 'paid' },
                    isActive: true
                }
            ];
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockTeachers)
            };
            MockedTeacher.find = jest.fn().mockReturnValue(mockQuery);
            MockedTeacher.countDocuments = jest.fn().mockResolvedValue(1);
            const filters = { subjects: ['Mathematics'] };
            const pagination = { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' };
            const result = await teacherService_1.TeacherService.getTeachers(filters, pagination);
            expect(MockedTeacher.find).toHaveBeenCalledWith({
                subjects: { $in: ['Mathematics'] }
            });
            expect(result.success).toBe(true);
        });
    });
    describe('getTeacherById', () => {
        it('should get teacher by valid ID', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            const mockTeacher = {
                _id: teacherId,
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics'],
                assignedClasses: [],
                salary: { amount: 50000, status: 'paid' },
                isActive: true
            };
            MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);
            const result = await teacherService_1.TeacherService.getTeacherById(teacherId);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Teacher retrieved successfully');
            expect(result.data).toEqual(mockTeacher);
        });
        it('should return error for invalid ID', async () => {
            const invalidId = 'invalid-id';
            const result = await teacherService_1.TeacherService.getTeacherById(invalidId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid teacher ID');
        });
        it('should return error when teacher not found', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            MockedTeacher.findById = jest.fn().mockResolvedValue(null);
            const result = await teacherService_1.TeacherService.getTeacherById(teacherId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Teacher not found');
        });
    });
    describe('updateTeacher', () => {
        it('should update teacher successfully', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            const updateData = { name: 'John Updated' };
            const existingTeacher = {
                _id: teacherId,
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics'],
                isActive: true
            };
            const updatedTeacher = { ...existingTeacher, ...updateData };
            MockedTeacher.findById = jest.fn().mockResolvedValue(existingTeacher);
            MockedTeacher.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedTeacher);
            const result = await teacherService_1.TeacherService.updateTeacher(teacherId, updateData);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Teacher updated successfully');
            expect(result.data.name).toBe('John Updated');
        });
        it('should return error for non-existent teacher', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            const updateData = { name: 'John Updated' };
            MockedTeacher.findById = jest.fn().mockResolvedValue(null);
            const result = await teacherService_1.TeacherService.updateTeacher(teacherId, updateData);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Teacher not found');
        });
    });
    describe('assignTeacherToClass', () => {
        it('should assign teacher to class successfully', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
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
            MockedTeacher.findOne = jest.fn().mockResolvedValue(null);
            const result = await teacherService_1.TeacherService.assignTeacherToClass(teacherId, '10', 'A', 'Mathematics');
            expect(mockTeacher.assignToClass).toHaveBeenCalledWith('10', 'A', 'Mathematics', undefined);
            expect(mockTeacher.save).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.message).toBe('Teacher assigned to 10-A for Mathematics successfully');
        });
        it('should return error when teacher does not teach the subject', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            const mockTeacher = {
                _id: teacherId,
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics'],
                assignedClasses: [],
                isActive: true
            };
            MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);
            const result = await teacherService_1.TeacherService.assignTeacherToClass(teacherId, '10', 'A', 'Physics');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Teacher does not teach Physics');
        });
        it('should return error when assignment conflict exists', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            const mockTeacher = {
                _id: teacherId,
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics'],
                assignedClasses: [],
                isActive: true
            };
            const conflictingTeacher = {
                _id: new mongoose_1.default.Types.ObjectId(),
                name: 'Jane Smith'
            };
            MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);
            MockedTeacher.findOne = jest.fn().mockResolvedValue(conflictingTeacher);
            const result = await teacherService_1.TeacherService.assignTeacherToClass(teacherId, '10', 'A', 'Mathematics');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Another teacher (Jane Smith) is already assigned to 10-A for Mathematics');
        });
        it('should return error for inactive teacher', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            const mockTeacher = {
                _id: teacherId,
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics'],
                assignedClasses: [],
                isActive: false
            };
            MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);
            const result = await teacherService_1.TeacherService.assignTeacherToClass(teacherId, '10', 'A', 'Mathematics');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Cannot assign inactive teacher');
        });
    });
    describe('removeTeacherFromClass', () => {
        it('should remove teacher from class successfully', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
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
            const result = await teacherService_1.TeacherService.removeTeacherFromClass(teacherId, '10', 'A', 'Mathematics');
            expect(mockTeacher.removeFromClass).toHaveBeenCalledWith('10', 'A', 'Mathematics');
            expect(mockTeacher.save).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.message).toBe('Teacher removed from 10-A for Mathematics successfully');
        });
        it('should return error when assignment does not exist', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            const mockTeacher = {
                _id: teacherId,
                employeeId: 'T001',
                name: 'John Doe',
                subjects: ['Mathematics'],
                assignedClasses: [],
                isActive: true
            };
            MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);
            const result = await teacherService_1.TeacherService.removeTeacherFromClass(teacherId, '10', 'A', 'Mathematics');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Teacher is not assigned to 10-A for Mathematics');
        });
    });
    describe('getTeachersBySubject', () => {
        it('should get teachers by subject', async () => {
            const mockTeachers = [
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    employeeId: 'T001',
                    name: 'John Doe',
                    subjects: ['Mathematics'],
                    isActive: true
                }
            ];
            const mockQuery = {
                sort: jest.fn().mockResolvedValue(mockTeachers)
            };
            MockedTeacher.find = jest.fn().mockReturnValue(mockQuery);
            const result = await teacherService_1.TeacherService.getTeachersBySubject('Mathematics');
            expect(MockedTeacher.find).toHaveBeenCalledWith({
                subjects: { $regex: new RegExp('Mathematics', 'i') },
                isActive: true
            });
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTeachers);
        });
    });
    describe('getTeachersByClass', () => {
        it('should get teachers by class', async () => {
            const mockTeachers = [
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
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
            const result = await teacherService_1.TeacherService.getTeachersByClass('10', 'A');
            expect(MockedTeacher.find).toHaveBeenCalledWith({
                'assignedClasses.standard': '10',
                'assignedClasses.section': 'A',
                isActive: true
            });
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTeachers);
        });
    });
    describe('getTeachersWithUnpaidSalary', () => {
        it('should get teachers with unpaid salary', async () => {
            const mockTeachers = [
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
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
            const result = await teacherService_1.TeacherService.getTeachersWithUnpaidSalary();
            expect(MockedTeacher.find).toHaveBeenCalledWith({
                'salary.status': 'unpaid',
                isActive: true
            });
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTeachers);
        });
    });
    describe('archiveTeacher', () => {
        it('should archive teacher successfully', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            const mockTeacher = {
                _id: teacherId,
                employeeId: 'T001',
                name: 'John Doe',
                isActive: true,
                save: jest.fn().mockResolvedValue(true)
            };
            MockedTeacher.findById = jest.fn().mockResolvedValue(mockTeacher);
            const result = await teacherService_1.TeacherService.archiveTeacher(teacherId);
            expect(mockTeacher.isActive).toBe(false);
            expect(mockTeacher.save).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.message).toBe('Teacher archived successfully');
        });
        it('should return error when teacher not found', async () => {
            const teacherId = new mongoose_1.default.Types.ObjectId().toString();
            MockedTeacher.findById = jest.fn().mockResolvedValue(null);
            const result = await teacherService_1.TeacherService.archiveTeacher(teacherId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Teacher not found');
        });
    });
});
//# sourceMappingURL=teacherService.test.js.map