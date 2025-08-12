import mongoose, { Document } from 'mongoose';
export type SalaryStatus = 'paid' | 'unpaid';
export interface ClassAssignment {
    standard: string;
    section: string;
    subject: string;
    academicYear?: string;
}
export interface SalaryInfo {
    amount: number;
    status: SalaryStatus;
    lastPaidDate?: Date;
    paymentHistory?: {
        amount: number;
        paidDate: Date;
        month: string;
        year: number;
    }[];
}
export interface ITeacher extends Document {
    employeeId: string;
    name: string;
    subjects: string[];
    assignedClasses: ClassAssignment[];
    salary: SalaryInfo;
    phone: string;
    email: string;
    address: string;
    dateOfJoining: Date;
    isActive: boolean;
    userId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    assignToClass(standard: string, section: string, subject: string, academicYear?: string): void;
    removeFromClass(standard: string, section: string, subject: string): void;
    updateSalaryStatus(status: SalaryStatus, paidDate?: Date): void;
    addPaymentRecord(amount: number, month: string, year: number): void;
    getAssignedClassesCount(): number;
    getSubjectsCount(): number;
    getClassIdentifiers(): string[];
}
export declare const Teacher: mongoose.Model<ITeacher, {}, {}, {}, mongoose.Document<unknown, {}, ITeacher, {}, {}> & ITeacher & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Teacher.d.ts.map