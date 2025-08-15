import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LeaveStatus from '../LeaveStatus';
import { leaveService } from '../../../services/leaveService';
import { useAuth } from '../../../context/AuthContext';

// Mock the services and context
vi.mock('../../../services/leaveService');
vi.mock('../../../context/AuthContext');

const mockLeaveService = vi.mocked(leaveService);
const mockUseAuth = vi.mocked(useAuth);

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

const mockLeaveRequests = [
  {
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
  },
  {
    _id: 'leave2',
    teacherId: 'teacher1',
    leaveType: 'sick' as const,
    startDate: '2024-01-20',
    endDate: '2024-01-22',
    totalDays: 3,
    reason: 'Fever and flu symptoms',
    status: 'approved' as const,
    appliedDate: '2024-01-18T09:00:00Z',
    reviewedDate: '2024-01-19T14:00:00Z',
    reviewedBy: {
      _id: 'admin1',
      name: 'Admin User'
    },
    reviewComments: 'Approved. Get well soon.',
    isHalfDay: false,
    emergencyContact: {
      name: 'Jane Doe',
      phone: '9876543210',
      relationship: 'Spouse'
    },
    academicYear: '2023-2024',
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-19T14:00:00Z'
  },
  {
    _id: 'leave3',
    teacherId: 'teacher1',
    leaveType: 'vacation' as const,
    startDate: '2024-02-10',
    endDate: '2024-02-10',
    totalDays: 0.5,
    reason: 'Afternoon appointment',
    status: 'rejected' as const,
    appliedDate: '2024-02-05T11:00:00Z',
    reviewedDate: '2024-02-06T16:00:00Z',
    reviewedBy: {
      _id: 'admin1',
      name: 'Admin User'
    },
    reviewComments: 'Cannot approve vacation leave during exam period.',
    isHalfDay: true,
    halfDaySession: 'afternoon' as const,
    academicYear: '2023-2024',
    createdAt: '2024-02-05T11:00:00Z',
    updatedAt: '2024-02-06T16:00:00Z'
  }
];

const mockLeaveSummary = {
  sick: { days: 3, count: 1 },
  casual: { days: 1, count: 1 },
  maternity: { days: 0, count: 0 },
  paternity: { days: 0, count: 0 },
  emergency: { days: 0, count: 0 },
  vacation: { days: 0, count: 0 },
  other: { days: 0, count: 0 },
  total: { days: 4, count: 2 }
};

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn()
});

describe('LeaveStatus', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    });
    
    // Mock current date to ensure consistent academic year calculation
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    mockLeaveService.getTeacherLeaveRequests.mockImplementation(() => new Promise(() => {}));
    mockLeaveService.getLeaveSummary.mockImplementation(() => new Promise(() => {}));
    
    render(<LeaveStatus />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders leave requests and summary correctly', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });

    // Check leave summary
    expect(screen.getByText('Leave Summary (2023-2024)')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Total days
    expect(screen.getByText('1')).toBeInTheDocument(); // Casual days
    expect(screen.getByText('3')).toBeInTheDocument(); // Sick days

    // Check leave requests
    expect(screen.getByText('Casual Leave')).toBeInTheDocument();
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.getByText('Vacation Leave')).toBeInTheDocument();
    
    // Check status badges
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('filters leave requests by status', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });

    // Initially shows all requests
    expect(screen.getByText('Casual Leave')).toBeInTheDocument();
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.getByText('Vacation Leave')).toBeInTheDocument();

    // Filter by pending status
    await user.selectOptions(screen.getByDisplayValue('All Status'), 'pending');
    
    expect(screen.getByText('Casual Leave')).toBeInTheDocument();
    expect(screen.queryByText('Sick Leave')).not.toBeInTheDocument();
    expect(screen.queryByText('Vacation Leave')).not.toBeInTheDocument();
  });

  it('displays review comments for reviewed requests', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('Approved. Get well soon.')).toBeInTheDocument();
      expect(screen.getByText('Cannot approve vacation leave during exam period.')).toBeInTheDocument();
    });
  });

  it('handles half day leave display correctly', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('Feb 10, 2024 (afternoon half)')).toBeInTheDocument();
    });
  });

  it('allows cancelling pending leave requests', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    mockLeaveService.cancelLeaveRequest.mockResolvedValue({
      ...mockLeaveRequests[0],
      status: 'cancelled'
    });
    
    // Mock window.confirm to return true
    (window.confirm as any).mockReturnValue(true);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to cancel this leave request?');
    expect(mockLeaveService.cancelLeaveRequest).toHaveBeenCalledWith('leave1', 'Cancelled by teacher');
  });

  it('does not cancel leave when user cancels confirmation', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    // Mock window.confirm to return false
    (window.confirm as any).mockReturnValue(false);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockLeaveService.cancelLeaveRequest).not.toHaveBeenCalled();
  });

  it('handles cancel leave error gracefully', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    mockLeaveService.cancelLeaveRequest.mockRejectedValue({
      response: { data: { message: 'Cannot cancel this leave request' } }
    });
    
    // Mock window.confirm and alert
    (window.confirm as any).mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Cannot cancel this leave request');
    });
    
    alertSpy.mockRestore();
  });

  it('renders empty state when no leave requests exist', async () => {
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
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('No leave requests')).toBeInTheDocument();
      expect(screen.getByText("You haven't submitted any leave requests yet.")).toBeInTheDocument();
    });
  });

  it('renders empty state for filtered results', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });

    // Filter by cancelled status (no cancelled requests in mock data)
    await user.selectOptions(screen.getByDisplayValue('All Status'), 'cancelled');
    
    expect(screen.getByText('No leave requests')).toBeInTheDocument();
    expect(screen.getByText('No cancelled leave requests found.')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    const errorMessage = 'Failed to fetch leave data';
    mockLeaveService.getTeacherLeaveRequests.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    mockLeaveService.getLeaveSummary.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading leave data')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Try again');
    expect(retryButton).toBeInTheDocument();
  });

  it('refreshes data when refreshTrigger prop changes', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    const { rerender } = render(<LeaveStatus refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(mockLeaveService.getTeacherLeaveRequests).toHaveBeenCalledTimes(1);
    });

    // Change refresh trigger
    rerender(<LeaveStatus refreshTrigger={1} />);
    
    await waitFor(() => {
      expect(mockLeaveService.getTeacherLeaveRequests).toHaveBeenCalledTimes(2);
    });
  });

  it('calculates academic year correctly', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue([]);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(mockLeaveService.getTeacherLeaveRequests).toHaveBeenCalledWith('teacher1', '2023-2024');
      expect(mockLeaveService.getLeaveSummary).toHaveBeenCalledWith('teacher1', '2023-2024');
    });
  });

  it('shows only cancel button for pending requests', async () => {
    mockLeaveService.getTeacherLeaveRequests.mockResolvedValue(mockLeaveRequests);
    mockLeaveService.getLeaveSummary.mockResolvedValue(mockLeaveSummary);
    
    render(<LeaveStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('My Leave Requests')).toBeInTheDocument();
    });

    // Only pending requests should have cancel button
    const cancelButtons = screen.getAllByText('Cancel');
    expect(cancelButtons).toHaveLength(1); // Only one pending request
  });
});