"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// Mock mongoose for testing
jest.mock("mongoose", () => ({
    Schema: jest.fn().mockImplementation(() => ({
        index: jest.fn(),
        pre: jest.fn(),
        methods: {},
        statics: {},
    })),
    model: jest.fn(),
    Types: {
        ObjectId: jest.fn().mockImplementation(() => "mockObjectId"),
    },
}));
describe("Academic Management Models", () => {
    describe("Exam Model", () => {
        const validSubjectExam = {
            subject: "Mathematics",
            date: new Date("2024-03-15"),
            syllabus: "Chapters 1-5: Algebra and Geometry",
            maxMarks: 100,
            duration: 180,
            startTime: "09:00",
            endTime: "12:00",
        };
        const validStudentMarks = {
            subject: "Mathematics",
            marksObtained: 85,
            grade: "A",
            remarks: "Good performance",
        };
        const validStudentResult = {
            studentId: new mongoose_1.default.Types.ObjectId(),
            marks: [validStudentMarks],
            totalMarks: 85,
            percentage: 85,
            overallGrade: "A",
            rank: 1,
        };
        const validExamData = {
            name: "Mid Term Examination",
            academicYear: "2023-2024",
            classId: "8-A",
            examType: "mid-term",
            subjects: [validSubjectExam],
            results: [validStudentResult],
            isActive: true,
            isResultPublished: false,
            createdBy: new mongoose_1.default.Types.ObjectId(),
        };
        it("should validate exam required fields", () => {
            const requiredFields = [
                "name",
                "academicYear",
                "classId",
                "examType",
                "createdBy",
            ];
            requiredFields.forEach((field) => {
                expect(validExamData).toHaveProperty(field);
                expect(validExamData[field]).toBeDefined();
            });
        });
        it("should validate exam types", () => {
            const validExamTypes = ["unit-test", "mid-term", "final", "annual"];
            const invalidExamTypes = ["quiz", "assignment", "project"];
            validExamTypes.forEach((type) => {
                expect(["unit-test", "mid-term", "final", "annual"]).toContain(type);
            });
            invalidExamTypes.forEach((type) => {
                expect(["unit-test", "mid-term", "final", "annual"]).not.toContain(type);
            });
        });
        it("should validate subject exam data", () => {
            expect(validSubjectExam.subject.length).toBeGreaterThanOrEqual(2);
            expect(validSubjectExam.maxMarks).toBeGreaterThan(0);
            expect(validSubjectExam.duration).toBeGreaterThanOrEqual(15);
            expect(validSubjectExam.date).toBeInstanceOf(Date);
        });
        it("should validate grade values", () => {
            const validGrades = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];
            const invalidGrades = ["A++", "E", "Pass", "Fail"];
            validGrades.forEach((grade) => {
                expect(["A+", "A", "B+", "B", "C+", "C", "D", "F"]).toContain(grade);
            });
            invalidGrades.forEach((grade) => {
                expect(["A+", "A", "B+", "B", "C+", "C", "D", "F"]).not.toContain(grade);
            });
        });
        it("should calculate grade based on percentage", () => {
            const calculateGrade = (percentage) => {
                if (percentage >= 95)
                    return "A+";
                if (percentage >= 85)
                    return "A";
                if (percentage >= 75)
                    return "B+";
                if (percentage >= 65)
                    return "B";
                if (percentage >= 55)
                    return "C+";
                if (percentage >= 45)
                    return "C";
                if (percentage >= 35)
                    return "D";
                return "F";
            };
            expect(calculateGrade(96)).toBe("A+");
            expect(calculateGrade(87)).toBe("A");
            expect(calculateGrade(77)).toBe("B+");
            expect(calculateGrade(67)).toBe("B");
            expect(calculateGrade(57)).toBe("C+");
            expect(calculateGrade(47)).toBe("C");
            expect(calculateGrade(37)).toBe("D");
            expect(calculateGrade(30)).toBe("F");
        });
        it("should prevent time conflicts in exam schedule", () => {
            const checkTimeConflict = (subjects) => {
                const sameDate = subjects.filter((s) => s.date.toDateString() === subjects[0].date.toDateString());
                if (sameDate.length <= 1)
                    return false;
                const sortedSubjects = sameDate.sort((a, b) => {
                    const aStart = a.startTime.split(":").map(Number);
                    const bStart = b.startTime.split(":").map(Number);
                    return aStart[0] * 60 + aStart[1] - (bStart[0] * 60 + bStart[1]);
                });
                for (let i = 0; i < sortedSubjects.length - 1; i++) {
                    const current = sortedSubjects[i];
                    const next = sortedSubjects[i + 1];
                    const currentEnd = current.endTime.split(":").map(Number);
                    const nextStart = next.startTime.split(":").map(Number);
                    const currentEndMinutes = currentEnd[0] * 60 + currentEnd[1];
                    const nextStartMinutes = nextStart[0] * 60 + nextStart[1];
                    if (currentEndMinutes > nextStartMinutes) {
                        return true; // Conflict found
                    }
                }
                return false;
            };
            const conflictingSubjects = [
                {
                    subject: "Math",
                    date: new Date("2024-03-15"),
                    startTime: "09:00",
                    endTime: "11:00",
                },
                {
                    subject: "Physics",
                    date: new Date("2024-03-15"),
                    startTime: "10:30",
                    endTime: "12:30",
                },
            ];
            const nonConflictingSubjects = [
                {
                    subject: "Math",
                    date: new Date("2024-03-15"),
                    startTime: "09:00",
                    endTime: "11:00",
                },
                {
                    subject: "Physics",
                    date: new Date("2024-03-15"),
                    startTime: "11:00",
                    endTime: "13:00",
                },
            ];
            expect(checkTimeConflict(conflictingSubjects)).toBeTruthy();
            expect(checkTimeConflict(nonConflictingSubjects)).toBeFalsy();
        });
    });
    describe("Academic Calendar Model", () => {
        const validCalendarData = {
            title: "Annual Sports Day",
            description: "School annual sports day celebration with various competitions",
            eventType: "sports-day",
            startDate: new Date("2024-03-20"),
            endDate: new Date("2024-03-20"),
            isAllDay: true,
            priority: "high",
            isRecurring: false,
            academicYear: "2023-2024",
            targetAudience: ["all"],
            isActive: true,
            createdBy: new mongoose_1.default.Types.ObjectId(),
        };
        it("should validate calendar required fields", () => {
            const requiredFields = [
                "title",
                "description",
                "eventType",
                "startDate",
                "endDate",
                "academicYear",
                "targetAudience",
                "createdBy",
            ];
            requiredFields.forEach((field) => {
                expect(validCalendarData).toHaveProperty(field);
                expect(validCalendarData[field]).toBeDefined();
            });
        });
        it("should validate event types", () => {
            const validEventTypes = [
                "holiday",
                "exam",
                "sports-day",
                "annual-day",
                "parent-meeting",
                "workshop",
                "other",
            ];
            const invalidEventTypes = ["birthday", "vacation", "conference"];
            validEventTypes.forEach((type) => {
                expect([
                    "holiday",
                    "exam",
                    "sports-day",
                    "annual-day",
                    "parent-meeting",
                    "workshop",
                    "other",
                ]).toContain(type);
            });
            invalidEventTypes.forEach((type) => {
                expect([
                    "holiday",
                    "exam",
                    "sports-day",
                    "annual-day",
                    "parent-meeting",
                    "workshop",
                    "other",
                ]).not.toContain(type);
            });
        });
        it("should validate event priorities", () => {
            const validPriorities = [
                "low",
                "medium",
                "high",
                "critical",
            ];
            const invalidPriorities = ["urgent", "normal", "important"];
            validPriorities.forEach((priority) => {
                expect(["low", "medium", "high", "critical"]).toContain(priority);
            });
            invalidPriorities.forEach((priority) => {
                expect(["low", "medium", "high", "critical"]).not.toContain(priority);
            });
        });
        it("should validate target audience", () => {
            const validAudiences = [
                "all",
                "students",
                "teachers",
                "parents",
                "staff",
            ];
            const invalidAudiences = ["administrators", "visitors", "public"];
            validAudiences.forEach((audience) => {
                expect(["all", "students", "teachers", "parents", "staff"]).toContain(audience);
            });
            invalidAudiences.forEach((audience) => {
                expect([
                    "all",
                    "students",
                    "teachers",
                    "parents",
                    "staff",
                ]).not.toContain(audience);
            });
        });
        it("should validate end date is after start date", () => {
            const startDate = new Date("2024-03-20");
            const validEndDate = new Date("2024-03-22");
            const invalidEndDate = new Date("2024-03-18");
            expect(validEndDate >= startDate).toBeTruthy();
            expect(invalidEndDate >= startDate).toBeFalsy();
        });
        it("should calculate event duration", () => {
            const calculateDuration = (startDate, endDate) => {
                const timeDifference = endDate.getTime() - startDate.getTime();
                return Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;
            };
            const singleDay = calculateDuration(new Date("2024-03-20"), new Date("2024-03-20"));
            const threeDays = calculateDuration(new Date("2024-03-20"), new Date("2024-03-22"));
            expect(singleDay).toBe(1);
            expect(threeDays).toBe(3);
        });
    });
    describe("Payment Model", () => {
        const validPaymentData = {
            paymentType: "student-fee",
            studentId: new mongoose_1.default.Types.ObjectId(),
            amount: 5000,
            dueDate: new Date("2024-04-01"),
            status: "pending",
            feeCategory: "tuition",
            academicYear: "2023-2024",
            description: "Tuition fee for Q1 2024",
            createdBy: new mongoose_1.default.Types.ObjectId(),
        };
        it("should validate payment required fields", () => {
            const requiredFields = [
                "paymentType",
                "amount",
                "dueDate",
                "status",
                "academicYear",
                "description",
                "createdBy",
            ];
            requiredFields.forEach((field) => {
                expect(validPaymentData).toHaveProperty(field);
                expect(validPaymentData[field]).toBeDefined();
            });
        });
        it("should validate payment types", () => {
            const validPaymentTypes = [
                "student-fee",
                "teacher-salary",
                "staff-salary",
                "other",
            ];
            const invalidPaymentTypes = [
                "vendor-payment",
                "utility-bill",
                "maintenance",
            ];
            validPaymentTypes.forEach((type) => {
                expect([
                    "student-fee",
                    "teacher-salary",
                    "staff-salary",
                    "other",
                ]).toContain(type);
            });
            invalidPaymentTypes.forEach((type) => {
                expect([
                    "student-fee",
                    "teacher-salary",
                    "staff-salary",
                    "other",
                ]).not.toContain(type);
            });
        });
        it("should validate payment statuses", () => {
            const validStatuses = [
                "pending",
                "paid",
                "overdue",
                "cancelled",
            ];
            const invalidStatuses = ["processing", "failed", "refunded"];
            validStatuses.forEach((status) => {
                expect(["pending", "paid", "overdue", "cancelled"]).toContain(status);
            });
            invalidStatuses.forEach((status) => {
                expect(["pending", "paid", "overdue", "cancelled"]).not.toContain(status);
            });
        });
        it("should validate fee categories", () => {
            const validCategories = [
                "tuition",
                "admission",
                "exam",
                "transport",
                "library",
                "sports",
                "other",
            ];
            const invalidCategories = ["food", "uniform", "books"];
            validCategories.forEach((category) => {
                expect([
                    "tuition",
                    "admission",
                    "exam",
                    "transport",
                    "library",
                    "sports",
                    "other",
                ]).toContain(category);
            });
            invalidCategories.forEach((category) => {
                expect([
                    "tuition",
                    "admission",
                    "exam",
                    "transport",
                    "library",
                    "sports",
                    "other",
                ]).not.toContain(category);
            });
        });
        it("should check if payment is overdue", () => {
            const isOverdue = (dueDate, status) => {
                return (status === "overdue" || (status === "pending" && dueDate < new Date()));
            };
            const pastDue = new Date();
            pastDue.setDate(pastDue.getDate() - 5);
            const futureDue = new Date();
            futureDue.setDate(futureDue.getDate() + 5);
            expect(isOverdue(pastDue, "pending")).toBeTruthy();
            expect(isOverdue(futureDue, "pending")).toBeFalsy();
            expect(isOverdue(futureDue, "overdue")).toBeTruthy();
        });
        it("should generate receipt number", () => {
            const generateReceiptNumber = (paymentType) => {
                const year = new Date().getFullYear();
                const month = String(new Date().getMonth() + 1).padStart(2, "0");
                const random = Math.floor(Math.random() * 10000)
                    .toString()
                    .padStart(4, "0");
                let prefix = "RCP";
                if (paymentType === "student-fee")
                    prefix = "FEE";
                else if (paymentType === "teacher-salary")
                    prefix = "SAL";
                else if (paymentType === "staff-salary")
                    prefix = "STF";
                return `${prefix}${year}${month}${random}`;
            };
            const feeReceipt = generateReceiptNumber("student-fee");
            const salaryReceipt = generateReceiptNumber("teacher-salary");
            expect(feeReceipt).toMatch(/^FEE\d{10}$/); // Year(4) + Month(2) + Random(4) = 10 digits
            expect(salaryReceipt).toMatch(/^SAL\d{10}$/);
        });
    });
    describe("Leave Request Model", () => {
        const validLeaveData = {
            teacherId: new mongoose_1.default.Types.ObjectId(),
            leaveType: "casual",
            startDate: new Date("2024-04-15"),
            endDate: new Date("2024-04-17"),
            totalDays: 3,
            reason: "Personal work that requires my attention",
            status: "pending",
            appliedDate: new Date(),
            isHalfDay: false,
            academicYear: "2023-2024",
        };
        it("should validate leave required fields", () => {
            const requiredFields = [
                "teacherId",
                "leaveType",
                "startDate",
                "endDate",
                "totalDays",
                "reason",
                "status",
                "academicYear",
            ];
            requiredFields.forEach((field) => {
                expect(validLeaveData).toHaveProperty(field);
                expect(validLeaveData[field]).toBeDefined();
            });
        });
        it("should validate leave types", () => {
            const validLeaveTypes = [
                "sick",
                "casual",
                "maternity",
                "paternity",
                "emergency",
                "vacation",
                "other",
            ];
            const invalidLeaveTypes = ["personal", "study", "bereavement"];
            validLeaveTypes.forEach((type) => {
                expect([
                    "sick",
                    "casual",
                    "maternity",
                    "paternity",
                    "emergency",
                    "vacation",
                    "other",
                ]).toContain(type);
            });
            invalidLeaveTypes.forEach((type) => {
                expect([
                    "sick",
                    "casual",
                    "maternity",
                    "paternity",
                    "emergency",
                    "vacation",
                    "other",
                ]).not.toContain(type);
            });
        });
        it("should validate leave statuses", () => {
            const validStatuses = [
                "pending",
                "approved",
                "rejected",
                "cancelled",
            ];
            const invalidStatuses = ["processing", "withdrawn", "expired"];
            validStatuses.forEach((status) => {
                expect(["pending", "approved", "rejected", "cancelled"]).toContain(status);
            });
            invalidStatuses.forEach((status) => {
                expect(["pending", "approved", "rejected", "cancelled"]).not.toContain(status);
            });
        });
        it("should calculate total days correctly", () => {
            const calculateTotalDays = (startDate, endDate, isHalfDay) => {
                const start = new Date(startDate);
                const end = new Date(endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                const timeDifference = end.getTime() - start.getTime();
                const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;
                if (isHalfDay) {
                    return 0.5;
                }
                return daysDifference;
            };
            const singleDay = calculateTotalDays(new Date("2024-04-15"), new Date("2024-04-15"), false);
            const threeDays = calculateTotalDays(new Date("2024-04-15"), new Date("2024-04-17"), false);
            const halfDay = calculateTotalDays(new Date("2024-04-15"), new Date("2024-04-15"), true);
            expect(singleDay).toBe(1);
            expect(threeDays).toBe(3);
            expect(halfDay).toBe(0.5);
        });
        it("should check for overlapping leaves", () => {
            const isOverlapping = (leave1, leave2) => {
                const start1 = new Date(leave1.startDate);
                const end1 = new Date(leave1.endDate);
                const start2 = new Date(leave2.startDate);
                const end2 = new Date(leave2.endDate);
                start1.setHours(0, 0, 0, 0);
                end1.setHours(23, 59, 59, 999);
                start2.setHours(0, 0, 0, 0);
                end2.setHours(23, 59, 59, 999);
                return !(end1 < start2 || start1 > end2);
            };
            const leave1 = {
                startDate: new Date("2024-04-15"),
                endDate: new Date("2024-04-17"),
            };
            const overlappingLeave = {
                startDate: new Date("2024-04-16"),
                endDate: new Date("2024-04-18"),
            };
            const nonOverlappingLeave = {
                startDate: new Date("2024-04-20"),
                endDate: new Date("2024-04-22"),
            };
            expect(isOverlapping(leave1, overlappingLeave)).toBeTruthy();
            expect(isOverlapping(leave1, nonOverlappingLeave)).toBeFalsy();
        });
        it("should validate half day leave constraints", () => {
            const validateHalfDayLeave = (startDate, endDate, isHalfDay) => {
                if (!isHalfDay)
                    return true;
                const start = new Date(startDate);
                const end = new Date(endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                return start.getTime() === end.getTime();
            };
            const singleDayHalf = validateHalfDayLeave(new Date("2024-04-15"), new Date("2024-04-15"), true);
            const multiDayHalf = validateHalfDayLeave(new Date("2024-04-15"), new Date("2024-04-17"), true);
            expect(singleDayHalf).toBeTruthy();
            expect(multiDayHalf).toBeFalsy();
        });
    });
});
//# sourceMappingURL=AcademicManagement.test.js.map