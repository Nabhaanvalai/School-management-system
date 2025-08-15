import axios from 'axios';

export interface ExamSubject {
  subject: string;
  date: Date;
  startTime: string;
  endTime: string;
  syllabus: string;
  maxMarks: number;
  examType: 'written' | 'practical' | 'oral' | 'project';
  venue?: string;
  instructions?: string;
}

export interface Exam {
  _id: string;
  name: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  type: 'unit-test' | 'mid-term' | 'final' | 'annual' | 'entrance';
  standard: string;
  section: string;
  subjects: ExamSubject[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  instructions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExamData {
  name: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  type: 'unit-test' | 'mid-term' | 'final' | 'annual' | 'entrance';
  standard: string;
  section: string;
  subjects: Omit<ExamSubject, 'date'> & { date: Date }[];
  instructions: string[];
}

export interface ExamFilters {
  standard?: string;
  section?: string;
  academicYear?: string;
  status?: string;
  type?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const examAPI = axios.create({
  baseURL: `${API_BASE_URL}/exams`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
examAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const examService = {
  async getExams(filters?: ExamFilters): Promise<Exam[]> {
    const params = new URLSearchParams();
    
    if (filters?.standard) params.append('standard', filters.standard);
    if (filters?.section) params.append('section', filters.section);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    
    const response = await examAPI.get(`/?${params.toString()}`);
    return response.data.map((exam: any) => ({
      ...exam,
      startDate: new Date(exam.startDate),
      endDate: new Date(exam.endDate),
      subjects: exam.subjects.map((subject: any) => ({
        ...subject,
        date: new Date(subject.date)
      })),
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt)
    }));
  },

  async getExamById(id: string): Promise<Exam> {
    const response = await examAPI.get(`/${id}`);
    const exam = response.data;
    return {
      ...exam,
      startDate: new Date(exam.startDate),
      endDate: new Date(exam.endDate),
      subjects: exam.subjects.map((subject: any) => ({
        ...subject,
        date: new Date(subject.date)
      })),
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt)
    };
  },

  async getStudentExams(studentClass: { standard: string; section: string }): Promise<Exam[]> {
    const response = await examAPI.get(`/student?standard=${studentClass.standard}&section=${studentClass.section}`);
    return response.data.map((exam: any) => ({
      ...exam,
      startDate: new Date(exam.startDate),
      endDate: new Date(exam.endDate),
      subjects: exam.subjects.map((subject: any) => ({
        ...subject,
        date: new Date(subject.date)
      })),
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt)
    }));
  },

  async createExam(examData: CreateExamData): Promise<Exam> {
    const response = await examAPI.post('/', examData);
    const exam = response.data;
    return {
      ...exam,
      startDate: new Date(exam.startDate),
      endDate: new Date(exam.endDate),
      subjects: exam.subjects.map((subject: any) => ({
        ...subject,
        date: new Date(subject.date)
      })),
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt)
    };
  },

  async updateExam(id: string, examData: Partial<CreateExamData>): Promise<Exam> {
    const response = await examAPI.put(`/${id}`, examData);
    const exam = response.data;
    return {
      ...exam,
      startDate: new Date(exam.startDate),
      endDate: new Date(exam.endDate),
      subjects: exam.subjects.map((subject: any) => ({
        ...subject,
        date: new Date(subject.date)
      })),
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt)
    };
  },

  async deleteExam(id: string): Promise<void> {
    await examAPI.delete(`/${id}`);
  },

  async addMarks(examId: string, studentId: string, marks: { subject: string; marksObtained: number; grade: string }[]): Promise<void> {
    await examAPI.post(`/${examId}/marks`, { studentId, marks });
  },

  async getStudentMarks(examId: string, studentId: string): Promise<{ subject: string; marksObtained: number; grade: string }[]> {
    const response = await examAPI.get(`/${examId}/marks/${studentId}`);
    return response.data;
  }
};