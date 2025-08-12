import mongoose, { Document } from 'mongoose';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
export interface Period {
    slot: string;
    subject: string;
    teacherId: mongoose.Types.ObjectId;
    startTime: string;
    endTime: string;
}
export interface DaySchedule {
    day: DayOfWeek;
    periods: Period[];
}
export interface ITimetable extends Document {
    classId: string;
    academicYear: string;
    schedule: DaySchedule[];
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    getPeriodBySlot(day: DayOfWeek, slot: string): Period | null;
    getTeacherSchedule(teacherId: string): Period[];
    addPeriod(day: DayOfWeek, period: Period): void;
    removePeriod(day: DayOfWeek, slot: string): void;
    getClassIdentifier(): string;
}
export declare const Timetable: mongoose.Model<ITimetable, {}, {}, {}, mongoose.Document<unknown, {}, ITimetable, {}, {}> & ITimetable & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Timetable.d.ts.map