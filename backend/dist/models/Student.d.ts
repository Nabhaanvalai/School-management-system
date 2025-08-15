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
export interface IStudentModel extends mongoose.Model<IStudent> {
    findByClass(standard: string, section: string): Promise<IStudent[]>;
    getCountByClass(standard: string, section: string): Promise<number>;
    findByStatus(status: StudentStatus): Promise<IStudent[]>;
    isRollNoUnique(rollNo: string, standard: string, section: string, excludeId?: string): Promise<boolean>;
}
export declare const Student: IStudentModel;
//# sourceMappingURL=Student.d.ts.map