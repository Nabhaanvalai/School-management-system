import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ExamScheduleViewer from '../ExamScheduleViewer';
import { examService } from '../../../services/examService';

// Mock the exam service
vi.mock('../../../services/examService');

const mockExamService = vi.mocked(examService);

const mockExamsData = [
  {
    _id: '1',
    name: 'Mid-Term Examination',
    academicYear: '2024-2025',
    startDate: new Date('2024-10-15'),
    endDate: new Date('2024-10-25'),
    type: 'mid-term' as const,
    standard: '10',
    section: 'A',
    status: 'upcoming' as const,
    instructions: [
      'Report to exam hall 15 minutes before exam time',
      'Bring your admit card and ID card',
      'Use only blue/black pen for writing',
      'Mobile phones are strictly prohibited'
    ],
    subjects: [
      {
        subject: 'Mathematics',
        date: new Date('2024-10-15'),
        startTime: '09:00',
        endTime: '12:00',
        syllabus: 'Chapters 1-5: Algebra, Geometry, Trigonometry',
        maxMarks: 100,
        examType: 'written' as const,
        venue: 'Room 101',
        instructions: 'Calculator allowed for numerical problems'
      },
      {
        subject: 'English',
        date: new Date('2024-10-17'),
        startTime: '09:00',
        endTime: '12:00',
        syllabus: 'Literature: Chapters 1-3, Grammar: Tenses, Voice, Narration',
        maxMarks: 100,
        examType: 'written' as const,
        venue: 'Room 102'
      },
      {
        subject: 'Science Practical',
        date: new Date('2024-10-21'),
        startTime: '10:00',
        endTime: '12:00',
        syllabus: 'All experiments from practical manual',
        maxMarks: 30,
        examType: 'practical' as const,
        venue: 'Science Lab',
        instructions: 'Bring lab coat and safety goggles'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '2',
    name: 'Unit Test 1',
    academicYear: '2024-2025',
    startDate: new Date('2024-09-10'),
    endDate: new Date('2024-09-15'),
    type: 'unit-test' as const,
    standard: '10',
    section: 'A',
    status: 'completed' as const,
    instructions: [
      'Duration: 1 hour per subject',
      'Syllabus covers first 2 chapters of each subject'
    ],
    subjects: [
      {
        subject: 'Mathematics',
        date: new Date('2024-09-10'),
        startTime: '09:00',
        endTime: '10:00',
        syllabus: 'Chapter 1-2: Number Systems, Polynomials',
        maxMarks: 50,
        examType: 'written' as const,
        venue: 'Room 101'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

const mockStudentClass = { standard: '10', section: 'A' };

describe('ExamScheduleViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExamService.getStudentExams.mockResolvedValue(mockExamsData);
    
    // Mock current date to October 1, 2024 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-10-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders exam schedule data after loading', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('Mid-Term Examination (2024-2025)')).toBeInTheDocument();
    expect(screen.getByText('Unit Test 1 (2024-2025)')).toBeInTheDocument();
  });

  it('displays exam details when exam is selected', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('Mid-Term Examination')).toBeInTheDocument();
    expect(screen.getByText('Academic Year: 2024-2025')).toBeInTheDocument();
    expect(screen.getByText('Class: 10 - A')).toBeInTheDocument();
    expect(screen.getByText('MID-TERM')).toBeInTheDocument();
    expect(screen.getByText('UPCOMING')).toBeInTheDocument();
  });

  it('shows countdown for upcoming exams', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    // Should show countdown (15 days from Oct 1 to Oct 15)
    expect(screen.getByText('⏰ Exam starts in 14 days')).toBeInTheDocument();
  });

  it('displays general instructions', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('📋 General Instructions')).toBeInTheDocument();
    expect(screen.getByText('Report to exam hall 15 minutes before exam time')).toBeInTheDocument();
    expect(screen.getByText('Bring your admit card and ID card')).toBeInTheDocument();
    expect(screen.getByText('Use only blue/black pen for writing')).toBeInTheDocument();
    expect(screen.getByText('Mobile phones are strictly prohibited')).toBeInTheDocument();
  });

  it('displays subject schedule with details', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('📚 Subject Schedule')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Science Practical')).toBeInTheDocument();

    // Check subject details
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('Room 102')).toBeInTheDocument();
    expect(screen.getByText('Science Lab')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM - 12:00 PM')).toBeInTheDocument();
  });

  it('shows exam type badges correctly', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('✍️ written')).toBeInTheDocument();
    expect(screen.getByText('🔬 practical')).toBeInTheDocument();
  });

  it('displays syllabus information', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('Chapters 1-5: Algebra, Geometry, Trigonometry')).toBeInTheDocument();
    expect(screen.getByText('Literature: Chapters 1-3, Grammar: Tenses, Voice, Narration')).toBeInTheDocument();
    expect(screen.getByText('All experiments from practical manual')).toBeInTheDocument();
  });

  it('shows special instructions for subjects', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('Special Instructions:')).toBeInTheDocument();
    expect(screen.getByText('Calculator allowed for numerical problems')).toBeInTheDocument();
    expect(screen.getByText('Bring lab coat and safety goggles')).toBeInTheDocument();
  });

  it('displays study tips', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('💡 Study Tips')).toBeInTheDocument();
    expect(screen.getByText('Review your notes and textbooks thoroughly')).toBeInTheDocument();
    expect(screen.getByText('Practice previous year question papers')).toBeInTheDocument();
    expect(screen.getByText('Get adequate sleep before the exam')).toBeInTheDocument();
  });

  it('handles exam selection', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    const examSelect = screen.getByDisplayValue('Mid-Term Examination (2024-2025)');
    fireEvent.change(examSelect, { target: { value: '2' } });

    expect(screen.getByDisplayValue('Unit Test 1 (2024-2025)')).toBeInTheDocument();
  });

  it('handles status filter', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'completed' } });

    expect(screen.getByDisplayValue('Completed')).toBeInTheDocument();
  });

  it('shows today indicator for current exam', async () => {
    // Set current date to exam date
    vi.setSystemTime(new Date('2024-10-15'));
    
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('(Today)')).toBeInTheDocument();
  });

  it('shows past exam styling', async () => {
    // Set current date after exam
    vi.setSystemTime(new Date('2024-10-30'));
    
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    // Past exams should have gray styling
    const pastExamCard = screen.getByText('Mathematics').closest('div');
    expect(pastExamCard).toHaveClass('border-gray-300', 'bg-gray-50');
  });

  it('handles error state', async () => {
    mockExamService.getStudentExams.mockRejectedValue(new Error('Failed to fetch'));

    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Exam Schedule')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('handles empty exam data', async () => {
    mockExamService.getStudentExams.mockResolvedValue([]);

    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('No exams found')).toBeInTheDocument();
    expect(screen.getByText('No exams match the selected criteria')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} className="custom-class" />);
    
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('calls service with correct student class', async () => {
    const testClass = { standard: '12', section: 'B' };
    render(<ExamScheduleViewer studentClass={testClass} />);
    
    await waitFor(() => {
      expect(mockExamService.getStudentExams).toHaveBeenCalledWith(testClass);
    });
  });

  it('refetches data when student class changes', async () => {
    const { rerender } = render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(mockExamService.getStudentExams).toHaveBeenCalledWith(mockStudentClass);
    });

    const newClass = { standard: '11', section: 'B' };
    rerender(<ExamScheduleViewer studentClass={newClass} />);
    
    await waitFor(() => {
      expect(mockExamService.getStudentExams).toHaveBeenCalledWith(newClass);
    });
  });

  it('formats dates correctly', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('Tuesday, 15 October 2024')).toBeInTheDocument();
    expect(screen.getByText('Thursday, 17 October 2024')).toBeInTheDocument();
  });

  it('shows max marks for each subject', async () => {
    render(<ExamScheduleViewer studentClass={mockStudentClass} />);
    
    await waitFor(() => {
      expect(screen.getByText('Exam Schedule')).toBeInTheDocument();
    });

    expect(screen.getByText('100')).toBeInTheDocument(); // Max marks for written exams
    expect(screen.getByText('30')).toBeInTheDocument(); // Max marks for practical exam
  });
});