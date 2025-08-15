export interface Student {
  _id: string;
  rollNo: string;
  name: string;
  dateOfBirth: Date;
  admissionDate: Date;
  standard: string;
  section: string;
  parentContact: {
    fatherName: string;
    motherName: string;
    phone: string;
    email: string;
    address: string;
  };
  status: 'active' | 'left';
  leavingDate?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentData {
  rollNo: string;
  name: string;
  dateOfBirth: string;
  admissionDate: string;
  standard: string;
  section: string;
  parentContact: {
    fatherName: string;
    motherName: string;
    phone: string;
    email: string;
    address: string;
  };
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  status?: 'active' | 'left';
  leavingDate?: string;
}

export interface StudentFilters {
  standard?: string;
  section?: string;
  status?: 'active' | 'left';
  search?: string;
}

export interface TransferStudentData {
  standard: string;
  section: string;
}