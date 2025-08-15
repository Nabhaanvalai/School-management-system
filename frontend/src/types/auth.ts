export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  profile: AdminProfile | TeacherProfile | StudentProfile | ParentProfile;
  isActive: boolean;
}

export interface AdminProfile {
  name: string;
  employeeId: string;
}

export interface TeacherProfile {
  name: string;
  employeeId: string;
  subjects: string[];
}

export interface StudentProfile {
  name: string;
  rollNo: string;
  standard: string;
  section: string;
}

export interface ParentProfile {
  name: string;
  studentId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}