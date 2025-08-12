import mongoose, { Document } from 'mongoose';
export type EventType = 'holiday' | 'exam' | 'sports-day' | 'annual-day' | 'parent-meeting' | 'workshop' | 'other';
export type EventPriority = 'low' | 'medium' | 'high' | 'critical';
export interface IAcademicCalendar extends Document {
    title: string;
    description: string;
    eventType: EventType;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    startTime?: string;
    endTime?: string;
    location?: string;
    priority: EventPriority;
    isRecurring: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurringEndDate?: Date;
    academicYear: string;
    targetAudience: ('all' | 'students' | 'teachers' | 'parents' | 'staff')[];
    classIds?: string[];
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    isEventToday(): boolean;
    isEventThisWeek(): boolean;
    getDuration(): number;
    getFormattedDate(): string;
    isTargetedTo(audience: string): boolean;
}
export declare const AcademicCalendar: mongoose.Model<IAcademicCalendar, {}, {}, {}, mongoose.Document<unknown, {}, IAcademicCalendar, {}, {}> & IAcademicCalendar & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AcademicCalendar.d.ts.map