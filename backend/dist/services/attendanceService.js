"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const Attendance_1 = require("../models/Attendance");
const Teacher_1 = require("../models/Teacher");
const Student_1 = require("../models/Student");
const mongoose_1 = __importDefault(require("mongoose"));
class AttendanceService {
    /**
     * Validate if teacher is authorized to mark attendance for the given class and subject
     */
    static async validateTeacherAuthorization(teacherId, classId, subject, academicYear) {
        try {
            const teacher = await Teacher_1.Teacher.findById(teacherId);
            if (!teacher) {
                return {
                    isValid: false,
                    message: 'Teacher not found'
                };
            }
            if (!teacher.isActive) {
                return {
                    isValid: false,
                    message: 'Teacher is not active'
                };
            }
            // Parse classId to get standard and section
            const [standard, section] = classId.split('-');
            if (!standard || !section) {
                return {
                    isValid: false,
                    message: 'Invalid class ID format. Expected format: "Standard-Section" (e.g., "8-A")'
                };
            }
            // Check if teacher is assigned to this class and subject
            const currentYear = academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
            const hasAssignment = teacher.assignedClasses.some(assignment => assignment.standard === standard &&
                assignment.section.toUpperCase() === section.toUpperCase() &&
                assignment.subject.toLowerCase() === subject.toLowerCase() &&
                (assignment.academicYear === currentYear || !assignment.academicYear));
            if (!hasAssignment) {
                return {
                    isValid: false,
                    message: `Teacher is not assigned to teach ${subject} for class ${classId} in academic year ${currentYear}`
                };
            }
            return {
                isValid: true
            };
        }
        catch (error) {
            console.error('Error validating teacher authorization:', error);
            return {
                isValid: false,
                message: 'Error validating teacher authorization'
            };
        }
    }
    /**
     * Validate if student exists and belongs to the specified class
     */
    static async validateStudentClass(studentId, classId) {
        try {
            const student = await Student_1.Student.findById(studentId);
            if (!student) {
                return {
                    isValid: false,
                    message: 'Student not found'
                };
            }
            if (student.status !== 'active') {
                return {
                    isValid: false,
                    message: 'Student is not active'
                };
            }
            // Parse classId to get standard and section
            const [standard, section] = classId.split('-');
            if (!standard || !section) {
                return {
                    isValid: false,
                    message: 'Invalid class ID format'
                };
            }
            // Check if student belongs to this class
            if (student.standard !== standard || student.section.toUpperCase() !== section.toUpperCase()) {
                return {
                    isValid: false,
                    message: `Student belongs to class ${student.standard}-${student.section}, not ${classId}`
                };
            }
            return {
                isValid: true
            };
        }
        catch (error) {
            console.error('Error validating student class:', error);
            return {
                isValid: false,
                message: 'Error validating student class'
            };
        }
    }
    /**
     * Mark attendance for a student
     */
    static async markAttendance(attendanceData) {
        try {
            // Validate teacher authorization
            const teacherValidation = await this.validateTeacherAuthorization(attendanceData.teacherId, attendanceData.classId, attendanceData.subject, attendanceData.academicYear);
            if (!teacherValidation.isValid) {
                throw new Error(teacherValidation.message);
            }
            // Validate student class
            const studentValidation = await this.validateStudentClass(attendanceData.studentId, attendanceData.classId);
            if (!studentValidation.isValid) {
                throw new Error(studentValidation.message);
            }
            // Check if attendance already exists for this student, class, subject, and date
            const existingAttendance = await Attendance_1.Attendance.attendanceExists(attendanceData.studentId, attendanceData.classId, attendanceData.subject, attendanceData.date, attendanceData.academicYear);
            if (existingAttendance) {
                throw new Error('Attendance already marked for this student, class, subject, and date');
            }
            // Create new attendance record
            const attendance = new Attendance_1.Attendance({
                studentId: new mongoose_1.default.Types.ObjectId(attendanceData.studentId),
                teacherId: new mongoose_1.default.Types.ObjectId(attendanceData.teacherId),
                classId: attendanceData.classId,
                subject: attendanceData.subject,
                date: attendanceData.date,
                status: attendanceData.status,
                academicYear: attendanceData.academicYear,
                remarks: attendanceData.remarks,
                markedAt: new Date()
            });
            const savedAttendance = await attendance.save();
            // Populate teacher and student information
            await savedAttendance.populate([
                { path: 'teacherId', select: 'name employeeId' },
                { path: 'studentId', select: 'name rollNo' }
            ]);
            return savedAttendance;
        }
        catch (error) {
            console.error('Error marking attendance:', error);
            throw error;
        }
    }
    /**
     * Update existing attendance record
     */
    static async updateAttendance(attendanceId, teacherId, updates) {
        try {
            const attendance = await Attendance_1.Attendance.findById(attendanceId);
            if (!attendance) {
                throw new Error('Attendance record not found');
            }
            // Verify that the teacher updating the attendance is the same one who marked it
            if (attendance.teacherId.toString() !== teacherId) {
                throw new Error('Only the teacher who marked the attendance can update it');
            }
            // Check if the attendance was marked recently (within 24 hours)
            const hoursSinceMarked = (Date.now() - attendance.markedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceMarked > 24) {
                throw new Error('Attendance can only be updated within 24 hours of marking');
            }
            // Update the attendance
            Object.assign(attendance, updates);
            const updatedAttendance = await attendance.save();
            // Populate teacher and student information
            await updatedAttendance.populate([
                { path: 'teacherId', select: 'name employeeId' },
                { path: 'studentId', select: 'name rollNo' }
            ]);
            return updatedAttendance;
        }
        catch (error) {
            console.error('Error updating attendance:', error);
            throw error;
        }
    }
    /**
     * Get attendance records for a specific student
     */
    static async getStudentAttendance(studentId, options = {}) {
        try {
            const { subject, startDate, endDate, academicYear, page = 1, limit = 10 } = options;
            const query = { studentId: new mongoose_1.default.Types.ObjectId(studentId) };
            if (subject) {
                query.subject = { $regex: new RegExp(subject, 'i') };
            }
            if (startDate || endDate) {
                query.date = {};
                if (startDate)
                    query.date.$gte = startDate;
                if (endDate)
                    query.date.$lte = endDate;
            }
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const skip = (page - 1) * limit;
            const [records, total] = await Promise.all([
                Attendance_1.Attendance.find(query)
                    .populate('teacherId', 'name employeeId')
                    .populate('studentId', 'name rollNo')
                    .sort({ date: -1 })
                    .skip(skip)
                    .limit(limit),
                Attendance_1.Attendance.countDocuments(query)
            ]);
            return {
                records,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            console.error('Error getting student attendance:', error);
            throw error;
        }
    }
    /**
     * Get attendance records for a specific class and subject
     */
    static async getClassAttendance(classId, subject, options = {}) {
        try {
            const { date, startDate, endDate, academicYear, page = 1, limit = 50 } = options;
            const query = {
                classId: classId.toUpperCase(),
                subject: { $regex: new RegExp(subject, 'i') }
            };
            if (date) {
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                query.date = { $gte: startOfDay, $lte: endOfDay };
            }
            else if (startDate || endDate) {
                query.date = {};
                if (startDate)
                    query.date.$gte = startDate;
                if (endDate)
                    query.date.$lte = endDate;
            }
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const skip = (page - 1) * limit;
            const [records, total] = await Promise.all([
                Attendance_1.Attendance.find(query)
                    .populate('studentId', 'name rollNo')
                    .populate('teacherId', 'name employeeId')
                    .sort({ date: -1, 'studentId.rollNo': 1 })
                    .skip(skip)
                    .limit(limit),
                Attendance_1.Attendance.countDocuments(query)
            ]);
            return {
                records,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            console.error('Error getting class attendance:', error);
            throw error;
        }
    }
    /**
     * Calculate attendance percentage for a student
     */
    static async calculateAttendancePercentage(studentId, options = {}) {
        try {
            const { subject, academicYear, startDate, endDate } = options;
            const query = { studentId: new mongoose_1.default.Types.ObjectId(studentId) };
            if (subject) {
                query.subject = { $regex: new RegExp(subject, 'i') };
            }
            if (academicYear) {
                query.academicYear = academicYear;
            }
            if (startDate || endDate) {
                query.date = {};
                if (startDate)
                    query.date.$gte = startDate;
                if (endDate)
                    query.date.$lte = endDate;
            }
            const [totalRecords, presentRecords] = await Promise.all([
                Attendance_1.Attendance.countDocuments(query),
                Attendance_1.Attendance.countDocuments({
                    ...query,
                    status: { $in: ['present', 'late'] }
                })
            ]);
            const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
            return {
                totalDays: totalRecords,
                presentDays: presentRecords,
                absentDays: totalRecords - presentRecords,
                percentage
            };
        }
        catch (error) {
            console.error('Error calculating attendance percentage:', error);
            throw error;
        }
    }
    /**
     * Get attendance summary for a class and subject
     */
    static async getClassAttendanceSummary(classId, subject, startDate, endDate, academicYear) {
        try {
            const query = {
                classId: classId.toUpperCase(),
                subject: { $regex: new RegExp(subject, 'i') },
                date: { $gte: startDate, $lte: endDate }
            };
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const summary = await Attendance_1.Attendance.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);
            const result = {
                present: 0,
                absent: 0,
                late: 0,
                total: 0
            };
            summary.forEach((item) => {
                result[item._id] = item.count;
                result.total += item.count;
            });
            // Calculate percentages
            const percentages = {
                present: result.total > 0 ? Math.round((result.present / result.total) * 100) : 0,
                absent: result.total > 0 ? Math.round((result.absent / result.total) * 100) : 0,
                late: result.total > 0 ? Math.round((result.late / result.total) * 100) : 0
            };
            return {
                counts: result,
                percentages,
                dateRange: {
                    startDate,
                    endDate
                }
            };
        }
        catch (error) {
            console.error('Error getting class attendance summary:', error);
            throw error;
        }
    }
    /**
     * Get attendance records marked by a specific teacher
     */
    static async getTeacherAttendanceRecords(teacherId, options = {}) {
        try {
            const { classId, subject, startDate, endDate, academicYear, page = 1, limit = 20 } = options;
            const query = { teacherId: new mongoose_1.default.Types.ObjectId(teacherId) };
            if (classId) {
                query.classId = classId.toUpperCase();
            }
            if (subject) {
                query.subject = { $regex: new RegExp(subject, 'i') };
            }
            if (startDate || endDate) {
                query.date = {};
                if (startDate)
                    query.date.$gte = startDate;
                if (endDate)
                    query.date.$lte = endDate;
            }
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const skip = (page - 1) * limit;
            const [records, total] = await Promise.all([
                Attendance_1.Attendance.find(query)
                    .populate('studentId', 'name rollNo standard section')
                    .sort({ date: -1, classId: 1, subject: 1 })
                    .skip(skip)
                    .limit(limit),
                Attendance_1.Attendance.countDocuments(query)
            ]);
            return {
                records,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            console.error('Error getting teacher attendance records:', error);
            throw error;
        }
    }
    /**
     * Get monthly attendance summary for a student
     */
    static async getStudentMonthlySummary(studentId, startDate, endDate, academicYear) {
        try {
            const query = {
                studentId: new mongoose_1.default.Types.ObjectId(studentId),
                date: { $gte: startDate, $lte: endDate }
            };
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const monthlyData = await Attendance_1.Attendance.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                            subject: '$subject'
                        },
                        totalDays: { $sum: 1 },
                        presentDays: {
                            $sum: {
                                $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
                            }
                        },
                        absentDays: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                            }
                        },
                        lateDays: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        percentage: {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ['$presentDays', '$totalDays'] },
                                        100
                                    ]
                                },
                                2
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        '_id.year': 1,
                        '_id.month': 1,
                        '_id.subject': 1
                    }
                }
            ]);
            // Group by month for easier consumption
            const monthlyGrouped = monthlyData.reduce((acc, item) => {
                const monthKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
                if (!acc[monthKey]) {
                    acc[monthKey] = {
                        year: item._id.year,
                        month: item._id.month,
                        subjects: {},
                        overall: {
                            totalDays: 0,
                            presentDays: 0,
                            absentDays: 0,
                            lateDays: 0,
                            percentage: 0
                        }
                    };
                }
                acc[monthKey].subjects[item._id.subject] = {
                    totalDays: item.totalDays,
                    presentDays: item.presentDays,
                    absentDays: item.absentDays,
                    lateDays: item.lateDays,
                    percentage: item.percentage
                };
                // Update overall stats
                acc[monthKey].overall.totalDays += item.totalDays;
                acc[monthKey].overall.presentDays += item.presentDays;
                acc[monthKey].overall.absentDays += item.absentDays;
                acc[monthKey].overall.lateDays += item.lateDays;
                return acc;
            }, {});
            // Calculate overall percentages
            Object.keys(monthlyGrouped).forEach(monthKey => {
                const month = monthlyGrouped[monthKey];
                if (month.overall.totalDays > 0) {
                    month.overall.percentage = Math.round((month.overall.presentDays / month.overall.totalDays) * 100);
                }
            });
            return {
                dateRange: { startDate, endDate },
                monthlyData: monthlyGrouped
            };
        }
        catch (error) {
            console.error('Error getting student monthly summary:', error);
            throw error;
        }
    }
    /**
     * Get yearly attendance summary for a student
     */
    static async getStudentYearlySummary(studentId, startDate, endDate, academicYear) {
        try {
            const query = {
                studentId: new mongoose_1.default.Types.ObjectId(studentId),
                date: { $gte: startDate, $lte: endDate }
            };
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const yearlyData = await Attendance_1.Attendance.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            subject: '$subject'
                        },
                        totalDays: { $sum: 1 },
                        presentDays: {
                            $sum: {
                                $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
                            }
                        },
                        absentDays: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                            }
                        },
                        lateDays: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        percentage: {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ['$presentDays', '$totalDays'] },
                                        100
                                    ]
                                },
                                2
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        '_id.year': 1,
                        '_id.subject': 1
                    }
                }
            ]);
            // Group by year for easier consumption
            const yearlyGrouped = yearlyData.reduce((acc, item) => {
                const yearKey = item._id.year.toString();
                if (!acc[yearKey]) {
                    acc[yearKey] = {
                        year: item._id.year,
                        subjects: {},
                        overall: {
                            totalDays: 0,
                            presentDays: 0,
                            absentDays: 0,
                            lateDays: 0,
                            percentage: 0
                        }
                    };
                }
                acc[yearKey].subjects[item._id.subject] = {
                    totalDays: item.totalDays,
                    presentDays: item.presentDays,
                    absentDays: item.absentDays,
                    lateDays: item.lateDays,
                    percentage: item.percentage
                };
                // Update overall stats
                acc[yearKey].overall.totalDays += item.totalDays;
                acc[yearKey].overall.presentDays += item.presentDays;
                acc[yearKey].overall.absentDays += item.absentDays;
                acc[yearKey].overall.lateDays += item.lateDays;
                return acc;
            }, {});
            // Calculate overall percentages
            Object.keys(yearlyGrouped).forEach(yearKey => {
                const year = yearlyGrouped[yearKey];
                if (year.overall.totalDays > 0) {
                    year.overall.percentage = Math.round((year.overall.presentDays / year.overall.totalDays) * 100);
                }
            });
            return {
                dateRange: { startDate, endDate },
                yearlyData: yearlyGrouped
            };
        }
        catch (error) {
            console.error('Error getting student yearly summary:', error);
            throw error;
        }
    }
    /**
     * Get monthly attendance summary for a class and subject
     */
    static async getClassMonthlySummary(classId, subject, startDate, endDate, academicYear) {
        try {
            const query = {
                classId: classId.toUpperCase(),
                subject: { $regex: new RegExp(subject, 'i') },
                date: { $gte: startDate, $lte: endDate }
            };
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const monthlyData = await Attendance_1.Attendance.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                            studentId: '$studentId'
                        },
                        totalDays: { $sum: 1 },
                        presentDays: {
                            $sum: {
                                $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
                            }
                        },
                        absentDays: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                            }
                        },
                        lateDays: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: '$_id.year',
                            month: '$_id.month'
                        },
                        totalStudents: { $sum: 1 },
                        totalDays: { $sum: '$totalDays' },
                        totalPresentDays: { $sum: '$presentDays' },
                        totalAbsentDays: { $sum: '$absentDays' },
                        totalLateDays: { $sum: '$lateDays' },
                        studentStats: {
                            $push: {
                                studentId: '$_id.studentId',
                                totalDays: '$totalDays',
                                presentDays: '$presentDays',
                                absentDays: '$absentDays',
                                lateDays: '$lateDays',
                                percentage: {
                                    $round: [
                                        {
                                            $multiply: [
                                                { $divide: ['$presentDays', '$totalDays'] },
                                                100
                                            ]
                                        },
                                        2
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        overallPercentage: {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ['$totalPresentDays', '$totalDays'] },
                                        100
                                    ]
                                },
                                2
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        '_id.year': 1,
                        '_id.month': 1
                    }
                }
            ]);
            // Populate student information
            for (const monthData of monthlyData) {
                for (const studentStat of monthData.studentStats) {
                    const student = await Student_1.Student.findById(studentStat.studentId).select('name rollNo');
                    studentStat.student = student;
                }
            }
            return {
                classId,
                subject,
                dateRange: { startDate, endDate },
                monthlyData
            };
        }
        catch (error) {
            console.error('Error getting class monthly summary:', error);
            throw error;
        }
    }
    /**
     * Get yearly attendance summary for a class and subject
     */
    static async getClassYearlySummary(classId, subject, startDate, endDate, academicYear) {
        try {
            const query = {
                classId: classId.toUpperCase(),
                subject: { $regex: new RegExp(subject, 'i') },
                date: { $gte: startDate, $lte: endDate }
            };
            if (academicYear) {
                query.academicYear = academicYear;
            }
            const yearlyData = await Attendance_1.Attendance.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            studentId: '$studentId'
                        },
                        totalDays: { $sum: 1 },
                        presentDays: {
                            $sum: {
                                $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
                            }
                        },
                        absentDays: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                            }
                        },
                        lateDays: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: '$_id.year'
                        },
                        totalStudents: { $sum: 1 },
                        totalDays: { $sum: '$totalDays' },
                        totalPresentDays: { $sum: '$presentDays' },
                        totalAbsentDays: { $sum: '$absentDays' },
                        totalLateDays: { $sum: '$lateDays' },
                        studentStats: {
                            $push: {
                                studentId: '$_id.studentId',
                                totalDays: '$totalDays',
                                presentDays: '$presentDays',
                                absentDays: '$absentDays',
                                lateDays: '$lateDays',
                                percentage: {
                                    $round: [
                                        {
                                            $multiply: [
                                                { $divide: ['$presentDays', '$totalDays'] },
                                                100
                                            ]
                                        },
                                        2
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        overallPercentage: {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ['$totalPresentDays', '$totalDays'] },
                                        100
                                    ]
                                },
                                2
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        '_id.year': 1
                    }
                }
            ]);
            // Populate student information
            for (const yearData of yearlyData) {
                for (const studentStat of yearData.studentStats) {
                    const student = await Student_1.Student.findById(studentStat.studentId).select('name rollNo');
                    studentStat.student = student;
                }
            }
            return {
                classId,
                subject,
                dateRange: { startDate, endDate },
                yearlyData
            };
        }
        catch (error) {
            console.error('Error getting class yearly summary:', error);
            throw error;
        }
    }
}
exports.AttendanceService = AttendanceService;
//# sourceMappingURL=attendanceService.js.map