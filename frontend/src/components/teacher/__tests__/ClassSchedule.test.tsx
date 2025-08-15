import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClassSchedule from '../ClassSchedule';
import { timetableService } from '../../../services/timetableService';
import { useAuth } from '../../../context/AuthContext';

// Mock the services and context
vi.mock('../../../services/timetableService');
vi.mock('../../../context/AuthContext');

const mockTimetableService = vi.mocked(timetableService);
const mockUseAuth = vi.mocked(useAuth);

const mockTimetables = [
  {
    _id: 'timetable1',
    classId: 'class1',
    academicYear: '2023-2024',
    schedule: [
      {
        day: 'monday' as const,
        periods: [
          {
            slot: 'A1',
            subject: 'Mathematics',
            teacherId: 'teacher1',
            teacherName: 'John Doe',
            startTime: '08:00',
            endTime: '08:45'
          },
          {
            slot: 'B1',
            subject: 'Physics',
            teacherId: 'teacher1',
            teacherName: 'John Doe',
            startTime: '08:45',
            endTime: '09:30'
          }
        ]
      },
      {
        day: 'tuesday' as const,
        periods: [
          {
            slot: 'A1',
            subject: 'Chemistry',
            teacherId: 'teacher1',
            teacherName: 'John Doe',
            startTime: '08:00',
            endTime: '08:45'
          }
        ]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

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

describe('ClassSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    });
  });

  it('renders loading state initially', () => {
    mockTimetableService.getTeacherTimetable.mockImplementation(() => new Promise(() => {}));
    
    render(<ClassSchedule />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders timetable data correctly', async () => {
    mockTimetableService.getTeacherTimetable.mockResolvedValue(mockTimetables);
    
    render(<ClassSchedule />);
    
    await waitFor(() => {
      expect(screen.getByText('My Class Schedule')).toBeInTheDocument();
    });

    // Check if subjects are displayed
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('Chemistry')).toBeInTheDocument();

    // Check if time slots are displayed
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('08:00 - 08:45')).toBeInTheDocument();
    expect(screen.getByText('08:45 - 09:30')).toBeInTheDocument();

    // Check if days are displayed
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
  });

  it('renders empty state when no timetables available', async () => {
    mockTimetableService.getTeacherTimetable.mockResolvedValue([]);
    
    render(<ClassSchedule />);
    
    await waitFor(() => {
      expect(screen.getByText('No schedule available')).toBeInTheDocument();
    });

    expect(screen.getByText("Your class schedule hasn't been created yet.")).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    const errorMessage = 'Failed to fetch timetable';
    mockTimetableService.getTeacherTimetable.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    
    render(<ClassSchedule />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading timetable')).toBeInTheDocument();
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('allows retrying after error', async () => {
    const errorMessage = 'Failed to fetch timetable';
    mockTimetableService.getTeacherTimetable
      .mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      })
      .mockResolvedValueOnce(mockTimetables);
    
    render(<ClassSchedule />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading timetable')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('My Class Schedule')).toBeInTheDocument();
    });

    expect(mockTimetableService.getTeacherTimetable).toHaveBeenCalledTimes(2);
  });

  it('navigates between weeks correctly', async () => {
    mockTimetableService.getTeacherTimetable.mockResolvedValue(mockTimetables);
    
    render(<ClassSchedule />);
    
    await waitFor(() => {
      expect(screen.getByText('My Class Schedule')).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText('Next week');
    const prevButton = screen.getByLabelText('Previous week');
    
    fireEvent.click(nextButton);
    fireEvent.click(prevButton);
    
    // Should still show the schedule
    expect(screen.getByText('My Class Schedule')).toBeInTheDocument();
  });

  it('navigates to current week when Today button is clicked', async () => {
    mockTimetableService.getTeacherTimetable.mockResolvedValue(mockTimetables);
    
    render(<ClassSchedule />);
    
    await waitFor(() => {
      expect(screen.getByText('My Class Schedule')).toBeInTheDocument();
    });

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);
    
    // Should still show the schedule
    expect(screen.getByText('My Class Schedule')).toBeInTheDocument();
  });

  it('uses provided teacherId prop when available', async () => {
    const customTeacherId = 'teacher2';
    mockTimetableService.getTeacherTimetable.mockResolvedValue(mockTimetables);
    
    render(<ClassSchedule teacherId={customTeacherId} />);
    
    await waitFor(() => {
      expect(mockTimetableService.getTeacherTimetable).toHaveBeenCalledWith(customTeacherId);
    });
  });

  it('displays free periods correctly', async () => {
    const timetableWithGaps = [{
      ...mockTimetables[0],
      schedule: [
        {
          day: 'monday' as const,
          periods: [
            {
              slot: 'A1',
              subject: 'Mathematics',
              teacherId: 'teacher1',
              teacherName: 'John Doe',
              startTime: '08:00',
              endTime: '08:45'
            }
            // B1 slot is missing - should show as "Free"
          ]
        }
      ]
    }];

    mockTimetableService.getTeacherTimetable.mockResolvedValue(timetableWithGaps);
    
    render(<ClassSchedule />);
    
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });

    // Should show "Free" for empty slots
    expect(screen.getAllByText('Free')).toHaveLength(39); // 8 slots * 5 days - 1 occupied slot
  });

  it('handles network error gracefully', async () => {
    mockTimetableService.getTeacherTimetable.mockRejectedValue(new Error('Network error'));
    
    render(<ClassSchedule />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading timetable')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch timetable')).toBeInTheDocument();
  });
});