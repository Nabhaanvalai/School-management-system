import axios from 'axios';
import { Student, CreateStudentData, UpdateStudentData, StudentFilters, TransferStudentData } from '../types/student';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const studentAPI = axios.create({
  baseURL: `${API_BASE_URL}/students`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
studentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const studentService = {
  async getStudents(filters?: StudentFilters): Promise<Student[]> {
    const params = new URLSearchParams();
    
    if (filters?.standard) params.append('standard', filters.standard);
    if (filters?.section) params.append('section', filters.section);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await studentAPI.get(`/?${params.toString()}`);
    return response.data;
  },

  async getStudentById(id: string): Promise<Student> {
    const response = await studentAPI.get(`/${id}`);
    return response.data;
  },

  async createStudent(studentData: CreateStudentData): Promise<Student> {
    const response = await studentAPI.post('/', studentData);
    return response.data;
  },

  async updateStudent(id: string, studentData: UpdateStudentData): Promise<Student> {
    const response = await studentAPI.put(`/${id}`, studentData);
    return response.data;
  },

  async transferStudent(id: string, transferData: TransferStudentData): Promise<Student> {
    const response = await studentAPI.put(`/${id}/transfer`, transferData);
    return response.data;
  },

  async markStudentLeft(id: string, leavingDate: string): Promise<Student> {
    const response = await studentAPI.put(`/${id}/status`, {
      status: 'left',
      leavingDate
    });
    return response.data;
  },

  async archiveStudent(id: string): Promise<void> {
    await studentAPI.delete(`/${id}`);
  },

  async getStudentCounts(): Promise<{ standard: string; section: string; count: number }[]> {
    const response = await studentAPI.get('/counts');
    return response.data;
  }
};