"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableService = void 0;
const Timetable_1 = require("../models/Timetable");
const Teacher_1 = require("../models/Teacher");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Timetable service handling all timetable-related business logic
 */
class TimetableService {
    /**
     * Create a new timetable
     */
    static async createTimetable(timetableData) {
        try {
            // Check if timetable already exists for this class and academic year
            const existingTimetable = await Timetable_1.Timetable.findOne({
                classId: timetableData.classId,
                academicYear: timetableData.academicYear || this.getCurrentAcademicYear(),
                isActive: true
            });
            if (existingTimetable) {
                return {
                    success: false,
                    message: 'Active timetable already exists for this class and academic year',
                    error: 'TIMETABLE_EXISTS'
                };
            }
            // Validate all teachers exist
            const teacherIds = timetableData.schedule.flatMap(day => day.periods.map(period => period.teacherId));
            const uniqueTeacherIds = [...new Set(teacherIds)];
            const teachers = await Teacher_1.Teacher.find({
                _id: { $in: uniqueTeacherIds.map(id => new mongoose_1.default.Types.ObjectId(id)) }
            });
            if (teachers.length !== uniqueTeacherIds.length) {
                return {
                    success: false,
                    message: 'One or more teachers not found',
                    error: 'INVALID_TEACHERS'
                };
            }
            // Check teacher availability for all periods
            for (const daySchedule of timetableData.schedule) {
                for (const period of daySchedule.periods) {
                    const isAvailable = await Timetable_1.Timetable.checkTeacherAvailability(period.teacherId, daySchedule.day, period.startTime, period.endTime, timetableData.academicYear || this.getCurrentAcademicYear());
                    if (!isAvailable) {
                        return {
                            success: false,
                            message: `Teacher is not available for ${daySchedule.day} ${period.startTime}-${period.endTime}`,
                            error: 'TEACHER_CONFLICT'
                        };
                    }
                }
            }
            // Create the timetable
            const timetable = new Timetable_1.Timetable({
                ...timetableData,
                academicYear: timetableData.academicYear || this.getCurrentAcademicYear(),
                createdBy: new mongoose_1.default.Types.ObjectId(timetableData.createdBy)
            });
            const savedTimetable = await timetable.save();
            const populatedTimetable = await Timetable_1.Timetable.findById(savedTimetable._id)
                .populate('schedule.periods.teacherId', 'name employeeId')
                .populate('createdBy', 'email');
            return {
                success: true,
                message: 'Timetable created successfully',
                data: populatedTimetable
            };
        }
        catch (error) {
            console.error('Create timetable service error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create timetable',
                error: error.code || 'CREATE_ERROR'
            };
        }
    }
    /**
     * Get timetable by class ID
     */
    static async getTimetableByClass(classId, academicYear) {
        try {
            const query = {
                classId: classId.toUpperCase(),
                isActive: true
            };
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const timetable = await Timetable_1.Timetable.findOne(query)
                .populate('schedule.periods.teacherId', 'name employeeId subjects')
                .populate('createdBy', 'email');
            if (!timetable) {
                return {
                    success: false,
                    message: 'Timetable not found for this class',
                    error: 'NOT_FOUND'
                };
            }
            return {
                success: true,
                message: 'Timetable retrieved successfully',
                data: timetable
            };
        }
        catch (error) {
            console.error('Get timetable by class service error:', error);
            return {
                success: false,
                message: 'Failed to retrieve timetable',
                error: 'FETCH_ERROR'
            };
        }
    }
    /**
     * Get teacher's schedule across all classes
     */
    static async getTeacherSchedule(teacherId, academicYear) {
        try {
            // Validate teacher exists
            const teacher = await Teacher_1.Teacher.findById(teacherId);
            if (!teacher) {
                return {
                    success: false,
                    message: 'Teacher not found',
                    error: 'TEACHER_NOT_FOUND'
                };
            }
            const query = {
                'schedule.periods.teacherId': new mongoose_1.default.Types.ObjectId(teacherId),
                isActive: true
            };
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const timetables = await Timetable_1.Timetable.find(query)
                .populate('schedule.periods.teacherId', 'name employeeId')
                .populate('createdBy', 'email');
            // Extract teacher's periods from all timetables
            const teacherSchedule = [];
            timetables.forEach(timetable => {
                timetable.schedule.forEach(daySchedule => {
                    daySchedule.periods.forEach(period => {
                        if (period.teacherId._id.toString() === teacherId) {
                            teacherSchedule.push({
                                classId: timetable.classId,
                                academicYear: timetable.academicYear,
                                day: daySchedule.day,
                                slot: period.slot,
                                subject: period.subject,
                                startTime: period.startTime,
                                endTime: period.endTime
                            });
                        }
                    });
                });
            });
            // Sort by day and time
            const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            teacherSchedule.sort((a, b) => {
                const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                if (dayDiff !== 0)
                    return dayDiff;
                const aTime = a.startTime.split(':').map(Number);
                const bTime = b.startTime.split(':').map(Number);
                return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
            });
            return {
                success: true,
                message: 'Teacher schedule retrieved successfully',
                data: {
                    teacher: {
                        id: teacher._id,
                        name: teacher.name,
                        employeeId: teacher.employeeId
                    },
                    schedule: teacherSchedule,
                    totalPeriods: teacherSchedule.length
                }
            };
        }
        catch (error) {
            console.error('Get teacher schedule service error:', error);
            return {
                success: false,
                message: 'Failed to retrieve teacher schedule',
                error: 'FETCH_ERROR'
            };
        }
    }
    /**
     * Update timetable
     */
    static async updateTimetable(timetableId, updateData, updatedBy) {
        try {
            const timetable = await Timetable_1.Timetable.findById(timetableId);
            if (!timetable) {
                return {
                    success: false,
                    message: 'Timetable not found',
                    error: 'NOT_FOUND'
                };
            }
            // If updating schedule, validate teacher availability
            if (updateData.schedule) {
                const teacherIds = updateData.schedule.flatMap(day => day.periods.map(period => period.teacherId));
                const uniqueTeacherIds = [...new Set(teacherIds)];
                const teachers = await Teacher_1.Teacher.find({
                    _id: { $in: uniqueTeacherIds.map(id => new mongoose_1.default.Types.ObjectId(id)) }
                });
                if (teachers.length !== uniqueTeacherIds.length) {
                    return {
                        success: false,
                        message: 'One or more teachers not found',
                        error: 'INVALID_TEACHERS'
                    };
                }
                // Check teacher availability for all periods
                for (const daySchedule of updateData.schedule) {
                    for (const period of daySchedule.periods) {
                        const isAvailable = await Timetable_1.Timetable.checkTeacherAvailability(period.teacherId, daySchedule.day, period.startTime, period.endTime, timetable.academicYear, timetable.classId // Exclude current timetable from conflict check
                        );
                        if (!isAvailable) {
                            return {
                                success: false,
                                message: `Teacher is not available for ${daySchedule.day} ${period.startTime}-${period.endTime}`,
                                error: 'TEACHER_CONFLICT'
                            };
                        }
                    }
                }
            }
            // Update the timetable
            Object.assign(timetable, updateData);
            const updatedTimetable = await timetable.save();
            const populatedTimetable = await Timetable_1.Timetable.findById(updatedTimetable._id)
                .populate('schedule.periods.teacherId', 'name employeeId')
                .populate('createdBy', 'email');
            return {
                success: true,
                message: 'Timetable updated successfully',
                data: populatedTimetable
            };
        }
        catch (error) {
            console.error('Update timetable service error:', error);
            return {
                success: false,
                message: error.message || 'Failed to update timetable',
                error: error.code || 'UPDATE_ERROR'
            };
        }
    }
    /**
     * Get all timetables with filtering
     */
    static async getTimetables(filters = {}) {
        try {
            const query = {};
            if (filters.classId) {
                query.classId = filters.classId.toUpperCase();
            }
            if (filters.academicYear) {
                query.academicYear = filters.academicYear;
            }
            if (filters.teacherId) {
                query['schedule.periods.teacherId'] = new mongoose_1.default.Types.ObjectId(filters.teacherId);
            }
            if (filters.isActive !== undefined) {
                query.isActive = filters.isActive;
            }
            const timetables = await Timetable_1.Timetable.find(query)
                .populate('schedule.periods.teacherId', 'name employeeId')
                .populate('createdBy', 'email')
                .sort({ classId: 1, academicYear: -1 });
            return {
                success: true,
                message: 'Timetables retrieved successfully',
                data: timetables
            };
        }
        catch (error) {
            console.error('Get timetables service error:', error);
            return {
                success: false,
                message: 'Failed to retrieve timetables',
                error: 'FETCH_ERROR'
            };
        }
    }
    /**
     * Delete/Deactivate timetable
     */
    static async deactivateTimetable(timetableId) {
        try {
            const timetable = await Timetable_1.Timetable.findById(timetableId);
            if (!timetable) {
                return {
                    success: false,
                    message: 'Timetable not found',
                    error: 'NOT_FOUND'
                };
            }
            timetable.isActive = false;
            await timetable.save();
            return {
                success: true,
                message: 'Timetable deactivated successfully',
                data: { id: timetableId, isActive: false }
            };
        }
        catch (error) {
            console.error('Deactivate timetable service error:', error);
            return {
                success: false,
                message: 'Failed to deactivate timetable',
                error: 'DELETE_ERROR'
            };
        }
    }
    /**
     * Get current academic year
     */
    static getCurrentAcademicYear() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        // Academic year starts in April (month 3, 0-indexed)
        if (currentMonth >= 3) {
            return `${currentYear}-${currentYear + 1}`;
        }
        else {
            return `${currentYear - 1}-${currentYear}`;
        }
    }
    /**
     * Check if class ID format is valid
     */
    static isValidClassId(classId) {
        const classIdRegex = /^[1-9][0-2]?-[A-F]$/;
        return classIdRegex.test(classId.toUpperCase());
    }
    /**
     * Get available time slots for a class
     */
    static async getAvailableSlots(classId, day, academicYear) {
        try {
            const timetable = await this.getTimetableByClass(classId, academicYear);
            if (!timetable.success) {
                // If no timetable exists, all slots are available
                const allSlots = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
                return {
                    success: true,
                    message: 'Available slots retrieved successfully',
                    data: { availableSlots: allSlots, occupiedSlots: [] }
                };
            }
            const daySchedule = timetable.data.schedule.find((s) => s.day === day);
            const occupiedSlots = daySchedule ? daySchedule.periods.map((p) => p.slot) : [];
            const allSlots = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
            const availableSlots = allSlots.filter(slot => !occupiedSlots.includes(slot));
            return {
                success: true,
                message: 'Available slots retrieved successfully',
                data: { availableSlots, occupiedSlots }
            };
        }
        catch (error) {
            console.error('Get available slots service error:', error);
            return {
                success: false,
                message: 'Failed to retrieve available slots',
                error: 'FETCH_ERROR'
            };
        }
    }
}
exports.TimetableService = TimetableService;
//# sourceMappingURL=timetableService.js.map