"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const Student_1 = require("../models/Student");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Student service handling all student-related business logic
 */
class StudentService {
    /**
     * Create a new student
     */
    static async createStudent(studentData) {
        try {
            // Check if roll number is unique for the class
            const isUnique = await Student_1.Student.isRollNoUnique(studentData.rollNo, studentData.standard, studentData.section);
            if (!isUnique) {
                return {
                    success: false,
                    message: `Roll number ${studentData.rollNo} already exists in ${studentData.standard}-${studentData.section}`
                };
            }
            const student = new Student_1.Student(studentData);
            await student.save();
            return {
                success: true,
                message: 'Student created successfully',
                data: student
            };
        }
        catch (error) {
            console.error('Create student service error:', error);
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                return {
                    success: false,
                    message: 'Validation failed',
                    error: validationErrors.join(', ')
                };
            }
            if (error.code === 11000) {
                return {
                    success: false,
                    message: 'Student with this roll number already exists in the class'
                };
            }
            return {
                success: false,
                message: 'Failed to create student',
                error: error.message
            };
        }
    }
    /**
     * Get students with filtering and pagination
     */
    static async getStudents(filters = {}, pagination) {
        try {
            const { page, limit, sortBy, sortOrder } = pagination;
            const skip = (page - 1) * limit;
            // Build query
            const query = {};
            if (filters.standard) {
                query.standard = filters.standard;
            }
            if (filters.section) {
                query.section = filters.section;
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.search) {
                query.$or = [
                    { name: { $regex: filters.search, $options: 'i' } },
                    { rollNo: { $regex: filters.search, $options: 'i' } },
                    { 'parentContact.fatherName': { $regex: filters.search, $options: 'i' } },
                    { 'parentContact.motherName': { $regex: filters.search, $options: 'i' } },
                    { 'parentContact.phone': { $regex: filters.search, $options: 'i' } }
                ];
            }
            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            // Execute query with pagination
            const [students, totalCount] = await Promise.all([
                Student_1.Student.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Student_1.Student.countDocuments(query)
            ]);
            const totalPages = Math.ceil(totalCount / limit);
            const result = {
                data: students,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };
            return {
                success: true,
                message: 'Students retrieved successfully',
                data: result
            };
        }
        catch (error) {
            console.error('Get students service error:', error);
            return {
                success: false,
                message: 'Failed to retrieve students',
                error: error.message
            };
        }
    }
    /**
     * Get student by ID
     */
    static async getStudentById(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid student ID'
                };
            }
            const student = await Student_1.Student.findById(id);
            if (!student) {
                return {
                    success: false,
                    message: 'Student not found'
                };
            }
            return {
                success: true,
                message: 'Student retrieved successfully',
                data: student
            };
        }
        catch (error) {
            console.error('Get student by ID service error:', error);
            return {
                success: false,
                message: 'Failed to retrieve student',
                error: error.message
            };
        }
    }
    /**
     * Update student by ID
     */
    static async updateStudent(id, updateData) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid student ID'
                };
            }
            const existingStudent = await Student_1.Student.findById(id);
            if (!existingStudent) {
                return {
                    success: false,
                    message: 'Student not found'
                };
            }
            // If updating roll number, standard, or section, check uniqueness
            if (updateData.rollNo || updateData.standard || updateData.section) {
                const rollNo = updateData.rollNo || existingStudent.rollNo;
                const standard = updateData.standard || existingStudent.standard;
                const section = updateData.section || existingStudent.section;
                const isUnique = await Student_1.Student.isRollNoUnique(rollNo, standard, section, id);
                if (!isUnique) {
                    return {
                        success: false,
                        message: `Roll number ${rollNo} already exists in ${standard}-${section}`
                    };
                }
            }
            const updatedStudent = await Student_1.Student.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
            return {
                success: true,
                message: 'Student updated successfully',
                data: updatedStudent
            };
        }
        catch (error) {
            console.error('Update student service error:', error);
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                return {
                    success: false,
                    message: 'Validation failed',
                    error: validationErrors.join(', ')
                };
            }
            if (error.code === 11000) {
                return {
                    success: false,
                    message: 'Student with this roll number already exists in the class'
                };
            }
            return {
                success: false,
                message: 'Failed to update student',
                error: error.message
            };
        }
    }
    /**
     * Transfer student to different standard/section
     */
    static async transferStudent(id, newStandard, newSection, newRollNo) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid student ID'
                };
            }
            const student = await Student_1.Student.findById(id);
            if (!student) {
                return {
                    success: false,
                    message: 'Student not found'
                };
            }
            if (student.status !== 'active') {
                return {
                    success: false,
                    message: 'Cannot transfer inactive student'
                };
            }
            // Use existing roll number if new one not provided
            const rollNo = newRollNo || student.rollNo;
            // Check if roll number is unique in the new class
            const isUnique = await Student_1.Student.isRollNoUnique(rollNo, newStandard, newSection, id);
            if (!isUnique) {
                return {
                    success: false,
                    message: `Roll number ${rollNo} already exists in ${newStandard}-${newSection}`
                };
            }
            // Update student with new class details
            const updatedStudent = await Student_1.Student.findByIdAndUpdate(id, {
                standard: newStandard,
                section: newSection,
                rollNo: rollNo
            }, { new: true, runValidators: true });
            return {
                success: true,
                message: `Student transferred successfully to ${newStandard}-${newSection}`,
                data: updatedStudent
            };
        }
        catch (error) {
            console.error('Transfer student service error:', error);
            return {
                success: false,
                message: 'Failed to transfer student',
                error: error.message
            };
        }
    }
    /**
     * Mark student as left with specific leaving date
     */
    static async markStudentAsLeft(id, leavingDate) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid student ID'
                };
            }
            const student = await Student_1.Student.findById(id);
            if (!student) {
                return {
                    success: false,
                    message: 'Student not found'
                };
            }
            if (student.status === 'left') {
                return {
                    success: false,
                    message: 'Student is already marked as left'
                };
            }
            // Parse leaving date if provided, otherwise use current date
            const parsedLeavingDate = leavingDate ? new Date(leavingDate) : new Date();
            // Validate leaving date
            if (isNaN(parsedLeavingDate.getTime())) {
                return {
                    success: false,
                    message: 'Invalid leaving date format'
                };
            }
            if (parsedLeavingDate < student.admissionDate) {
                return {
                    success: false,
                    message: 'Leaving date cannot be before admission date'
                };
            }
            if (parsedLeavingDate > new Date()) {
                return {
                    success: false,
                    message: 'Leaving date cannot be in the future'
                };
            }
            // Mark student as left with the specified date
            student.markAsLeft(parsedLeavingDate);
            await student.save();
            return {
                success: true,
                message: 'Student marked as left successfully',
                data: student
            };
        }
        catch (error) {
            console.error('Mark student as left service error:', error);
            return {
                success: false,
                message: 'Failed to mark student as left',
                error: error.message
            };
        }
    }
    /**
     * Archive student (soft delete)
     */
    static async archiveStudent(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid student ID'
                };
            }
            const student = await Student_1.Student.findById(id);
            if (!student) {
                return {
                    success: false,
                    message: 'Student not found'
                };
            }
            // Mark as left instead of deleting
            student.markAsLeft();
            await student.save();
            return {
                success: true,
                message: 'Student archived successfully',
                data: student
            };
        }
        catch (error) {
            console.error('Archive student service error:', error);
            return {
                success: false,
                message: 'Failed to archive student',
                error: error.message
            };
        }
    }
    /**
     * Get student count by class with detailed statistics
     */
    static async getStudentCountByClass() {
        try {
            const counts = await Student_1.Student.aggregate([
                {
                    $group: {
                        _id: {
                            standard: '$standard',
                            section: '$section'
                        },
                        totalStudents: { $sum: 1 },
                        activeStudents: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                            }
                        },
                        leftStudents: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'left'] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        standard: '$_id.standard',
                        section: '$_id.section',
                        classIdentifier: {
                            $concat: ['$_id.standard', '-', '$_id.section']
                        },
                        totalStudents: 1,
                        activeStudents: 1,
                        leftStudents: 1
                    }
                },
                {
                    $sort: {
                        standard: 1,
                        section: 1
                    }
                }
            ]);
            // Also get overall statistics
            const overallStats = await Student_1.Student.aggregate([
                {
                    $group: {
                        _id: null,
                        totalStudents: { $sum: 1 },
                        activeStudents: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                            }
                        },
                        leftStudents: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'left'] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalStudents: 1,
                        activeStudents: 1,
                        leftStudents: 1
                    }
                }
            ]);
            return {
                success: true,
                message: 'Student counts retrieved successfully',
                data: {
                    classCounts: counts,
                    overallStats: overallStats[0] || {
                        totalStudents: 0,
                        activeStudents: 0,
                        leftStudents: 0
                    }
                }
            };
        }
        catch (error) {
            console.error('Get student count service error:', error);
            return {
                success: false,
                message: 'Failed to retrieve student counts',
                error: error.message
            };
        }
    }
    /**
     * Get students by class
     */
    static async getStudentsByClass(standard, section) {
        try {
            const students = await Student_1.Student.findByClass(standard, section);
            return {
                success: true,
                message: 'Class students retrieved successfully',
                data: students
            };
        }
        catch (error) {
            console.error('Get students by class service error:', error);
            return {
                success: false,
                message: 'Failed to retrieve class students',
                error: error.message
            };
        }
    }
}
exports.StudentService = StudentService;
//# sourceMappingURL=studentService.js.map