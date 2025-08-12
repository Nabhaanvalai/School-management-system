import mongoose, { Document } from 'mongoose';
export type StudentStatus = 'active' | 'left';
export interface ParentContact {
    fatherName: string;
    motherName: string;
    phone: string;
    email: string;
    address: string;
}
export interface IStudent extends Document {
    rollNo: string;
    name: string;
    dateOfBirth: Date;
    admissionDate: Date;
    standard: string;
    section: string;
    parentContact: ParentContact;
    status: StudentStatus;
    leavingDate?: Date;
    userId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    markAsLeft(leavingDate?: Date): void;
    markAsActive(): void;
    getFullName(): string;
    getAge(): number;
    getClassIdentifier(): string;
}
export declare const Student: mongoose.Model<IStudent, {}, {}, {}, mongoose.Document<unknown, {}, IStudent, {}, {}> & IStudent & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Student.d.ts.map