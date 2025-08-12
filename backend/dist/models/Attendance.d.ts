import mongoose, { Document } from 'mongoose';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export interface IAttendance extends Document {
    studentId: mongoose.Types.ObjectId;
    teacherId: mongoose.Types.ObjectId;
    classId: string;
    subject: string;
    date: Date;
    status: AttendanceStatus;
    markedAt: Date;
    academicYear: string;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
    isMarkedToday(): boolean;
    getClassIdentifier(): string;
    getFormattedDate(): string;
    isLate(): boolean;
}
export declare const Attendance: mongoose.Model<IAttendance, {}, {}, {}, mongoose.Document<unknown, {}, IAttendance, {}, {}> & IAttendance & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Attendance.d.ts.map