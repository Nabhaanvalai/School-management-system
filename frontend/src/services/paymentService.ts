import axios from 'axios';
import { Payment, StudentPaymentSummary, PaymentFilters } from '../types/payment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const paymentAPI = axios.create({
  baseURL: `${API_BASE_URL}/payments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
paymentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const paymentService = {
  async getStudentPayments(studentId: string, filters?: PaymentFilters): Promise<Payment[]> {
    const params = new URLSearchParams();
    
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.feeCategory) params.append('feeCategory', filters.feeCategory);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await paymentAPI.get(`/student/${studentId}?${params.toString()}`);
    return response.data;
  },

  async getStudentPaymentSummary(studentId: string, academicYear?: string): Promise<StudentPaymentSummary> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await paymentAPI.get(`/student/${studentId}/summary?${params.toString()}`);
    return response.data;
  },

  async getPaymentById(paymentId: string): Promise<Payment> {
    const response = await paymentAPI.get(`/${paymentId}`);
    return response.data;
  },

  async downloadReceipt(paymentId: string): Promise<Blob> {
    const response = await paymentAPI.get(`/${paymentId}/receipt`, {
      responseType: 'blob'
    });
    return response.data;
  }
};