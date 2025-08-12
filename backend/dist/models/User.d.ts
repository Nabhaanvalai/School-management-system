import mongoose, { Document } from 'mongoose';
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';
export interface AdminProfile {
    name: string;
    employeeId: string;
    department: string;
    phone: string;
}
export interface TeacherProfile {
    name: string;
    employeeId: string;
    subjects: string[];
    phone: string;
    address: string;
    dateOfJoining: Date;
}
export interface StudentProfile {
    name: string;
    rollNo: string;
    standard: string;
    section: string;
    dateOfBirth: Date;
    admissionDate: Date;
    parentContact: {
        fatherName: string;
        motherName: string;
        phone: string;
        email: string;
        address: string;
    };
}
export interface ParentProfile {
    name: string;
    phone: string;
    email: string;
    address: string;
    children: mongoose.Types.ObjectId[];
}
export interface IUser extends Document {
    email: string;
    password: string;
    role: UserRole;
    profile: AdminProfile | TeacherProfile | StudentProfile | ParentProfile;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    hashPassword(): Promise<void>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map