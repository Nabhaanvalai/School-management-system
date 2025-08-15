export type PaymentType = 'student-fee' | 'teacher-salary' | 'staff-salary' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank-transfer' | 'cheque' | 'online' | 'card';
export type FeeCategory = 'tuition' | 'admission' | 'exam' | 'transport' | 'library' | 'sports' | 'other';

export interface Payment {
  _id: string;
  paymentType: PaymentType;
  studentId?: {
    _id: string;
    name: string;
    rollNo: string;
    standard: string;
    section: string;
  };
  teacherId?: {
    _id: string;
    name: string;
    employeeId: string;
  };
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
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentPaymentSummary {
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  payments: Payment[];
  paymentsByCategory: {
    category: FeeCategory;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  }[];
}

export interface PaymentFilters {
  academicYear?: string;
  status?: PaymentStatus;
  feeCategory?: FeeCategory;
  startDate?: string;
  endDate?: string;
}