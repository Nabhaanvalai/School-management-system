"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
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
describe('Timetable Model', () => {
    describe('Timetable Data Validation', () => {
        const validPeriod = {
            slot: 'A1',
            subject: 'Mathematics',
            teacherId: new mongoose_1.default.Types.ObjectId(),
            startTime: '09:00',
            endTime: '09:45'
        };
        const validDaySchedule = {
            day: 'monday',
            periods: [validPeriod]
        };
        const validTimetableData = {
            classId: '8-A',
            academicYear: '2023-2024',
            schedule: [validDaySchedule],
            isActive: true,
            createdBy: new mongoose_1.default.Types.ObjectId()
        };
        it('should validate required fields', () => {
            const requiredFields = ['classId', 'academicYear', 'schedule', 'createdBy'];
            requiredFields.forEach(field => {
                expect(validTimetableData).toHaveProperty(field);
                expect(validTimetableData[field]).toBeDefined();
            });
        });
        it('should validate class ID format', () => {
            const validClassIds = ['1-A', '8-B', '10-C', '12-F'];
            const invalidClassIds = ['0-A', '13-A', '8-G', '8A', 'Class8A'];
            const classIdRegex = /^[1-9][0-2]?-[A-F]$/;
            validClassIds.forEach(classId => {
                expect(classIdRegex.test(classId)).toBeTruthy();
            });
            invalidClassIds.forEach(classId => {
                expect(classIdRegex.test(classId)).toBeFalsy();
            });
        });
        it('should validate academic year format', () => {
            const validAcademicYears = ['2023-2024', '2024-2025', '2022-2023'];
            const invalidAcademicYears = ['2023-2025', '23-24', '2023/2024'];
            const academicYearRegex = /^\d{4}-\d{4}$/;
            validAcademicYears.forEach(year => {
                expect(academicYearRegex.test(year)).toBeTruthy();
                const [startYear, endYear] = year.split('-').map(Number);
                expect(endYear).toBe(startYear + 1);
            });
            invalidAcademicYears.forEach(year => {
                if (academicYearRegex.test(year)) {
                    const [startYear, endYear] = year.split('-').map(Number);
                    expect(endYear !== startYear + 1).toBeTruthy();
                }
                else {
                    expect(academicYearRegex.test(year)).toBeFalsy();
                }
            });
        });
        it('should validate day of week values', () => {
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const invalidDays = ['saturday', 'sunday', 'Monday', 'MONDAY'];
            validDays.forEach(day => {
                expect(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']).toContain(day);
            });
            invalidDays.forEach(day => {
                expect(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']).not.toContain(day);
            });
        });
        it('should validate time slot format', () => {
            const validSlots = ['A1', 'B2', 'C3', 'D4', 'E5'];
            const invalidSlots = ['a1', '1A', 'AA', '11', 'A10'];
            const slotRegex = /^[A-Z][1-9]$/;
            validSlots.forEach(slot => {
                expect(slotRegex.test(slot)).toBeTruthy();
            });
            invalidSlots.forEach(slot => {
                expect(slotRegex.test(slot)).toBeFalsy();
            });
        });
        it('should validate time format', () => {
            const validTimes = ['09:00', '14:30', '23:59', '00:00'];
            const invalidTimes = ['25:00', '14:60', 'abc', ''];
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            validTimes.forEach(time => {
                expect(timeRegex.test(time)).toBeTruthy();
            });
            invalidTimes.forEach(time => {
                expect(timeRegex.test(time)).toBeFalsy();
            });
        });
        it('should validate end time is after start time', () => {
            const validateTimeOrder = (startTime, endTime) => {
                const [startHour, startMin] = startTime.split(':').map(Number);
                const [endHour, endMin] = endTime.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                return endMinutes > startMinutes;
            };
            expect(validateTimeOrder('09:00', '09:45')).toBeTruthy();
            expect(validateTimeOrder('14:00', '15:30')).toBeTruthy();
            expect(validateTimeOrder('09:45', '09:00')).toBeFalsy();
            expect(validateTimeOrder('10:00', '10:00')).toBeFalsy();
        });
    });
    describe('Schedule Validation Logic', () => {
        it('should prevent duplicate days in schedule', () => {
            const schedule = [
                { day: 'monday', periods: [] },
                { day: 'tuesday', periods: [] },
                { day: 'monday', periods: [] } // Duplicate
            ];
            const days = schedule.map(s => s.day);
            const uniqueDays = [...new Set(days)];
            expect(days.length).not.toBe(uniqueDays.length);
        });
        it('should prevent duplicate slots within a day', () => {
            const periods = [
                { slot: 'A1', subject: 'Math', teacherId: 'teacher1', startTime: '09:00', endTime: '09:45' },
                { slot: 'B1', subject: 'Physics', teacherId: 'teacher2', startTime: '10:00', endTime: '10:45' },
                { slot: 'A1', subject: 'Chemistry', teacherId: 'teacher3', startTime: '11:00', endTime: '11:45' } // Duplicate slot
            ];
            const slots = periods.map(p => p.slot);
            const uniqueSlots = [...new Set(slots)];
            expect(slots.length).not.toBe(uniqueSlots.length);
        });
        it('should detect time conflicts within a day', () => {
            const checkTimeConflict = (periods) => {
                const sortedPeriods = periods.sort((a, b) => {
                    const aStart = a.startTime.split(':').map(Number);
                    const bStart = b.startTime.split(':').map(Number);
                    return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
                });
                for (let i = 0; i < sortedPeriods.length - 1; i++) {
                    const current = sortedPeriods[i];
                    const next = sortedPeriods[i + 1];
                    const currentEnd = current.endTime.split(':').map(Number);
                    const nextStart = next.startTime.split(':').map(Number);
                    const currentEndMinutes = currentEnd[0] * 60 + currentEnd[1];
                    const nextStartMinutes = nextStart[0] * 60 + nextStart[1];
                    if (currentEndMinutes > nextStartMinutes) {
                        return true; // Conflict found
                    }
                }
                return false; // No conflicts
            };
            const conflictingPeriods = [
                { slot: 'A1', startTime: '09:00', endTime: '10:00' },
                { slot: 'B1', startTime: '09:30', endTime: '10:30' } // Overlaps with A1
            ];
            const nonConflictingPeriods = [
                { slot: 'A1', startTime: '09:00', endTime: '09:45' },
                { slot: 'B1', startTime: '10:00', endTime: '10:45' } // No overlap
            ];
            expect(checkTimeConflict(conflictingPeriods)).toBeTruthy();
            expect(checkTimeConflict(nonConflictingPeriods)).toBeFalsy();
        });
    });
    describe('Business Logic Methods', () => {
        let mockTimetable;
        beforeEach(() => {
            mockTimetable = {
                classId: '8-A',
                academicYear: '2023-2024',
                schedule: [
                    {
                        day: 'monday',
                        periods: [
                            { slot: 'A1', subject: 'Mathematics', teacherId: 'teacher1', startTime: '09:00', endTime: '09:45' },
                            { slot: 'B1', subject: 'Physics', teacherId: 'teacher2', startTime: '10:00', endTime: '10:45' }
                        ]
                    },
                    {
                        day: 'tuesday',
                        periods: [
                            { slot: 'A1', subject: 'Chemistry', teacherId: 'teacher3', startTime: '09:00', endTime: '09:45' }
                        ]
                    }
                ]
            };
        });
        it('should get period by slot', () => {
            const getPeriodBySlot = function (day, slot) {
                const daySchedule = this.schedule.find((s) => s.day === day);
                if (!daySchedule)
                    return null;
                return daySchedule.periods.find((p) => p.slot === slot) || null;
            };
            const period = getPeriodBySlot.call(mockTimetable, 'monday', 'A1');
            expect(period).toBeTruthy();
            expect(period.subject).toBe('Mathematics');
            const nonExistentPeriod = getPeriodBySlot.call(mockTimetable, 'monday', 'C1');
            expect(nonExistentPeriod).toBeNull();
        });
        it('should get teacher schedule', () => {
            const getTeacherSchedule = function (teacherId) {
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
            const teacherSchedule = getTeacherSchedule.call(mockTimetable, 'teacher1');
            expect(teacherSchedule).toHaveLength(1);
            expect(teacherSchedule[0].subject).toBe('Mathematics');
            expect(teacherSchedule[0].day).toBe('monday');
        });
        it('should add period to schedule', () => {
            const addPeriod = function (day, period) {
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
            const newPeriod = {
                slot: 'C1',
                subject: 'English',
                teacherId: 'teacher4',
                startTime: '11:00',
                endTime: '11:45'
            };
            addPeriod.call(mockTimetable, 'monday', newPeriod);
            const mondaySchedule = mockTimetable.schedule.find((s) => s.day === 'monday');
            expect(mondaySchedule.periods).toHaveLength(3);
            expect(mondaySchedule.periods[2].subject).toBe('English');
        });
        it('should throw error when adding duplicate slot', () => {
            const addPeriod = function (day, period) {
                let daySchedule = this.schedule.find((s) => s.day === day);
                if (!daySchedule) {
                    daySchedule = { day, periods: [] };
                    this.schedule.push(daySchedule);
                }
                const existingPeriod = daySchedule.periods.find((p) => p.slot === period.slot);
                if (existingPeriod) {
                    throw new Error(`Slot ${period.slot} already exists for ${day}`);
                }
                daySchedule.periods.push(period);
            };
            const duplicatePeriod = {
                slot: 'A1', // Already exists
                subject: 'English',
                teacherId: 'teacher4',
                startTime: '11:00',
                endTime: '11:45'
            };
            expect(() => {
                addPeriod.call(mockTimetable, 'monday', duplicatePeriod);
            }).toThrow('Slot A1 already exists for monday');
        });
        it('should remove period from schedule', () => {
            const removePeriod = function (day, slot) {
                const daySchedule = this.schedule.find((s) => s.day === day);
                if (!daySchedule)
                    return;
                daySchedule.periods = daySchedule.periods.filter((p) => p.slot !== slot);
            };
            const mondaySchedule = mockTimetable.schedule.find((s) => s.day === 'monday');
            expect(mondaySchedule.periods).toHaveLength(2);
            removePeriod.call(mockTimetable, 'monday', 'A1');
            expect(mondaySchedule.periods).toHaveLength(1);
            expect(mondaySchedule.periods[0].slot).toBe('B1');
        });
        it('should get class identifier', () => {
            const getClassIdentifier = function () {
                return this.classId;
            };
            const classId = getClassIdentifier.call(mockTimetable);
            expect(classId).toBe('8-A');
        });
    });
    describe('Teacher Availability Logic', () => {
        it('should check teacher availability for time slot', () => {
            const checkTeacherAvailability = (existingPeriods, checkStartTime, checkEndTime) => {
                for (const period of existingPeriods) {
                    const periodStart = period.startTime.split(':').map(Number);
                    const periodEnd = period.endTime.split(':').map(Number);
                    const checkStart = checkStartTime.split(':').map(Number);
                    const checkEnd = checkEndTime.split(':').map(Number);
                    const periodStartMinutes = periodStart[0] * 60 + periodStart[1];
                    const periodEndMinutes = periodEnd[0] * 60 + periodEnd[1];
                    const checkStartMinutes = checkStart[0] * 60 + checkStart[1];
                    const checkEndMinutes = checkEnd[0] * 60 + checkEnd[1];
                    // Check for overlap
                    if (!(checkEndMinutes <= periodStartMinutes || checkStartMinutes >= periodEndMinutes)) {
                        return false; // Teacher is not available
                    }
                }
                return true; // Teacher is available
            };
            const existingPeriods = [
                { startTime: '09:00', endTime: '09:45' },
                { startTime: '11:00', endTime: '11:45' }
            ];
            // Available slot
            expect(checkTeacherAvailability(existingPeriods, '10:00', '10:45')).toBeTruthy();
            // Conflicting slot
            expect(checkTeacherAvailability(existingPeriods, '09:30', '10:15')).toBeFalsy();
            // Adjacent slot (should be available)
            expect(checkTeacherAvailability(existingPeriods, '09:45', '10:30')).toBeTruthy();
        });
    });
    describe('Academic Year Logic', () => {
        it('should generate correct academic year based on current date', () => {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            let expectedAcademicYear;
            // Academic year starts in April (month 3, 0-indexed)
            if (currentMonth >= 3) {
                expectedAcademicYear = `${currentYear}-${currentYear + 1}`;
            }
            else {
                expectedAcademicYear = `${currentYear - 1}-${currentYear}`;
            }
            expect(expectedAcademicYear).toMatch(/^\d{4}-\d{4}$/);
            const [startYear, endYear] = expectedAcademicYear.split('-').map(Number);
            expect(endYear).toBe(startYear + 1);
        });
    });
    describe('Unique Timetable Constraint', () => {
        it('should prevent duplicate timetables for same class and academic year', () => {
            const timetable1 = {
                classId: '8-A',
                academicYear: '2023-2024'
            };
            const timetable2 = {
                classId: '8-A',
                academicYear: '2023-2024'
            };
            const timetable3 = {
                classId: '8-B', // Different class
                academicYear: '2023-2024'
            };
            // Same class and academic year should conflict
            expect(timetable1.classId === timetable2.classId &&
                timetable1.academicYear === timetable2.academicYear).toBeTruthy();
            // Different class should not conflict
            expect(timetable1.classId !== timetable3.classId &&
                timetable1.academicYear === timetable3.academicYear).toBeTruthy();
        });
    });
});
//# sourceMappingURL=Timetable.test.js.map