import axios from 'axios';
import { ReportFilters, ReportData, StudentReportCard, ClassPerformance, AttendanceSummary, StudentCount, TeacherAssignments, FeeStatus, SalaryStatus } from '../types/reports';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const reportsAPI = axios.create({
  baseURL: `${API_BASE_URL}/reports`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
reportsAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const reportsService = {
  async generateReport(filters: ReportFilters): Promise<ReportData> {
    const response = await reportsAPI.post('/generate', filters);
    return response.data;
  },

  async getStudentReportCard(studentId: string, academicYear?: string): Promise<StudentReportCard> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await reportsAPI.get(`/student/${studentId}?${params.toString()}`);
    return response.data;
  },

  async getClassPerformance(standard: string, section: string, academicYear?: string): Promise<ClassPerformance> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await reportsAPI.get(`/class-performance/${standard}/${section}?${params.toString()}`);
    return response.data;
  },

  async getAttendanceSummary(filters: {
    studentId?: string;
    standard?: string;
    section?: string;
    subject?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceSummary> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await reportsAPI.get(`/attendance-summary?${params.toString()}`);
    return response.data;
  },

  async getStudentCount(academicYear?: string): Promise<StudentCount> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await reportsAPI.get(`/student-count?${params.toString()}`);
    return response.data;
  },

  async getTeacherAssignments(academicYear?: string): Promise<TeacherAssignments> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await reportsAPI.get(`/teacher-assignments?${params.toString()}`);
    return response.data;
  },

  async getFeeStatus(filters: {
    standard?: string;
    section?: string;
    status?: 'paid' | 'pending' | 'overdue';
  }): Promise<FeeStatus> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await reportsAPI.get(`/fee-status?${params.toString()}`);
    return response.data;
  },

  async getSalaryStatus(): Promise<SalaryStatus> {
    const response = await reportsAPI.get('/salary-status');
    return response.data;
  },

  async exportReport(filters: ReportFilters): Promise<Blob> {
    const response = await reportsAPI.post('/export', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  async downloadReport(filters: ReportFilters, filename: string): Promise<void> {
    const blob = await this.exportReport(filters);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};