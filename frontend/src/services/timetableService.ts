import axios from 'axios';
import { Timetable, CreateTimetableData, UpdateTimetableData, TimetableFilters, ClassInfo, TeacherOption } from '../types/timetable';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const timetableAPI = axios.create({
  baseURL: `${API_BASE_URL}/timetable`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
timetableAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const timetableService = {
  async getTimetables(filters?: TimetableFilters): Promise<Timetable[]> {
    const params = new URLSearchParams();
    
    if (filters?.standard) params.append('standard', filters.standard);
    if (filters?.section) params.append('section', filters.section);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    if (filters?.teacherId) params.append('teacherId', filters.teacherId);
    
    const response = await timetableAPI.get(`/?${params.toString()}`);
    return response.data;
  },

  async getTimetableById(id: string): Promise<Timetable> {
    const response = await timetableAPI.get(`/${id}`);
    return response.data;
  },

  async getTimetableByClass(classId: string): Promise<Timetable | null> {
    try {
      const response = await timetableAPI.get(`/class/${classId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getTeacherTimetable(teacherId: string): Promise<Timetable[]> {
    const response = await timetableAPI.get(`/teacher/${teacherId}`);
    return response.data;
  },

  async createTimetable(timetableData: CreateTimetableData): Promise<Timetable> {
    const response = await timetableAPI.post('/', timetableData);
    return response.data;
  },

  async updateTimetable(id: string, timetableData: UpdateTimetableData): Promise<Timetable> {
    const response = await timetableAPI.put(`/${id}`, timetableData);
    return response.data;
  },

  async deleteTimetable(id: string): Promise<void> {
    await timetableAPI.delete(`/${id}`);
  },

  async getClasses(): Promise<ClassInfo[]> {
    const response = await timetableAPI.get('/classes');
    return response.data;
  },

  async getTeachers(): Promise<TeacherOption[]> {
    const response = await timetableAPI.get('/teachers');
    return response.data;
  },

  async getAvailableSubjects(): Promise<string[]> {
    const response = await timetableAPI.get('/subjects');
    return response.data;
  }
};