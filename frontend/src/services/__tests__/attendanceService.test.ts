import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { attendanceService } from '../attendanceService';
import { MarkAttendanceRequest, AttendanceMarkingData } from '../../types/attendance';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('attendanceService', () => {
  const mockToken = 'mock-jwt-token';
  const mockAttendanceData: MarkAttendanceRequest = {
    studentId: 'student1',
    classId: '8-A',
    subject: 'Mathematics',
    date: '2024-01-15',
    status: 'present',
    academicYear: '2023-2024',
    remarks: 'Good participation'
  };

  const mockAttendanceResponse = {
    data: {
      data: {
        _id: 'attendance1',
        studentId: {
          _id: 'student1',
          name: 'John Doe',
          rollNo: '001'
        },
        teacherId: {
          _id: 'teacher1',
          name: 'Teacher Name',
          employeeId: 'T001'
        },
        classId: '8-A',
        subject: 'Mathematics',
        date: new Date('2024-01-15'),
        status: 'present',
        markedAt: new Date(),
        academicYear: '2023-2024',
        remarks: 'Good participation'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
  });

  describe('markAttendance', () => {
    it('should mark attendance for a student', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.post.mockResolvedValue(mockAttendanceResponse);

      const result = await attendanceService.markAttendance(mockAttendanceData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/mark', mockAttendanceData);
      expect(result).toEqual(mockAttendanceResponse.data.data);
    });

    it('should handle errors when marking attendance', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const errorMessage = 'Failed to mark attendance';
      mockAxiosInstance.post.mockRejectedValue(new Error(errorMessage));

      await expect(attendanceService.markAttendance(mockAttendanceData)).rejects.toThrow(errorMessage);
    });
  });

  describe('markBulkAttendance', () => {
    it('should mark attendance for multiple students', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.post.mockResolvedValue(mockAttendanceResponse);

      const bulkData: AttendanceMarkingData = {
        classId: '8-A',
        subject: 'Mathematics',
        date: '2024-01-15',
        academicYear: '2023-2024',
        students: [
          { studentId: 'student1', status: 'present', remarks: 'Good' },
          { studentId: 'student2', status: 'absent' }
        ]
      };

      const result = await attendanceService.markBulkAttendance(bulkData);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('updateAttendance', () => {
    it('should update existing attendance record', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.put.mockResolvedValue(mockAttendanceResponse);

      const updates = { status: 'late' as const, remarks: 'Updated remarks' };
      const result = await attendanceService.updateAttendance('attendance1', updates);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/attendance1', updates);
      expect(result).toEqual(mockAttendanceResponse.data.data);
    });
  });

  describe('getStudentAttendance', () => {
    it('should get attendance records for a student', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const mockResponse = {
        data: {
          data: {
            records: [mockAttendanceResponse.data.data],
            pagination: { page: 1, limit: 10, total: 1, pages: 1 }
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const filters = { subject: 'Mathematics', page: 1, limit: 10 };
      const result = await attendanceService.getStudentAttendance('student1', filters);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/student1?subject=Mathematics&page=1&limit=10');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle empty filters', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const mockResponse = {
        data: {
          data: {
            records: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 }
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getStudentAttendance('student1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/student1?');
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getStudentAttendancePercentage', () => {
    it('should get attendance percentage for a student', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const mockResponse = {
        data: {
          data: {
            totalDays: 20,
            presentDays: 18,
            absentDays: 2,
            percentage: 90
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const filters = { subject: 'Mathematics', academicYear: '2023-2024' };
      const result = await attendanceService.getStudentAttendancePercentage('student1', filters);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/student/student1/percentage?subject=Mathematics&academicYear=2023-2024');
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getClassAttendance', () => {
    it('should get attendance records for a class and subject', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const mockResponse = {
        data: {
          data: {
            records: [mockAttendanceResponse.data.data],
            pagination: { page: 1, limit: 50, total: 1, pages: 1 }
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const filters = { date: '2024-01-15', academicYear: '2023-2024' };
      const result = await attendanceService.getClassAttendance('8-A', 'Mathematics', filters);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/class/8-A/subject/Mathematics?date=2024-01-15&academicYear=2023-2024');
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getClassAttendanceSummary', () => {
    it('should get attendance summary for a class and subject', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const mockResponse = {
        data: {
          data: {
            counts: { present: 15, absent: 3, late: 2, total: 20 },
            percentages: { present: 75, absent: 15, late: 10 },
            dateRange: { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getClassAttendanceSummary(
        '8-A', 
        'Mathematics', 
        '2024-01-01', 
        '2024-01-31', 
        '2023-2024'
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/class/8-A/subject/Mathematics/summary?startDate=2024-01-01&endDate=2024-01-31&academicYear=2023-2024');
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getMyAttendanceRecords', () => {
    it('should get current teacher\'s attendance records', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const mockResponse = {
        data: {
          data: {
            records: [mockAttendanceResponse.data.data],
            pagination: { page: 1, limit: 20, total: 1, pages: 1 }
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const filters = { subject: 'Mathematics', startDate: '2024-01-01' };
      const result = await attendanceService.getMyAttendanceRecords(filters);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/teacher/my-records?subject=Mathematics&startDate=2024-01-01');
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getClassStudents', () => {
    it('should get students for a specific class', async () => {
      const mockStudents = [
        {
          _id: 'student1',
          name: 'John Doe',
          rollNo: '001',
          standard: '8',
          section: 'A',
          status: 'active'
        }
      ];

      // Mock axios.create for student API
      const mockStudentAxiosInstance = {
        get: vi.fn().mockResolvedValue({ data: mockStudents })
      };
      mockedAxios.create.mockReturnValue(mockStudentAxiosInstance);

      const result = await attendanceService.getClassStudents('8-A');

      expect(mockStudentAxiosInstance.get).toHaveBeenCalledWith('/?standard=8&section=A&status=active');
      expect(result).toEqual(mockStudents);
    });
  });

  describe('checkAttendanceExists', () => {
    it('should check if attendance exists for a class, subject, and date', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const mockResponse = {
        data: {
          data: {
            records: [mockAttendanceResponse.data.data]
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.checkAttendanceExists('8-A', 'Mathematics', '2024-01-15', '2023-2024');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/class/8-A/subject/Mathematics', {
        params: { date: '2024-01-15', academicYear: '2023-2024' }
      });
      expect(result).toEqual(mockResponse.data.data.records);
    });
  });

  describe('getTeacherSubjects', () => {
    it('should get available subjects for a teacher', async () => {
      const mockSubjects = ['Mathematics', 'Science', 'English'];
      const mockTeacherAxiosInstance = {
        get: vi.fn().mockResolvedValue({ data: mockSubjects })
      };
      mockedAxios.create.mockReturnValue(mockTeacherAxiosInstance);

      const result = await attendanceService.getTeacherSubjects();

      expect(mockTeacherAxiosInstance.get).toHaveBeenCalledWith('/subjects');
      expect(result).toEqual(mockSubjects);
    });
  });

  describe('getTeacherClasses', () => {
    it('should get teacher\'s assigned classes', async () => {
      const mockClasses = [
        { standard: '8', section: 'A', subject: 'Mathematics' },
        { standard: '9', section: 'B', subject: 'Science' }
      ];

      // Mock auth API call
      const mockAuthAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: { profile: { _id: 'teacher1' } }
        })
      };

      // Mock teacher API call
      const mockTeacherAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: { assignedClasses: mockClasses }
        })
      };

      // Mock axios.create to return different instances based on baseURL
      mockedAxios.create.mockImplementation((config: any) => {
        if (config.baseURL.includes('/auth')) {
          return mockAuthAxiosInstance;
        }
        return mockTeacherAxiosInstance;
      });

      const result = await attendanceService.getTeacherClasses();

      expect(mockAuthAxiosInstance.get).toHaveBeenCalledWith('/me');
      expect(mockTeacherAxiosInstance.get).toHaveBeenCalledWith('/teacher1');
      expect(result).toEqual(mockClasses);
    });

    it('should return empty array when no assigned classes', async () => {
      const mockAuthAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: { profile: { _id: 'teacher1' } }
        })
      };

      const mockTeacherAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: {} // No assignedClasses property
        })
      };

      mockedAxios.create.mockImplementation((config: any) => {
        if (config.baseURL.includes('/auth')) {
          return mockAuthAxiosInstance;
        }
        return mockTeacherAxiosInstance;
      });

      const result = await attendanceService.getTeacherClasses();

      expect(result).toEqual([]);
    });
  });

  describe('request interceptor', () => {
    it('should add authorization header when token exists', () => {
      const mockAxiosInstance = mockedAxios.create();
      const interceptorCallback = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      const config = { headers: {} };
      const result = interceptorCallback(config);

      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should not add authorization header when token does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const mockAxiosInstance = mockedAxios.create();
      const interceptorCallback = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      const config = { headers: {} };
      const result = interceptorCallback(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});