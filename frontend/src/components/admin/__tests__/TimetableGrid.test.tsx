import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimetableGrid } from '../TimetableGrid';
import { Timetable, TimeSlot } from '../../../types/timetable';

const mockTimeSlots: TimeSlot[] = [
  { slot: 'A1', startTime: '08:00', endTime: '08:45' },
  { slot: 'A2', startTime: '08:45', endTime: '09:30' },
  { slot: 'B1', startTime: '09:45', endTime: '10:30' },
];

const mockTimetable: Timetable = {
  _id: 'timetable1',
  classId: 'class1',
  academicYear: '2024',
  schedule: [
    {
      day: 'monday',
      periods: [
        {
          slot: 'A1',
          subject: 'Mathematics',
          teacherId: 'teacher1',
          teacherName: 'John Smith',
          startTime: '08:00',
          endTime: '08:45',
        },
        {
          slot: 'A2',
          subject: '',
          teacherId: '',
          startTime: '08:45',
          endTime: '09:30',
        },
        {
          slot: 'B1',
          subject: 'Physics',
          teacherId: 'teacher2',
          teacherName: 'Jane Doe',
          startTime: '09:45',
          endTime: '10:30',
        },
      ],
    },
    {
      day: 'tuesday',
      periods: [
        {
          slot: 'A1',
          subject: 'English',
          teacherId: 'teacher3',
          teacherName: 'Bob Wilson',
          startTime: '08:00',
          endTime: '08:45',
        },
        {
          slot: 'A2',
          subject: '',
          teacherId: '',
          startTime: '08:45',
          endTime: '09:30',
        },
        {
          slot: 'B1',
          subject: '',
          teacherId: '',
          startTime: '09:45',
          endTime: '10:30',
        },
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TimetableGrid', () => {
  const mockOnPeriodClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timetable grid with days and time slots', () => {
    render(
      <TimetableGrid
        timetable={mockTimetable}
        timeSlots={mockTimeSlots}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    // Check day headers
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
    expect(screen.getByText('Thursday')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();

    // Check time slots
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
  });

  it('displays formatted time correctly', () => {
    render(
      <TimetableGrid
        timetable={mockTimetable}
        timeSlots={mockTimeSlots}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    expect(screen.getByText('8:00 AM - 8:45 AM')).toBeInTheDocument();
    expect(screen.getByText('8:45 AM - 9:30 AM')).toBeInTheDocument();
    expect(screen.getByText('9:45 AM - 10:30 AM')).toBeInTheDocument();
  });

  it('displays subjects and teachers for filled periods', () => {
    render(
      <TimetableGrid
        timetable={mockTimetable}
        timeSlots={mockTimeSlots}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('displays empty period placeholders', () => {
    render(
      <TimetableGrid
        timetable={mockTimetable}
        timeSlots={mockTimeSlots}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const emptyPeriods = screen.getAllByText('Click to add');
    expect(emptyPeriods.length).toBeGreaterThan(0);
    
    const periodLabels = screen.getAllByText('period');
    expect(periodLabels.length).toBeGreaterThan(0);
  });

  it('calls onPeriodClick when a period is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TimetableGrid
        timetable={mockTimetable}
        timeSlots={mockTimeSlots}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    // Click on Mathematics period (Monday, A1)
    await user.click(screen.getByText('Mathematics'));

    expect(mockOnPeriodClick).toHaveBeenCalledWith('monday', 0);
  });

  it('calls onPeriodClick when empty period is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TimetableGrid
        timetable={mockTimetable}
        timeSlots={mockTimeSlots}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    // Click on an empty period
    const emptyPeriods = screen.getAllByText('Click to add');
    await user.click(emptyPeriods[0]);

    expect(mockOnPeriodClick).toHaveBeenCalled();
  });

  it('applies correct styling for filled and empty periods', () => {
    render(
      <TimetableGrid
        timetable={mockTimetable}
        timeSlots={mockTimeSlots}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    // Find the Mathematics period cell
    const mathCell = screen.getByText('Mathematics').closest('td');
    expect(mathCell).toHaveClass('bg-blue-50');

    // Find an empty period cell
    const emptyCell = screen.getAllByText('Click to add')[0].closest('td');
    expect(emptyCell).toHaveClass('bg-gray-50');
  });

  it('handles missing teacher name gracefully', () => {
    const timetableWithoutTeacherName: Timetable = {
      ...mockTimetable,
      schedule: [
        {
          day: 'monday',
          periods: [
            {
              slot: 'A1',
              subject: 'Mathematics',
              teacherId: 'teacher1',
              // No teacherName
              startTime: '08:00',
              endTime: '08:45',
            },
          ],
        },
      ],
    };

    render(
      <TimetableGrid
        timetable={timetableWithoutTeacherName}
        timeSlots={[mockTimeSlots[0]]}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Unknown Teacher')).toBeInTheDocument();
  });

  it('renders correct number of rows and columns', () => {
    render(
      <TimetableGrid
        timetable={mockTimetable}
        timeSlots={mockTimeSlots}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    // Should have header row + 3 time slot rows
    const rows = screen.getByRole('table').querySelectorAll('tr');
    expect(rows).toHaveLength(4); // 1 header + 3 time slots

    // Each row should have 6 columns (1 time + 5 days)
    const headerCells = rows[0].querySelectorAll('th');
    expect(headerCells).toHaveLength(6);
  });

  it('handles periods with only subject but no teacher', () => {
    const timetableWithIncompleteData: Timetable = {
      ...mockTimetable,
      schedule: [
        {
          day: 'monday',
          periods: [
            {
              slot: 'A1',
              subject: 'Mathematics',
              teacherId: '', // No teacher assigned
              startTime: '08:00',
              endTime: '08:45',
            },
          ],
        },
      ],
    };

    render(
      <TimetableGrid
        timetable={timetableWithIncompleteData}
        timeSlots={[mockTimeSlots[0]]}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    // Should show as empty period since no teacher is assigned
    expect(screen.getByText('Click to add')).toBeInTheDocument();
  });

  it('handles periods with teacher but no subject', () => {
    const timetableWithIncompleteData: Timetable = {
      ...mockTimetable,
      schedule: [
        {
          day: 'monday',
          periods: [
            {
              slot: 'A1',
              subject: '', // No subject
              teacherId: 'teacher1',
              teacherName: 'John Smith',
              startTime: '08:00',
              endTime: '08:45',
            },
          ],
        },
      ],
    };

    render(
      <TimetableGrid
        timetable={timetableWithIncompleteData}
        timeSlots={[mockTimeSlots[0]]}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    // Should show as empty period since no subject is assigned
    expect(screen.getByText('Click to add')).toBeInTheDocument();
  });
});