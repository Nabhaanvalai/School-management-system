export interface ReportFilters {
  reportType: ReportType;
  academicYear?: string;
  standard?: string;
  section?: string;
  studentId?: string;
  teacherId?: string;
  subject?: string;
  startDate?: string;
  endDate?: string;
  format?: 'pdf' | 'excel';
}

export type ReportType = 
  | 'student-report-card'
  | 'class-performance'
  | 'attendance-summary'
  | 'student-count'
  | 'teacher-assignments'
  | 'fee-status'
  | 'salary-status';

export interface ReportData {
  type: ReportType;
  title: string;
  generatedAt: Date;
  filters: ReportFilters;
  data: any;
}

export interface StudentReportCard {
  student: {
    _id: string;
    name: string;
    rollNo: string;
    standard: string;
    section: string;
  };
  subjects: {
    subject: string;
    marks: number;
    maxMarks: number;
    grade: string;
    teacher: string;
  }[];
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
  };
  overallGrade: string;
  rank: number;
  totalStudents: number;
}

export interface ClassPerformance {
  class: {
    standard: string;
    section: string;
  };
  subjects: {
    subject: string;
    averageMarks: number;
    maxMarks: number;
    passPercentage: number;
    topStudent: string;
    lowestMarks: number;
    highestMarks: number;
  }[];
  overallAverage: number;
  totalStudents: number;
}

export interface AttendanceSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  class?: {
    standard: string;
    section: string;
  };
  student?: {
    name: string;
    rollNo: string;
  };
  subjects: {
    subject: string;
    totalClasses: number;
    attendedClasses: number;
    percentage: number;
  }[];
  overallAttendance: {
    totalClasses: number;
    attendedClasses: number;
    percentage: number;
  };
}

export interface StudentCount {
  byStandard: {
    standard: string;
    sections: {
      section: string;
      activeCount: number;
      leftCount: number;
      totalCount: number;
    }[];
    totalActive: number;
    totalLeft: number;
    grandTotal: number;
  }[];
  schoolTotal: {
    activeCount: number;
    leftCount: number;
    totalCount: number;
  };
}

export interface TeacherAssignments {
  teachers: {
    _id: string;
    name: string;
    employeeId: string;
    subjects: string[];
    assignments: {
      standard: string;
      section: string;
      subject: string;
    }[];
    totalClasses: number;
  }[];
}

export interface FeeStatus {
  students: {
    _id: string;
    name: string;
    rollNo: string;
    standard: string;
    section: string;
    feeAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: 'paid' | 'pending' | 'overdue';
    lastPaymentDate?: string;
  }[];
  summary: {
    totalStudents: number;
    totalFeeAmount: number;
    totalPaidAmount: number;
    totalPendingAmount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  };
}

export interface SalaryStatus {
  teachers: {
    _id: string;
    name: string;
    employeeId: string;
    salaryAmount: number;
    status: 'paid' | 'unpaid';
    lastPaidDate?: string;
    pendingMonths: number;
  }[];
  summary: {
    totalTeachers: number;
    totalSalaryAmount: number;
    paidCount: number;
    unpaidCount: number;
    totalPendingAmount: number;
  };
}