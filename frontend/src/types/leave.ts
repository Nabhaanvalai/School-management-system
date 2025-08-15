export type LeaveType = 'sick' | 'casual' | 'maternity' | 'paternity' | 'emergency' | 'vacation' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  _id: string;
  teacherId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  reviewedDate?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay?: boolean;
  halfDaySession?: 'morning' | 'afternoon';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  attachments?: string[];
}

export interface UpdateLeaveRequestData extends Partial<CreateLeaveRequestData> {}

export interface LeaveFilters {
  status?: LeaveStatus;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  academicYear?: string;
}

export interface LeaveSummary {
  sick: { days: number; count: number };
  casual: { days: number; count: number };
  maternity: { days: number; count: number };
  paternity: { days: number; count: number };
  emergency: { days: number; count: number };
  vacation: { days: number; count: number };
  other: { days: number; count: number };
  total: { days: number; count: number };
}

export interface LeaveApprovalData {
  status: 'approved' | 'rejected';
  reviewComments?: string;
}