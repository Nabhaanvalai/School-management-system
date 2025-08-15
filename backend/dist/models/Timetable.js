"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timetable = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Timetable Schema
const TimetableSchema = new mongoose_1.Schema({
    classId: {
        type: String,
        required: [true, 'Class ID is required'],
        trim: true,
        uppercase: true,
        match: [/^[1-9][0-2]?-[A-F]$/, 'Class ID must be in format "Standard-Section" (e.g., "8-A")'],
        validate: {
            validator: function (value) {
                const [standard, section] = value.split('-');
                const validStandards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
                const validSections = ['A', 'B', 'C', 'D', 'E', 'F'];
                return validStandards.includes(standard) && validSections.includes(section);
            },
            message: 'Invalid class ID format'
        }
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required'],
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format "YYYY-YYYY" (e.g., "2023-2024")'],
        validate: {
            validator: function (value) {
                const [startYear, endYear] = value.split('-').map(Number);
                return endYear === startYear + 1 && startYear >= 2000 && startYear <= new Date().getFullYear() + 1;
            },
            message: 'Invalid academic year format or range'
        },
        default: function () {
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
    },
    schedule: [{
            day: {
                type: String,
                required: [true, 'Day is required'],
                enum: {
                    values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    message: 'Day must be one of: monday, tuesday, wednesday, thursday, friday'
                }
            },
            periods: [{
                    slot: {
                        type: String,
                        required: [true, 'Time slot is required'],
                        trim: true,
                        uppercase: true,
                        match: [/^[A-Z][1-9]$/, 'Slot must be in format "A1", "B2", etc.']
                    },
                    subject: {
                        type: String,
                        required: [true, 'Subject is required'],
                        trim: true,
                        minlength: [2, 'Subject name must be at least 2 characters long'],
                        maxlength: [50, 'Subject name must be less than 50 characters']
                    },
                    teacherId: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: 'Teacher',
                        required: [true, 'Teacher ID is required']
                    },
                    startTime: {
                        type: String,
                        required: [true, 'Start time is required'],
                        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
                    },
                    endTime: {
                        type: String,
                        required: [true, 'End time is required'],
                        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
                        validate: {
                            validator: function (value) {
                                const startTime = this.startTime;
                                if (!startTime)
                                    return true;
                                const [startHour, startMin] = startTime.split(':').map(Number);
                                const [endHour, endMin] = value.split(':').map(Number);
                                const startMinutes = startHour * 60 + startMin;
                                const endMinutes = endHour * 60 + endMin;
                                return endMinutes > startMinutes;
                            },
                            message: 'End time must be after start time'
                        }
                    }
                }]
        }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator ID is required']
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});
// Compound index for unique timetable per class and academic year
TimetableSchema.index({ classId: 1, academicYear: 1 }, {
    unique: true,
    name: 'unique_class_timetable_per_year'
});
// Additional indexes for efficient querying
TimetableSchema.index({ academicYear: 1, isActive: 1 }); // Active timetables by year
TimetableSchema.index({ 'schedule.periods.teacherId': 1 }); // Teacher-based queries
TimetableSchema.index({ createdBy: 1, createdAt: -1 }); // Creator-based queries
// Pre-save middleware for validation
TimetableSchema.pre('save', function (next) {
    // Validate that all days are unique in schedule
    const days = this.schedule.map(s => s.day);
    const uniqueDays = [...new Set(days)];
    if (days.length !== uniqueDays.length) {
        return next(new Error('Duplicate days found in schedule'));
    }
    // Validate that slots are unique within each day
    for (const daySchedule of this.schedule) {
        const slots = daySchedule.periods.map(p => p.slot);
        const uniqueSlots = [...new Set(slots)];
        if (slots.length !== uniqueSlots.length) {
            return next(new Error(`Duplicate slots found for ${daySchedule.day}`));
        }
        // Validate time conflicts within the day
        const sortedPeriods = daySchedule.periods.sort((a, b) => {
            const aStart = a.startTime.split(':').map(Number);
            const bStart = b.startTime.split(':').map(Number);
            return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
        });
        for (let i = 0; i < sortedPeriods.length - 1; i++) {
            const current = sortedPeriods[i];
            const nextPeriod = sortedPeriods[i + 1];
            const currentEnd = current.endTime.split(':').map(Number);
            const nextStart = nextPeriod.startTime.split(':').map(Number);
            const currentEndMinutes = currentEnd[0] * 60 + currentEnd[1];
            const nextStartMinutes = nextStart[0] * 60 + nextStart[1];
            if (currentEndMinutes > nextStartMinutes) {
                return next(new Error(`Time conflict between ${current.slot} and ${nextPeriod.slot} on ${daySchedule.day}`));
            }
        }
    }
    next();
});
// Instance method to get period by slot
TimetableSchema.methods.getPeriodBySlot = function (day, slot) {
    const daySchedule = this.schedule.find((s) => s.day === day);
    if (!daySchedule)
        return null;
    return daySchedule.periods.find((p) => p.slot === slot) || null;
};
// Instance method to get teacher's schedule
TimetableSchema.methods.getTeacherSchedule = function (teacherId) {
    const teacherPeriods = [];
    this.schedule.forEach((daySchedule) => {
        daySchedule.periods.forEach((period) => {
            if (period.teacherId.toString() === teacherId) {
                teacherPeriods.push({
                    ...period,
                    day: daySchedule.day
                });
            }
        });
    });
    return teacherPeriods;
};
// Instance method to add period
TimetableSchema.methods.addPeriod = function (day, period) {
    let daySchedule = this.schedule.find((s) => s.day === day);
    if (!daySchedule) {
        daySchedule = { day, periods: [] };
        this.schedule.push(daySchedule);
    }
    // Check if slot already exists
    const existingPeriod = daySchedule.periods.find((p) => p.slot === period.slot);
    if (existingPeriod) {
        throw new Error(`Slot ${period.slot} already exists for ${day}`);
    }
    daySchedule.periods.push(period);
};
// Instance method to remove period
TimetableSchema.methods.removePeriod = function (day, slot) {
    const daySchedule = this.schedule.find((s) => s.day === day);
    if (!daySchedule)
        return;
    daySchedule.periods = daySchedule.periods.filter((p) => p.slot !== slot);
};
// Instance method to get class identifier
TimetableSchema.methods.getClassIdentifier = function () {
    return this.classId;
};
// Static method to find timetable by class
TimetableSchema.statics.findByClass = function (classId, academicYear) {
    const query = { classId, isActive: true };
    if (academicYear) {
        query.academicYear = academicYear;
    }
    return this.findOne(query).populate('schedule.periods.teacherId', 'name employeeId');
};
// Static method to find teacher's timetables
TimetableSchema.statics.findByTeacher = function (teacherId, academicYear) {
    const query = {
        'schedule.periods.teacherId': teacherId,
        isActive: true
    };
    if (academicYear) {
        query.academicYear = academicYear;
    }
    return this.find(query).populate('schedule.periods.teacherId', 'name employeeId');
};
// Static method to check teacher availability
TimetableSchema.statics.checkTeacherAvailability = async function (teacherId, day, startTime, endTime, academicYear, excludeClassId) {
    const query = {
        'schedule.periods.teacherId': teacherId,
        academicYear,
        isActive: true
    };
    if (excludeClassId) {
        query.classId = { $ne: excludeClassId };
    }
    const timetables = await this.find(query);
    for (const timetable of timetables) {
        const daySchedule = timetable.schedule.find((s) => s.day === day);
        if (!daySchedule)
            continue;
        for (const period of daySchedule.periods) {
            if (period.teacherId.toString() !== teacherId)
                continue;
            // Check time overlap
            const periodStart = period.startTime.split(':').map(Number);
            const periodEnd = period.endTime.split(':').map(Number);
            const checkStart = startTime.split(':').map(Number);
            const checkEnd = endTime.split(':').map(Number);
            const periodStartMinutes = periodStart[0] * 60 + periodStart[1];
            const periodEndMinutes = periodEnd[0] * 60 + periodEnd[1];
            const checkStartMinutes = checkStart[0] * 60 + checkStart[1];
            const checkEndMinutes = checkEnd[0] * 60 + checkEnd[1];
            // Check for overlap
            if (!(checkEndMinutes <= periodStartMinutes || checkStartMinutes >= periodEndMinutes)) {
                return false; // Teacher is not available
            }
        }
    }
    return true; // Teacher is available
};
exports.Timetable = mongoose_1.default.model('Timetable', TimetableSchema);
//# sourceMappingURL=Timetable.js.map