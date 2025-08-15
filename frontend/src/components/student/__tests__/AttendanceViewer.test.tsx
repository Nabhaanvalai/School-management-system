import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AttendanceViewer from '../AttendanceViewer';
import { attendanceService } from '../../../services/attendanceService';

// Mock the attendance service
vi.mock('../../../services/attendanceService');

const mockAttendanceService = vi.mocked(attendanceService);

const mockAttendanceData = {
  records: [
    {
      _id: '1',
      studentId: {
        _id: 'student1',
        name: 'John Doe',
        rollNo: '001',
        standard: '10',
        section: 'A'
      },
      teacherId: {
        _id: 'teacher1',
        name: 'Jane Smith',
        employeeId: 'EMP001'
      },
      classId: 'class1',
      subject: 'Mathematics',
      date: new Date('2024-01-15'),
      status: 'present' as const,
      markedAt: new Date('2024-01-15T09:00:00Z'),
      academicYear: '2024-2025',
      remarks: 'Good participation',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      _id: '2',
      studentId: {
        _id: 'student1',
        name: 'John Doe',
        rollNo: '001',
        standard: '10',
        section: 'A'
      },
      teacherId: {
        _id: 'teacher2',
        name: 'Bob Johnson',
        employeeId: 'EMP002'
      },
      classId: 'class1',
      subject: 'English',
      date: new Date('2024-01-16'),
      status: 'absent' as const,
      markedAt: new Date('2024-01-16T09:00:00Z'),
      academicYear: '2024-2025',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16')
    }
  ],
  pagination: {
    page: 1,
    limit: 50,
    total: 2,
    pages: 1
  }
};

const mockSummaryData = {
  counts: {
    present: 1,
    absent: 1,
    late: 0,
    total: 2
  },
  percentages: {
    present: 50,
    absent: 50,
    late: 0
  },
  dateRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  }
};

describe('AttendanceViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAttendanceService.getStudentAttendance.mockResolvedValue(mockAttendanceData);
    mockAttendanceService.getStudentAttendanceSummary.mockResolvedValue(mockSummaryData);
  });

  it('renders loading state initially', () => {
    render(<AttendanceViewer studentId="student1" />);
    
    expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders attendance data after loading', async () => {
    render(<AttendanceViewer studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance History')).toBeInTheDocument();
    });

    // Check summary cards
    expect(screen.getByText('50.0%')).toBeInTheDocument(); // Present percentage
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 days')).toBeInTheDocument();

    // Check attendance records table
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('displays correct status colors', async () => {
    render(<AttendanceViewer studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance History')).toBeInTheDocument();
    });

    const presentStatus = screen.getByText('Present');
    const absentStatus = screen.getByText('Absent');
    
    expect(presentStatus).toHaveClass('text-green-600', 'bg-green-100');
    expect(absentStatus).toHaveClass('text-red-600', 'bg-red-100');
  });

  it('handles filter changes', async () => {
    render(<AttendanceViewer studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance History')).toBeInTheDocument();
    });

    const academicYearSelect = screen.getByDisplayValue('2025-2026');
    fireEvent.change(academicYearSelect, { target: { value: '2024-2025' } });

    await waitFor(() => {
      expect(mockAttendanceService.getStudentAttendance).toHaveBeenCalledWith(
        'student1',
        expect.objectContaining({
          academicYear: '2024-2025'
        })
      );
    });
  });

  it('handles error state', async () => {
    mockAttendanceService.getStudentAttendance.mockRejectedValue(new Error('Failed to fetch'));
    mockAttendanceService.getStudentAttendanceSummary.mockRejectedValue(new Error('Failed to fetch'));

    render(<AttendanceViewer studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Attendance')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('handles empty attendance data', async () => {
    mockAttendanceService.getStudentAttendance.mockResolvedValue({
      records: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 }
    });

    render(<AttendanceViewer studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('No attendance records found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    render(<AttendanceViewer studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance History')).toBeInTheDocument();
    });

    // Check if dates are formatted correctly (DD MMM YYYY format)
    expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
    expect(screen.getByText('16 Jan 2024')).toBeInTheDocument();
  });

  it('displays remarks when available', async () => {
    render(<AttendanceViewer studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance History')).toBeInTheDocument();
    });

    expect(screen.getByText('Good participation')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument(); // For empty remarks
  });

  it('calls service methods with correct parameters', async () => {
    render(<AttendanceViewer studentId="student1" />);
    
    await waitFor(() => {
      expect(mockAttendanceService.getStudentAttendance).toHaveBeenCalledWith(
        'student1',
        expect.objectContaining({
          academicYear: expect.stringMatching(/^\d{4}-\d{4}$/),
          page: 1,
          limit: 50
        })
      );
      
      expect(mockAttendanceService.getStudentAttendanceSummary).toHaveBeenCalledWith(
        'student1',
        expect.stringMatching(/^\d{4}-\d{4}$/)
      );
    });
  });
});