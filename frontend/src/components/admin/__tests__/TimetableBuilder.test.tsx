import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimetableBuilder } from '../TimetableBuilder';
import { timetableService } from '../../../services/timetableService';
import { Timetable, ClassInfo, TeacherOption } from '../../../types/timetable';

// Mock the timetable service
jest.mock('../../../services/timetableService');
const mockTimetableService = timetableService as jest.Mocked<typeof timetableService>;

// Mock data
const mockClasses: ClassInfo[] = [
  { _id: 'class1', standard: '10', section: 'A', name: '10-A' },
  { _id: 'class2', standard: '10', section: 'B', name: '10-B' },
];

const mockTeachers: TeacherOption[] = [
  { _id: 'teacher1', name: 'John Smith', subjects: ['Mathematics', 'Physics'] },
  { _id: 'teacher2', name: 'Jane Doe', subjects: ['English', 'Hindi'] },
];

const mockSubjects = ['Mathematics', 'Physics', 'English', 'Hindi', 'Chemistry'];

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
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TimetableBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTimetableService.getClasses.mockResolvedValue(mockClasses);
    mockTimetableService.getTeachers.mockResolvedValue(mockTeachers);
    mockTimetableService.getAvailableSubjects.mockResolvedValue(mockSubjects);
    mockTimetableService.getTimetableByClass.mockResolvedValue(null);
  });

  it('renders timetable builder interface', async () => {
    render(<TimetableBuilder />);
    
    expect(screen.getByText('Timetable Builder')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Select a class')).toBeInTheDocument();
    });
  });

  it('loads initial data on mount', async () => {
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(mockTimetableService.getClasses).toHaveBeenCalled();
      expect(mockTimetableService.getTeachers).toHaveBeenCalled();
      expect(mockTimetableService.getAvailableSubjects).toHaveBeenCalled();
    });
  });

  it('shows loading state initially', () => {
    render(<TimetableBuilder />);
    
    expect(screen.getByText('Loading timetable builder...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockTimetableService.getClasses.mockRejectedValue(new Error('Failed to load'));
    
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load initial data')).toBeInTheDocument();
    });
  });

  it('displays class options after loading', async () => {
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('10 - A')).toBeInTheDocument();
      expect(screen.getByText('10 - B')).toBeInTheDocument();
    });
  });

  it('loads timetable when class is selected', async () => {
    const user = userEvent.setup();
    mockTimetableService.getTimetableByClass.mockResolvedValue(mockTimetable);
    
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('10 - A')).toBeInTheDocument();
    });
    
    const classSelect = screen.getByDisplayValue('');
    await user.selectOptions(classSelect, 'class1');
    
    await waitFor(() => {
      expect(mockTimetableService.getTimetableByClass).toHaveBeenCalledWith('class1');
    });
  });

  it('shows create timetable button when no timetable exists', async () => {
    const user = userEvent.setup();
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('10 - A')).toBeInTheDocument();
    });
    
    const classSelect = screen.getByDisplayValue('');
    await user.selectOptions(classSelect, 'class1');
    
    await waitFor(() => {
      expect(screen.getByText('Create Timetable')).toBeInTheDocument();
    });
  });

  it('creates new timetable when create button is clicked', async () => {
    const user = userEvent.setup();
    mockTimetableService.createTimetable.mockResolvedValue(mockTimetable);
    
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('10 - A')).toBeInTheDocument();
    });
    
    const classSelect = screen.getByDisplayValue('');
    await user.selectOptions(classSelect, 'class1');
    
    await waitFor(() => {
      expect(screen.getByText('Create Timetable')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Create Timetable'));
    
    await waitFor(() => {
      expect(mockTimetableService.createTimetable).toHaveBeenCalled();
    });
  });

  it('displays timetable grid when timetable exists', async () => {
    const user = userEvent.setup();
    mockTimetableService.getTimetableByClass.mockResolvedValue(mockTimetable);
    
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('10 - A')).toBeInTheDocument();
    });
    
    const classSelect = screen.getByDisplayValue('');
    await user.selectOptions(classSelect, 'class1');
    
    await waitFor(() => {
      expect(screen.getByText('Timetable for Class 10 - A')).toBeInTheDocument();
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
  });

  it('opens period modal when period is clicked', async () => {
    const user = userEvent.setup();
    mockTimetableService.getTimetableByClass.mockResolvedValue(mockTimetable);
    
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('10 - A')).toBeInTheDocument();
    });
    
    const classSelect = screen.getByDisplayValue('');
    await user.selectOptions(classSelect, 'class1');
    
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
    
    // Click on the Mathematics period
    await user.click(screen.getByText('Mathematics'));
    
    await waitFor(() => {
      expect(screen.getByText('Edit Period')).toBeInTheDocument();
    });
  });

  it('updates timetable when period is saved', async () => {
    const user = userEvent.setup();
    mockTimetableService.getTimetableByClass.mockResolvedValue(mockTimetable);
    mockTimetableService.updateTimetable.mockResolvedValue(mockTimetable);
    
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('10 - A')).toBeInTheDocument();
    });
    
    const classSelect = screen.getByDisplayValue('');
    await user.selectOptions(classSelect, 'class1');
    
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
    
    // Click on an empty period
    const emptyPeriod = screen.getByText('Click to add');
    await user.click(emptyPeriod);
    
    await waitFor(() => {
      expect(screen.getByText('Add Period')).toBeInTheDocument();
    });
    
    // Fill the form
    await user.selectOptions(screen.getByDisplayValue(''), 'Physics');
    await user.selectOptions(screen.getAllByDisplayValue('')[1], 'teacher1');
    
    await user.click(screen.getByText('Add Period'));
    
    await waitFor(() => {
      expect(mockTimetableService.updateTimetable).toHaveBeenCalled();
    });
  });

  it('changes academic year', async () => {
    const user = userEvent.setup();
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('2024')).toBeInTheDocument();
    });
    
    const yearSelect = screen.getByDisplayValue('2024');
    await user.selectOptions(yearSelect, '2023');
    
    expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
  });

  it('shows empty state message when no class is selected', async () => {
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('Select a class')).toBeInTheDocument();
    });
    
    // Should not show timetable content
    expect(screen.queryByText('Timetable for Class')).not.toBeInTheDocument();
  });

  it('shows no timetable message when class has no timetable', async () => {
    const user = userEvent.setup();
    render(<TimetableBuilder />);
    
    await waitFor(() => {
      expect(screen.getByText('10 - A')).toBeInTheDocument();
    });
    
    const classSelect = screen.getByDisplayValue('');
    await user.selectOptions(classSelect, 'class1');
    
    await waitFor(() => {
      expect(screen.getByText('No timetable found for this class.')).toBeInTheDocument();
      expect(screen.getByText('Click "Create Timetable" to get started.')).toBeInTheDocument();
    });
  });
});