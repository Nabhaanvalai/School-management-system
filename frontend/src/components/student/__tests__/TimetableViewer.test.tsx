import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TimetableViewer from '../TimetableViewer';
import { timetableService } from '../../../services/timetableService';

// Mock the timetable service
vi.mock('../../../services/timetableService');

const mockTimetableService = vi.mocked(timetableService);

const mockTimetableData = {
  _id: 'timetable1',
  classId: 'class1',
  academicYear: '2024-2025',
  schedule: [
    {
      day: 'monday' as const,
      periods: [
        {
          slot: 'A1',
          subject: 'Mathematics',
          teacherId: 'teacher1',
          teacherName: 'John Smith',
          startTime: '09:00',
          endTime: '09:45'
        },
        {
          slot: 'A2',
          subject: 'English',
          teacherId: 'teacher2',
          teacherName: 'Jane Doe',
          startTime: '09:45',
          endTime: '10:30'
        }
      ]
    },
    {
      day: 'tuesday' as const,
      periods: [
        {
          slot: 'A1',
          subject: 'Science',
          teacherId: 'teacher3',
          teacherName: 'Bob Johnson',
          startTime: '09:00',
          endTime: '09:45'
        }
      ]
    }
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

describe('TimetableViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimetableService.getTimetableByClass.mockResolvedValue(mockTimetableData);
  });

  it('renders loading state initially', () => {
    render(<TimetableViewer classId="class1" />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders timetable data after loading', async () => {
    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class Timetable')).toBeInTheDocument();
    });

    expect(screen.getByText('Academic Year: 2024-2025')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('displays correct time slots', async () => {
    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class Timetable')).toBeInTheDocument();
    });

    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 09:45')).toBeInTheDocument();
    expect(screen.getByText('09:45 - 10:30')).toBeInTheDocument();
  });

  it('shows all days of the week in desktop view', async () => {
    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class Timetable')).toBeInTheDocument();
    });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    daysOfWeek.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('handles mobile day selection', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class Timetable')).toBeInTheDocument();
    });

    const daySelect = screen.getByDisplayValue('Monday');
    fireEvent.change(daySelect, { target: { value: 'tuesday' } });

    expect(screen.getByDisplayValue('Tuesday')).toBeInTheDocument();
  });

  it('displays empty slots correctly', async () => {
    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class Timetable')).toBeInTheDocument();
    });

    // Check for empty slots (should show "-")
    const emptySlots = screen.getAllByText('-');
    expect(emptySlots.length).toBeGreaterThan(0);
  });

  it('shows legend with color coding', async () => {
    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class Timetable')).toBeInTheDocument();
    });

    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Core Subjects')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('Practical')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
  });

  it('displays break time information', async () => {
    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class Timetable')).toBeInTheDocument();
    });

    expect(screen.getByText(/Break times:/)).toBeInTheDocument();
    expect(screen.getByText(/10:30-10:45 \(Tea Break\)/)).toBeInTheDocument();
    expect(screen.getByText(/12:15-13:00 \(Lunch Break\)/)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockTimetableService.getTimetableByClass.mockRejectedValue(new Error('Failed to fetch'));

    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Timetable')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('handles null timetable data', async () => {
    mockTimetableService.getTimetableByClass.mockResolvedValue(null);

    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('No timetable available')).toBeInTheDocument();
      expect(screen.getByText('Timetable has not been created for this class yet')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<TimetableViewer classId="class1" className="custom-class" />);
    
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('calls service with correct classId', async () => {
    render(<TimetableViewer classId="test-class-id" />);
    
    await waitFor(() => {
      expect(mockTimetableService.getTimetableByClass).toHaveBeenCalledWith('test-class-id');
    });
  });

  it('refetches data when classId changes', async () => {
    const { rerender } = render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(mockTimetableService.getTimetableByClass).toHaveBeenCalledWith('class1');
    });

    rerender(<TimetableViewer classId="class2" />);
    
    await waitFor(() => {
      expect(mockTimetableService.getTimetableByClass).toHaveBeenCalledWith('class2');
    });
  });

  it('assigns consistent colors to subjects', async () => {
    render(<TimetableViewer classId="class1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class Timetable')).toBeInTheDocument();
    });

    // Mathematics should have consistent color across all instances
    const mathElements = screen.getAllByText('Mathematics');
    if (mathElements.length > 1) {
      const firstMathElement = mathElements[0].closest('div');
      const secondMathElement = mathElements[1].closest('div');
      
      // Both should have the same color class
      expect(firstMathElement?.className).toEqual(secondMathElement?.className);
    }
  });
});