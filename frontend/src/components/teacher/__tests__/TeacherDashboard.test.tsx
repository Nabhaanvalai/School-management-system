import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TeacherDashboard from '../TeacherDashboard';
import { useAuth } from '../../../context/AuthContext';
import { timetableService } from '../../../services/timetableService';
import { leaveService } from '../../../services/leaveService';
import { attendanceService } from '../../../services/attendanceService';

// Mock all the services and context
vi.mock('../../../context/AuthContext');
vi.mock('../../../services/timetableService');
vi.mock('../../../services/leaveService');
vi.mock('../../../services/attendanceService');

const mockUseAuth = vi.mocked(useAuth);
const mockTimetableService = vi.mocked(timetableService);
const mockLeaveService = vi.mocked(leaveService);
const mockAttendanceService = vi.mocked(attendanceService);

const mockUser = {
  _id: 'user1',
  email: 'teacher@example.com',
  role: 'teacher' as const,
  profile: {
    _id: 'teacher1',
    name: 'John Doe',
    employeeId: 'EMP001'
  }
};

describe('TeacherDashboard', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    });

    // Mock all service calls to prevent actual API calls
    mockTimetableService.getTeacherTimetable.mockResolvedValue([]);
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue([]);
    mockLeaveService.getLeaveSummary.mockResolvedValue({
      sick: { days: 0, count: 0 },
      casual: { days: 0, count: 0 },
      maternity: { days: 0, count: 0 },
      paternity: { days: 0, count: 0 },
      emergency: { days: 0, count: 0 },
      vacation: { days: 0, count: 0 },
      other: { days: 0, count: 0 },
      total: { days: 0, count: 0 }
    });
    mockAttendanceService.getTeacherClasses.mockResolvedValue([]);
    mockAttendanceService.getAttendanceHistory.mockResolvedValue([]);
  });

  it('renders teacher dashboard with all tabs', () => {
    render(<TeacherDashboard />);
    
    expect(screen.getByText('Teacher Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage student attendance and view your records')).toBeInTheDocument();
    
    // Check all tab buttons
    expect(screen.getByText('Mark Attendance')).toBeInTheDocument();
    expect(screen.getByText('Attendance History')).toBeInTheDocument();
    expect(screen.getByText('My Schedule')).toBeInTheDocument();
    expect(screen.getByText('Apply Leave')).toBeInTheDocument();
    expect(screen.getByText('Leave Status')).toBeInTheDocument();
  });

  it('shows mark attendance tab by default', () => {
    render(<TeacherDashboard />);
    
    // Mark Attendance tab should be active by default
    const markAttendanceTab = screen.getByText('Mark Attendance').closest('button');
    expect(markAttendanceTab).toHaveClass('border-blue-500', 'text-blue-600');
  });

  it('switches to attendance history tab when clicked', async () => {
    render(<TeacherDashboard />);
    
    const historyTab = screen.getByText('Attendance History');
    await user.click(historyTab);
    
    // History tab should now be active
    const historyTabButton = historyTab.closest('button');
    expect(historyTabButton).toHaveClass('border-blue-500', 'text-blue-600');
  });

  it('switches to schedule tab when clicked', async () => {
    render(<TeacherDashboard />);
    
    const scheduleTab = screen.getByText('My Schedule');
    await user.click(scheduleTab);
    
    // Schedule tab should now be active
    const scheduleTabButton = scheduleTab.closest('button');
    expect(scheduleTabButton).toHaveClass('border-blue-500', 'text-blue-600');
    
    // Should show schedule content
    await waitFor(() => {
      expect(screen.getByText('My Class Schedule')).toBeInTheDocument();
    });
  });

  it('switches to leave application tab when clicked', async () => {
    render(<TeacherDashboard />);
    
    const leaveTab = screen.getByText('Apply Leave');
    await user.click(leaveTab);
    
    // Leave tab should now be active
    const leaveTabButton = leaveTab.closest('button');
    expect(leaveTabButton).toHaveClass('border-blue-500', 'text-blue-600');
    
    // Should show leave application form
    expect(screen.getByText('Apply for Leave')).toBeInTheDocument();
    expect(screen.getByText('Submit a new leave application')).toBeInTheDocument();
  });

  it('switches to leave status tab when clicked', async () => {
    render(<TeacherDashboard />);
    
    const leaveStatusTab = screen.getByText('Leave Status');
    await user.click(leaveStatusTab);
    
    // Leave Status tab should now be active
    const leaveStatusTabButton = leaveStatusTab.closest('button');
    expect(leaveStatusTabButton).toHaveClass('border-blue-500', 'text-blue-600');
    
    // Should show leave status content
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });
  });

  it('switches to leave status tab after successful leave submission', async () => {
    const mockLeaveRequest = {
      _id: 'leave1',
      teacherId: 'teacher1',
      leaveType: 'casual' as const,
      startDate: '2024-01-15',
      endDate: '2024-01-15',
      totalDays: 1,
      reason: 'Personal work',
      status: 'pending' as const,
      appliedDate: '2024-01-10T10:00:00Z',
      isHalfDay: false,
      academicYear: '2023-2024',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z'
    };

    mockLeaveService.createLeaveRequest.mockResolvedValue(mockLeaveRequest);
    
    render(<TeacherDashboard />);
    
    // Go to leave application tab
    const leaveTab = screen.getByText('Apply Leave');
    await user.click(leaveTab);
    
    // Fill and submit leave form
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Personal work that requires attention');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    // Should automatically switch to leave status tab
    await waitFor(() => {
      const leaveStatusTabButton = screen.getByText('Leave Status').closest('button');
      expect(leaveStatusTabButton).toHaveClass('border-blue-500', 'text-blue-600');
    });
  });

  it('displays correct tab icons', () => {
    render(<TeacherDashboard />);
    
    // Check that all tabs have their respective icons
    expect(screen.getByText('✓')).toBeInTheDocument(); // Mark Attendance
    expect(screen.getByText('📋')).toBeInTheDocument(); // Attendance History
    expect(screen.getByText('📅')).toBeInTheDocument(); // My Schedule
    expect(screen.getByText('📝')).toBeInTheDocument(); // Apply Leave
    expect(screen.getByText('📊')).toBeInTheDocument(); // Leave Status
  });

  it('maintains tab state when switching between tabs', async () => {
    render(<TeacherDashboard />);
    
    // Start with mark attendance tab (default)
    expect(screen.getByText('Mark Attendance').closest('button')).toHaveClass('border-blue-500');
    
    // Switch to schedule tab
    await user.click(screen.getByText('My Schedule'));
    expect(screen.getByText('My Schedule').closest('button')).toHaveClass('border-blue-500');
    
    // Switch to leave application tab
    await user.click(screen.getByText('Apply Leave'));
    expect(screen.getByText('Apply Leave').closest('button')).toHaveClass('border-blue-500');
    
    // Switch back to mark attendance tab
    await user.click(screen.getByText('Mark Attendance'));
    expect(screen.getByText('Mark Attendance').closest('button')).toHaveClass('border-blue-500');
  });

  it('renders tab content correctly for each tab', async () => {
    render(<TeacherDashboard />);
    
    // Mark Attendance tab (default)
    // Note: AttendanceMarker component would be rendered here
    
    // Switch to Attendance History tab
    await user.click(screen.getByText('Attendance History'));
    // Note: AttendanceHistory component would be rendered here
    
    // Switch to My Schedule tab
    await user.click(screen.getByText('My Schedule'));
    await waitFor(() => {
      expect(screen.getByText('My Class Schedule')).toBeInTheDocument();
    });
    
    // Switch to Apply Leave tab
    await user.click(screen.getByText('Apply Leave'));
    expect(screen.getByText('Apply for Leave')).toBeInTheDocument();
    
    // Switch to Leave Status tab
    await user.click(screen.getByText('Leave Status'));
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });
  });

  it('handles tab navigation with keyboard', async () => {
    render(<TeacherDashboard />);
    
    const scheduleTab = screen.getByText('My Schedule');
    
    // Focus and activate with Enter key
    scheduleTab.focus();
    fireEvent.keyDown(scheduleTab, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(scheduleTab.closest('button')).toHaveClass('border-blue-500');
    });
  });

  it('refreshes leave status when leave is submitted', async () => {
    const mockLeaveRequest = {
      _id: 'leave1',
      teacherId: 'teacher1',
      leaveType: 'casual' as const,
      startDate: '2024-01-15',
      endDate: '2024-01-15',
      totalDays: 1,
      reason: 'Personal work',
      status: 'pending' as const,
      appliedDate: '2024-01-10T10:00:00Z',
      isHalfDay: false,
      academicYear: '2023-2024',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z'
    };

    mockLeaveService.createLeaveRequest.mockResolvedValue(mockLeaveRequest);
    
    render(<TeacherDashboard />);
    
    // Go to leave application tab
    await user.click(screen.getByText('Apply Leave'));
    
    // Submit a leave request
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Personal work that requires attention');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    // Should switch to leave status tab and trigger refresh
    await waitFor(() => {
      const leaveStatusTab = screen.getByText('Leave Status').closest('button');
      expect(leaveStatusTab).toHaveClass('border-blue-500');
    });
    
    // The leave status component should receive the refresh trigger
    expect(mockLeaveService.getTeacherLeaveRequests).toHaveBeenCalled();
  });

  it('displays responsive layout correctly', () => {
    render(<TeacherDashboard />);
    
    const container = screen.getByText('Teacher Dashboard').closest('.max-w-7xl');
    expect(container).toHaveClass('max-w-7xl', 'mx-auto');
    
    const tabNavigation = screen.getByRole('navigation');
    expect(tabNavigation).toHaveClass('flex', 'space-x-8');
  });
});