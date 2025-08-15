import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AttendanceHistory from '../AttendanceHistory';
import { attendanceService } from '../../../services/attendanceService';

// Mock the attendance service
vi.mock('../../../services/attendanceService', () => ({
  attendanceService: {
    getMyAttendanceRecords: vi.fn()
  }
}));

const mockAttendanceRecords = [
  {
    _id: 'attendance1',
    studentId: {
      _id: 'student1',
      name: 'John Doe',
      rollNo: '001',
      standard: '8',
      section: 'A'
    },
    teacherId: {
      _id: 'teacher1',
      name: 'Teacher Name',
      employeeId: 'T001'
    },
    classId: '8-A',
    subject: 'Mathematics',
    date: new Date('2024-01-15'),
    status: 'present' as const,
    markedAt: new Date('2024-01-15T09:00:00'),
    academicYear: '2023-2024',
    remarks: 'Good participation',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    _id: 'attendance2',
    studentId: {
      _id: 'student2',
      name: 'Jane Smith',
      rollNo: '002',
      standard: '8',
      section: 'A'
    },
    teacherId: {
      _id: 'teacher1',
      name: 'Teacher Name',
      employeeId: 'T001'
    },
    classId: '8-A',
    subject: 'Science',
    date: new Date('2024-01-15'),
    status: 'absent' as const,
    markedAt: new Date('2024-01-15T09:30:00'),
    academicYear: '2023-2024',
    remarks: '',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 2,
  pages: 1
};

describe('AttendanceHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (attendanceService.getMyAttendanceRecords as any).mockResolvedValue({
      records: mockAttendanceRecords,
      pagination: mockPagination
    });
  });

  it('renders attendance history component', async () => {
    render(<AttendanceHistory />);
    
    expect(screen.getByText('Attendance History')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Academic Year')).toBeInTheDocument();
  });

  it('loads attendance records on mount', async () => {
    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(attendanceService.getMyAttendanceRecords).toHaveBeenCalledWith({
        page: 1,
        limit: 20
      });
    });
  });

  it('displays attendance records in table', async () => {
    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('8-A')).toBeInTheDocument();
    });
  });

  it('displays attendance status badges correctly', async () => {
    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Present')).toBeInTheDocument();
      expect(screen.getByText('Absent')).toBeInTheDocument();
    });

    // Check badge colors
    const presentBadge = screen.getByText('Present');
    const absentBadge = screen.getByText('Absent');
    
    expect(presentBadge).toHaveClass('bg-green-100', 'text-green-800');
    expect(absentBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('displays formatted dates correctly', async () => {
    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });
  });

  it('displays remarks or dash when empty', async () => {
    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Good participation')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('filters records by subject', async () => {
    render(<AttendanceHistory />);
    
    const subjectInput = screen.getByLabelText('Subject');
    fireEvent.change(subjectInput, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(attendanceService.getMyAttendanceRecords).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        subject: 'Mathematics'
      });
    });
  });

  it('filters records by date range', async () => {
    render(<AttendanceHistory />);
    
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    await waitFor(() => {
      expect(attendanceService.getMyAttendanceRecords).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
    });
  });

  it('filters records by academic year', async () => {
    render(<AttendanceHistory />);
    
    const academicYearInput = screen.getByLabelText('Academic Year');
    fireEvent.change(academicYearInput, { target: { value: '2023-2024' } });

    await waitFor(() => {
      expect(attendanceService.getMyAttendanceRecords).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        academicYear: '2023-2024'
      });
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    render(<AttendanceHistory />);
    
    // Set some filters
    const subjectInput = screen.getByLabelText('Subject');
    fireEvent.change(subjectInput, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(subjectInput).toHaveValue('Mathematics');
    });

    // Click clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(subjectInput).toHaveValue('');
      expect(attendanceService.getMyAttendanceRecords).toHaveBeenCalledWith({
        page: 1,
        limit: 20
      });
    });
  });

  it('displays pagination when multiple pages exist', async () => {
    const multiPagePagination = {
      page: 1,
      limit: 20,
      total: 50,
      pages: 3
    };

    (attendanceService.getMyAttendanceRecords as any).mockResolvedValue({
      records: mockAttendanceRecords,
      pagination: multiPagePagination
    });

    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  it('handles pagination navigation', async () => {
    const multiPagePagination = {
      page: 1,
      limit: 20,
      total: 50,
      pages: 3
    };

    (attendanceService.getMyAttendanceRecords as any).mockResolvedValue({
      records: mockAttendanceRecords,
      pagination: multiPagePagination
    });

    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(attendanceService.getMyAttendanceRecords).toHaveBeenCalledWith({
        page: 2,
        limit: 20
      });
    });
  });

  it('disables previous button on first page', async () => {
    render(<AttendanceHistory />);
    
    await waitFor(() => {
      const previousButton = screen.queryByText('Previous');
      if (previousButton) {
        expect(previousButton).toBeDisabled();
      }
    });
  });

  it('displays loading state', async () => {
    // Mock a delayed response
    (attendanceService.getMyAttendanceRecords as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        records: mockAttendanceRecords,
        pagination: mockPagination
      }), 100))
    );

    render(<AttendanceHistory />);
    
    expect(screen.getByText('Loading attendance history...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('displays error message when loading fails', async () => {
    (attendanceService.getMyAttendanceRecords as any).mockRejectedValue(
      new Error('Failed to load attendance history')
    );

    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load attendance history')).toBeInTheDocument();
    });
  });

  it('displays no records message when no data is available', async () => {
    (attendanceService.getMyAttendanceRecords as any).mockResolvedValue({
      records: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    });

    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('No attendance records found. Try adjusting your filters.')).toBeInTheDocument();
    });
  });

  it('displays results summary', async () => {
    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing 1 to 2 of 2 records')).toBeInTheDocument();
    });
  });

  it('resets to first page when filters change', async () => {
    const multiPagePagination = {
      page: 2,
      limit: 20,
      total: 50,
      pages: 3
    };

    (attendanceService.getMyAttendanceRecords as any).mockResolvedValue({
      records: mockAttendanceRecords,
      pagination: multiPagePagination
    });

    render(<AttendanceHistory />);
    
    await waitFor(() => {
      expect(attendanceService.getMyAttendanceRecords).toHaveBeenCalled();
    });

    // Change subject filter
    const subjectInput = screen.getByLabelText('Subject');
    fireEvent.change(subjectInput, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(attendanceService.getMyAttendanceRecords).toHaveBeenCalledWith({
        page: 1, // Should reset to page 1
        limit: 20,
        subject: 'Mathematics'
      });
    });
  });
});