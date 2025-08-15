export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Attendance {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    rollNo: string;
    standard: string;
    section: string;
  };
  teacherId: {
    _id: string;
    name: string;
    employeeId: string;
  };
  classId: string;
  subject: string;
  date: Date;
  status: AttendanceStatus;
  markedAt: Date;
  academicYear: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarkAttendanceRequest {
  studentId: string;
  classId: string;
  subject: string;
  date: string;
  status: AttendanceStatus;
  academicYear: string;
  remarks?: string;
}

export interface UpdateAttendanceRequest {
  status?: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceFilters {
  subject?: string;
  startDate?: string;
  endDate?: string;
  academicYear?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export interface AttendanceResponse {
  records: Attendance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AttendancePercentage {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

export interface AttendanceSummary {
  counts: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  percentages: {
    present: number;
    absent: number;
    late: number;
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ClassRosterStudent {
  _id: string;
  name: string;
  rollNo: string;
  standard: string;
  section: string;
  status: 'active' | 'left';
  attendanceStatus?: AttendanceStatus;
  attendanceId?: string;
  remarks?: string;
}

export interface AttendanceMarkingData {
  classId: string;
  subject: string;
  date: string;
  academicYear: string;
  students: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}