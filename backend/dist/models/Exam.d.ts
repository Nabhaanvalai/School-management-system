import mongoose, { Document } from 'mongoose';
export interface SubjectExam {
    subject: string;
    date: Date;
    syllabus: string;
    maxMarks: number;
    duration: number;
    startTime: string;
    endTime: string;
}
export interface StudentMarks {
    subject: string;
    marksObtained: number;
    grade: string;
    remarks?: string;
}
export interface StudentResult {
    studentId: mongoose.Types.ObjectId;
    marks: StudentMarks[];
    totalMarks: number;
    percentage: number;
    overallGrade: string;
    rank?: number;
}
export interface IExam extends Document {
    name: string;
    academicYear: string;
    classId: string;
    examType: 'unit-test' | 'mid-term' | 'final' | 'annual';
    subjects: SubjectExam[];
    results: StudentResult[];
    isActive: boolean;
    isResultPublished: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    addSubject(subjectExam: SubjectExam): void;
    removeSubject(subject: string): void;
    addStudentResult(studentResult: StudentResult): void;
    updateStudentMarks(studentId: string, marks: StudentMarks[]): void;
    calculateGrade(percentage: number): string;
    publishResults(): void;
    getClassIdentifier(): string;
    getTotalMaxMarks(): number;
}
export declare const Exam: mongoose.Model<IExam, {}, {}, {}, mongoose.Document<unknown, {}, IExam, {}, {}> & IExam & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Exam.d.ts.map