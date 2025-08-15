import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LeaveApplication from '../LeaveApplication';
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

describe('LeaveApplication', () => {
  const user = userEvent.setup();
  const mockOnLeaveSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    });
  });

  it('renders leave application form correctly', () => {
    render(<LeaveApplication />);
    
    expect(screen.getByText('Apply for Leave')).toBeInTheDocument();
    expect(screen.getByLabelText(/Leave Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for Leave/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Application/ })).toBeInTheDocument();
  });

  it('submits casual leave application successfully', async () => {
    mockLeaveService.createLeaveRequest.mockResolvedValue(mockLeaveRequest);
    
    render(<LeaveApplication onLeaveSubmitted={mockOnLeaveSubmitted} />);
    
    // Fill out the form
    await user.selectOptions(screen.getByLabelText(/Leave Type/), 'casual');
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Personal work that requires my attention');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(mockLeaveService.createLeaveRequest).toHaveBeenCalledWith({
        leaveType: 'casual',
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        reason: 'Personal work that requires my attention',
        isHalfDay: false,
        halfDaySession: undefined,
        emergencyContact: undefined,
        attachments: []
      });
    });

    expect(screen.getByText('Leave application submitted successfully!')).toBeInTheDocument();
    expect(mockOnLeaveSubmitted).toHaveBeenCalledWith(mockLeaveRequest);
  });

  it('shows emergency contact fields for sick leave', async () => {
    render(<LeaveApplication />);
    
    await user.selectOptions(screen.getByLabelText(/Leave Type/), 'sick');
    
    await waitFor(() => {
      expect(screen.getByText('Emergency Contact Information *')).toBeInTheDocument();
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Relationship/)).toBeInTheDocument();
    });
  });

  it('handles half day leave correctly', async () => {
    mockLeaveService.createLeaveRequest.mockResolvedValue({
      ...mockLeaveRequest,
      isHalfDay: true,
      halfDaySession: 'morning',
      totalDays: 0.5
    });
    
    render(<LeaveApplication />);
    
    // Check half day option
    await user.click(screen.getByLabelText(/Half Day Leave/));
    
    // Fill start date
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    
    // End date should be disabled and auto-filled
    const endDateInput = screen.getByLabelText(/End Date/) as HTMLInputElement;
    expect(endDateInput.disabled).toBe(true);
    expect(endDateInput.value).toBe('2024-01-15');
    
    // Half day session should appear
    expect(screen.getByLabelText(/Half Day Session/)).toBeInTheDocument();
    
    await user.selectOptions(screen.getByLabelText(/Half Day Session/), 'morning');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Medical appointment in the morning');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(mockLeaveService.createLeaveRequest).toHaveBeenCalledWith({
        leaveType: 'casual',
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        reason: 'Medical appointment in the morning',
        isHalfDay: true,
        halfDaySession: 'morning',
        emergencyContact: undefined,
        attachments: []
      });
    });
  });

  it('validates required fields', async () => {
    render(<LeaveApplication />);
    
    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(screen.getByText(/Start date is required/)).toBeInTheDocument();
    });
    
    expect(mockLeaveService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('validates reason length', async () => {
    render(<LeaveApplication />);
    
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Short'); // Less than 10 characters
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(screen.getByText(/Reason must be at least 10 characters/)).toBeInTheDocument();
    });
  });

  it('validates date range', async () => {
    render(<LeaveApplication />);
    
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-10'); // End date before start date
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Valid reason for leave application');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(screen.getByText(/End date must be on or after start date/)).toBeInTheDocument();
    });
  });

  it('validates emergency contact for sick leave', async () => {
    render(<LeaveApplication />);
    
    await user.selectOptions(screen.getByLabelText(/Leave Type/), 'sick');
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Feeling unwell and need rest');
    
    // Don't fill emergency contact
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(screen.getByText(/Emergency contact name is required/)).toBeInTheDocument();
    });
  });

  it('validates emergency contact phone number', async () => {
    render(<LeaveApplication />);
    
    await user.selectOptions(screen.getByLabelText(/Leave Type/), 'emergency');
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Family emergency requiring immediate attention');
    
    // Fill emergency contact with invalid phone
    const nameInput = screen.getAllByLabelText(/Name/)[0];
    const phoneInput = screen.getByLabelText(/Phone/);
    const relationshipInput = screen.getByLabelText(/Relationship/);
    
    await user.type(nameInput, 'John Doe');
    await user.type(phoneInput, '123'); // Invalid phone number
    await user.type(relationshipInput, 'Brother');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(screen.getByText(/Emergency contact phone must be 10 digits/)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    const errorMessage = 'Failed to submit leave application';
    mockLeaveService.createLeaveRequest.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    
    render(<LeaveApplication />);
    
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Valid reason for leave application');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockLeaveService.createLeaveRequest.mockImplementation(() => new Promise(() => {}));
    
    render(<LeaveApplication />);
    
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/End Date/), '2024-01-15');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Valid reason for leave application');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    expect(screen.getByText(/Submitting.../)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submitting.../ })).toBeDisabled();
  });

  it('resets form after successful submission', async () => {
    mockLeaveService.createLeaveRequest.mockResolvedValue(mockLeaveRequest);
    
    render(<LeaveApplication />);
    
    const startDateInput = screen.getByLabelText(/Start Date/) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/End Date/) as HTMLInputElement;
    const reasonInput = screen.getByLabelText(/Reason for Leave/) as HTMLTextAreaElement;
    
    await user.type(startDateInput, '2024-01-15');
    await user.type(endDateInput, '2024-01-15');
    await user.type(reasonInput, 'Valid reason for leave application');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(screen.getByText('Leave application submitted successfully!')).toBeInTheDocument();
    });

    // Form should be reset
    expect(startDateInput.value).toBe('');
    expect(endDateInput.value).toBe('');
    expect(reasonInput.value).toBe('');
  });

  it('validates half day leave for single day only', async () => {
    render(<LeaveApplication />);
    
    await user.click(screen.getByLabelText(/Half Day Leave/));
    await user.type(screen.getByLabelText(/Start Date/), '2024-01-15');
    
    // Try to change end date (should be disabled)
    const endDateInput = screen.getByLabelText(/End Date/) as HTMLInputElement;
    expect(endDateInput.disabled).toBe(true);
    
    await user.selectOptions(screen.getByLabelText(/Half Day Session/), 'afternoon');
    await user.type(screen.getByLabelText(/Reason for Leave/), 'Afternoon appointment');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/ }));
    
    await waitFor(() => {
      expect(mockLeaveService.createLeaveRequest).toHaveBeenCalled();
    });
  });
});