import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AcademicCalendarViewer from '../AcademicCalendarViewer';
import { calendarService } from '../../../services/calendarService';

// Mock the calendar service
vi.mock('../../../services/calendarService');

const mockCalendarService = vi.mocked(calendarService);

const mockEventsData = [
  {
    _id: '1',
    title: 'Independence Day',
    description: 'National Holiday - School Closed',
    date: new Date('2024-08-15'),
    type: 'holiday' as const,
    isMultiDay: false,
    academicYear: '2024-2025',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '2',
    title: 'Mid-term Examinations',
    description: 'Mid-term exams for all classes',
    date: new Date('2024-08-10'),
    endDate: new Date('2024-08-20'),
    type: 'exam' as const,
    isMultiDay: true,
    academicYear: '2024-2025',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '3',
    title: 'Annual Sports Day',
    description: 'Inter-house sports competition',
    date: new Date('2024-08-25'),
    type: 'sports' as const,
    isMultiDay: false,
    academicYear: '2024-2025',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

describe('AcademicCalendarViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalendarService.getEvents.mockResolvedValue(mockEventsData);
    
    // Mock current date to August 2024 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    render(<AcademicCalendarViewer />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders calendar data after loading', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    expect(screen.getByText('Independence Day')).toBeInTheDocument();
    expect(screen.getByText('Mid-term Examinations')).toBeInTheDocument();
    expect(screen.getByText('Annual Sports Day')).toBeInTheDocument();
  });

  it('displays event type legend', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    expect(screen.getByText('Holiday')).toBeInTheDocument();
    expect(screen.getByText('Exam')).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Cultural')).toBeInTheDocument();
    expect(screen.getByText('Academic')).toBeInTheDocument();
  });

  it('handles month selection', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    const monthSelect = screen.getByDisplayValue('August');
    fireEvent.change(monthSelect, { target: { value: '9' } }); // September

    await waitFor(() => {
      expect(mockCalendarService.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          month: 9,
          year: 2024
        })
      );
    });
  });

  it('handles year selection', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    const yearSelect = screen.getByDisplayValue('2024');
    fireEvent.change(yearSelect, { target: { value: '2025' } });

    await waitFor(() => {
      expect(mockCalendarService.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          month: 7, // August (0-indexed)
          year: 2025
        })
      );
    });
  });

  it('switches between calendar and list view', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    // Should start in calendar view
    expect(screen.getByText('Calendar')).toHaveClass('bg-blue-600', 'text-white');
    expect(screen.getByText('List')).toHaveClass('bg-white', 'text-gray-700');

    // Switch to list view
    const listButton = screen.getByText('List');
    fireEvent.click(listButton);

    expect(screen.getByText('List')).toHaveClass('bg-blue-600', 'text-white');
    expect(screen.getByText('Calendar')).toHaveClass('bg-white', 'text-gray-700');
  });

  it('displays events in calendar view', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    // Check for day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });

    // Check for event titles in calendar cells
    expect(screen.getByText('🏖️ Independence Day')).toBeInTheDocument();
    expect(screen.getByText('📝 Mid-term Examinations')).toBeInTheDocument();
    expect(screen.getByText('⚽ Annual Sports Day')).toBeInTheDocument();
  });

  it('displays events in list view', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    // Switch to list view
    const listButton = screen.getByText('List');
    fireEvent.click(listButton);

    // Check for event details in list format
    expect(screen.getByText('Independence Day')).toBeInTheDocument();
    expect(screen.getByText('National Holiday - School Closed')).toBeInTheDocument();
    expect(screen.getByText('Mid-term Examinations')).toBeInTheDocument();
    expect(screen.getByText('Mid-term exams for all classes')).toBeInTheDocument();
  });

  it('shows multi-day events correctly', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    // Switch to list view to see date ranges
    const listButton = screen.getByText('List');
    fireEvent.click(listButton);

    // Multi-day event should show date range
    expect(screen.getByText(/10 Aug 2024 - 20 Aug 2024/)).toBeInTheDocument();
    
    // Single day event should show single date
    expect(screen.getByText(/15 Aug 2024/)).toBeInTheDocument();
  });

  it('highlights today in calendar view', async () => {
    // Set current date to August 15, 2024
    vi.setSystemTime(new Date('2024-08-15'));
    
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    // Today's cell should have blue background
    const todayCell = screen.getByText('15').closest('div');
    expect(todayCell).toHaveClass('bg-blue-50');
  });

  it('handles error state', async () => {
    mockCalendarService.getEvents.mockRejectedValue(new Error('Failed to fetch'));

    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Calendar')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('handles empty events', async () => {
    mockCalendarService.getEvents.mockResolvedValue([]);

    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    // Switch to list view to see empty message
    const listButton = screen.getByText('List');
    fireEvent.click(listButton);

    expect(screen.getByText('No events scheduled')).toBeInTheDocument();
    expect(screen.getByText(/No events found for August 2024/)).toBeInTheDocument();
  });

  it('shows correct event type colors and icons', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    // Check for event type icons in calendar view
    expect(screen.getByText('🏖️ Independence Day')).toBeInTheDocument();
    expect(screen.getByText('📝 Mid-term Examinations')).toBeInTheDocument();
    expect(screen.getByText('⚽ Annual Sports Day')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AcademicCalendarViewer className="custom-class" />);
    
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('calls service with correct parameters', async () => {
    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(mockCalendarService.getEvents).toHaveBeenCalledWith({
        month: 7, // August (0-indexed)
        year: 2024,
        academicYear: '2024-2025'
      });
    });
  });

  it('shows more events indicator when there are many events on a day', async () => {
    // Mock data with multiple events on the same day
    const manyEventsData = [
      ...mockEventsData,
      {
        _id: '4',
        title: 'Event 4',
        description: 'Another event',
        date: new Date('2024-08-15'),
        type: 'event' as const,
        isMultiDay: false,
        academicYear: '2024-2025',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        _id: '5',
        title: 'Event 5',
        description: 'Yet another event',
        date: new Date('2024-08-15'),
        type: 'cultural' as const,
        isMultiDay: false,
        academicYear: '2024-2025',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    mockCalendarService.getEvents.mockResolvedValue(manyEventsData);

    render(<AcademicCalendarViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Calendar')).toBeInTheDocument();
    });

    // Should show "+X more" indicator when there are more than 2 events
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });
});