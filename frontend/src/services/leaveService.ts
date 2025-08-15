import axios from 'axios';
import { 
  LeaveRequest, 
  CreateLeaveRequestData, 
  UpdateLeaveRequestData, 
  LeaveFilters, 
  LeaveSummary,
  LeaveApprovalData 
} from '../types/leave';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const leaveAPI = axios.create({
  baseURL: `${API_BASE_URL}/leave`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
leaveAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const leaveService = {
  async getLeaveRequests(filters?: LeaveFilters): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.leaveType) params.append('leaveType', filters.leaveType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    
    const response = await leaveAPI.get(`/?${params.toString()}`);
    return response.data;
  },

  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    const response = await leaveAPI.get(`/${id}`);
    return response.data;
  },

  async getTeacherLeaveRequests(teacherId: string, academicYear?: string): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await leaveAPI.get(`/teacher/${teacherId}?${params.toString()}`);
    return response.data;
  },

  async createLeaveRequest(leaveData: CreateLeaveRequestData): Promise<LeaveRequest> {
    const response = await leaveAPI.post('/', leaveData);
    return response.data;
  },

  async updateLeaveRequest(id: string, leaveData: UpdateLeaveRequestData): Promise<LeaveRequest> {
    const response = await leaveAPI.put(`/${id}`, leaveData);
    return response.data;
  },

  async deleteLeaveRequest(id: string): Promise<void> {
    await leaveAPI.delete(`/${id}`);
  },

  async approveLeaveRequest(id: string, data: LeaveApprovalData): Promise<LeaveRequest> {
    const response = await leaveAPI.put(`/${id}/approve`, data);
    return response.data;
  },

  async rejectLeaveRequest(id: string, data: LeaveApprovalData): Promise<LeaveRequest> {
    const response = await leaveAPI.put(`/${id}/reject`, data);
    return response.data;
  },

  async cancelLeaveRequest(id: string, reason?: string): Promise<LeaveRequest> {
    const response = await leaveAPI.put(`/${id}/cancel`, { reason });
    return response.data;
  },

  async getLeaveSummary(teacherId: string, academicYear: string): Promise<LeaveSummary> {
    const response = await leaveAPI.get(`/teacher/${teacherId}/summary?academicYear=${academicYear}`);
    return response.data;
  },

  async getPendingLeaveRequests(academicYear?: string): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    
    const response = await leaveAPI.get(`/pending?${params.toString()}`);
    return response.data;
  },

  async checkOverlappingLeaves(
    teacherId: string, 
    startDate: string, 
    endDate: string, 
    excludeId?: string
  ): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    params.append('teacherId', teacherId);
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (excludeId) params.append('excludeId', excludeId);
    
    const response = await leaveAPI.get(`/overlapping?${params.toString()}`);
    return response.data;
  }
};