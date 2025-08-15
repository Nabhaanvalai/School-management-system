import axios from 'axios';
import {
  Attendance,
  MarkAttendanceRequest,
  UpdateAttendanceRequest,
  AttendanceFilters,
  AttendanceResponse,
  AttendancePercentage,
  AttendanceSummary,
  AttendanceMarkingData
} from '../types/attendance';
import { Student } from '../types/student';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const attendanceAPI = axios.create({
  baseURL: `${API_BASE_URL}/attendance`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
attendanceAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const attendanceService = {
  // Mark attendance for a single student
  async markAttendance(attendanceData: MarkAttendanceRequest): Promise<Attendance> {
    const response = await attendanceAPI.post('/mark', attendanceData);
    return response.data.data;
  },

  // Mark attendance for multiple students (bulk marking)
  async markBulkAttendance(attendanceData: AttendanceMarkingData): Promise<Attendance[]> {
    const promises = attendanceData.students.map(student => 
      this.markAttendance({
        studentId: student.studentId,
        classId: attendanceData.classId,
        subject: attendanceData.subject,
        date: attendanceData.date,
        status: student.status,
        academicYear: attendanceData.academicYear,
        remarks: student.remarks
      })
    );

    return Promise.all(promises);
  },

  // Update existing attendance record
  async updateAttendance(attendanceId: string, updates: UpdateAttendanceRequest): Promise<Attendance> {
    const response = await attendanceAPI.put(`/${attendanceId}`, updates);
    return response.data.data;
  },

  // Get attendance records for a specific student
  async getStudentAttendance(studentId: string, filters?: AttendanceFilters): Promise<AttendanceResponse> {
    const params = new URLSearchParams();
    
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await attendanceAPI.get(`/student/${studentId}?${params.toString()}`);
    return response.data.data;
  },

  // Get attendance percentage for a student
  async getStudentAttendancePercentage(studentId: string, filters?: Omit<AttendanceFilters, 'page' | 'limit'>): Promise<AttendancePercentage> {
    const params = new URLSearchParams();
    
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    
    const response = await attendanceAPI.get(`/student/${studentId}/percentage?${params.toString()}`);
    return response.data.data;
  },

  // Get attendance summary for a student
  async getStudentAttendanceSummary(studentId: string, academicYear?: string): Promise<AttendanceSummary> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await attendanceAPI.get(`/student/${studentId}/summary?${params.toString()}`);
    return response.data.data;
  },

  // Get attendance records for a specific class and subject
  async getClassAttendance(classId: string, subject: string, filters?: AttendanceFilters): Promise<AttendanceResponse> {
    const params = new URLSearchParams();
    
    if (filters?.date) params.append('date', filters.date);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await attendanceAPI.get(`/class/${classId}/subject/${subject}?${params.toString()}`);
    return response.data.data;
  },

  // Get attendance summary for a class and subject
  async getClassAttendanceSummary(
    classId: string, 
    subject: string, 
    startDate: string, 
    endDate: string, 
    academicYear?: string
  ): Promise<AttendanceSummary> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await attendanceAPI.get(`/class/${classId}/subject/${subject}/summary?${params.toString()}`);
    return response.data.data;
  },

  // Get current teacher's attendance records
  async getMyAttendanceRecords(filters?: AttendanceFilters): Promise<AttendanceResponse> {
    const params = new URLSearchParams();
    
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await attendanceAPI.get(`/teacher/my-records?${params.toString()}`);
    return response.data.data;
  },

  // Get students for a specific class (for attendance marking)
  async getClassStudents(classId: string): Promise<Student[]> {
    const [standard, section] = classId.split('-');
    const studentAPI = axios.create({
      baseURL: `${API_BASE_URL}/students`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });

    const params = new URLSearchParams();
    params.append('standard', standard);
    params.append('section', section);
    params.append('status', 'active');
    
    const response = await studentAPI.get(`/?${params.toString()}`);
    return response.data;
  },

  // Check if attendance is already marked for a class, subject, and date
  async checkAttendanceExists(classId: string, subject: string, date: string, academicYear: string): Promise<Attendance[]> {
    const response = await attendanceAPI.get(`/class/${classId}/subject/${subject}`, {
      params: { date, academicYear }
    });
    return response.data.data.records;
  },

  // Get available subjects for a teacher
  async getTeacherSubjects(): Promise<string[]> {
    const teacherAPI = axios.create({
      baseURL: `${API_BASE_URL}/teachers`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });

    const response = await teacherAPI.get('/subjects');
    return response.data;
  },

  // Get teacher's assigned classes
  async getTeacherClasses(): Promise<{ standard: string; section: string; subject: string }[]> {
    const teacherAPI = axios.create({
      baseURL: `${API_BASE_URL}/teachers`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });

    // Get current teacher's profile
    const authAPI = axios.create({
      baseURL: `${API_BASE_URL}/auth`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });

    const userResponse = await authAPI.get('/me');
    const teacherId = userResponse.data.profile._id;

    const response = await teacherAPI.get(`/${teacherId}`);
    return response.data.assignedClasses || [];
  }
};