import mongoose, { Document } from 'mongoose';
export type PaymentType = 'student-fee' | 'teacher-salary' | 'staff-salary' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank-transfer' | 'cheque' | 'online' | 'card';
export type FeeCategory = 'tuition' | 'admission' | 'exam' | 'transport' | 'library' | 'sports' | 'other';
export interface IPayment extends Document {
    paymentType: PaymentType;
    studentId?: mongoose.Types.ObjectId;
    teacherId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    amount: number;
    dueDate: Date;
    paidDate?: Date;
    status: PaymentStatus;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
    receiptNumber?: string;
    feeCategory?: FeeCategory;
    academicYear: string;
    month?: string;
    year?: number;
    description: string;
    remarks?: string;
    createdBy: mongoose.Types.ObjectId;
    processedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    markAsPaid(paymentMethod: PaymentMethod, transactionId?: string, processedBy?: string): void;
    markAsOverdue(): void;
    cancelPayment(reason: string): void;
    isOverdue(): boolean;
    getDaysOverdue(): number;
    generateReceiptNumber(): string;
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Payment.d.ts.map