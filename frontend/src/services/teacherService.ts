import axios from 'axios';
import { Teacher, CreateTeacherData, UpdateTeacherData, TeacherFilters, TeacherAssignment, SalaryUpdate } from '../types/teacher';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const teacherAPI = axios.create({
  baseURL: `${API_BASE_URL}/teachers`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
teacherAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const teacherService = {
  async getTeachers(filters?: TeacherFilters): Promise<Teacher[]> {
    const params = new URLSearchParams();
    
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.standard) params.append('standard', filters.standard);
    if (filters?.section) params.append('section', filters.section);
    if (filters?.salaryStatus) params.append('salaryStatus', filters.salaryStatus);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await teacherAPI.get(`/?${params.toString()}`);
    return response.data;
  },

  async getTeacherById(id: string): Promise<Teacher> {
    const response = await teacherAPI.get(`/${id}`);
    return response.data;
  },

  async createTeacher(teacherData: CreateTeacherData): Promise<Teacher> {
    const response = await teacherAPI.post('/', teacherData);
    return response.data;
  },

  async updateTeacher(id: string, teacherData: UpdateTeacherData): Promise<Teacher> {
    const response = await teacherAPI.put(`/${id}`, teacherData);
    return response.data;
  },

  async assignTeacherToClass(id: string, assignments: TeacherAssignment[]): Promise<Teacher> {
    const response = await teacherAPI.put(`/${id}/assignments`, { assignments });
    return response.data;
  },

  async updateSalaryStatus(id: string, salaryData: SalaryUpdate): Promise<Teacher> {
    const response = await teacherAPI.put(`/${id}/salary`, salaryData);
    return response.data;
  },

  async deleteTeacher(id: string): Promise<void> {
    await teacherAPI.delete(`/${id}`);
  },

  async getAvailableSubjects(): Promise<string[]> {
    const response = await teacherAPI.get('/subjects');
    return response.data;
  }
};