import mongoose, { Document } from 'mongoose';
export type LeaveType = 'sick' | 'casual' | 'maternity' | 'paternity' | 'emergency' | 'vacation' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export interface ILeaveRequest extends Document {
    teacherId: mongoose.Types.ObjectId;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string;
    status: LeaveStatus;
    appliedDate: Date;
    reviewedDate?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewComments?: string;
    isHalfDay: boolean;
    halfDaySession?: 'morning' | 'afternoon';
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    attachments?: string[];
    academicYear: string;
    createdAt: Date;
    updatedAt: Date;
    approve(reviewedBy: string, comments?: string): void;
    reject(reviewedBy: string, comments: string): void;
    cancel(reason?: string): void;
    calculateTotalDays(): number;
    isOverlapping(otherLeave: ILeaveRequest): boolean;
    getFormattedDateRange(): string;
    canBeModified(): boolean;
}
export declare const LeaveRequest: mongoose.Model<ILeaveRequest, {}, {}, {}, mongoose.Document<unknown, {}, ILeaveRequest, {}, {}> & ILeaveRequest & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=LeaveRequest.d.ts.map