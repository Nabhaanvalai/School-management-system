export interface Teacher {
  _id: string;
  employeeId: string;
  name: string;
  subjects: string[];
  assignedClasses: {
    standard: string;
    section: string;
    subject: string;
  }[];
  salary: {
    amount: number;
    status: 'paid' | 'unpaid';
    lastPaidDate?: Date;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeacherData {
  employeeId: string;
  name: string;
  subjects: string[];
  salary: {
    amount: number;
    status: 'paid' | 'unpaid';
  };
}

export interface UpdateTeacherData extends Partial<CreateTeacherData> {
  assignedClasses?: {
    standard: string;
    section: string;
    subject: string;
  }[];
}

export interface TeacherFilters {
  subject?: string;
  standard?: string;
  section?: string;
  salaryStatus?: 'paid' | 'unpaid';
  search?: string;
}

export interface TeacherAssignment {
  standard: string;
  section: string;
  subject: string;
}

export interface SalaryUpdate {
  amount: number;
  status: 'paid' | 'unpaid';
  lastPaidDate?: string;
}