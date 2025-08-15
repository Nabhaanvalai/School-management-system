import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ReportCard from '../ReportCard';
import { reportsService } from '../../../services/reportsService';

// Mock the reports service
vi.mock('../../../services/reportsService');

const mockReportsService = vi.mocked(reportsService);

const mockReportCardData = {
  type: 'student-report-card' as const,
  title: 'Student Report Card',
  generatedAt: new Date('2024-01-20'),
  filters: {
    reportType: 'student-report-card' as const,
    studentId: 'student1',
    academicYear: '2024-2025'
  },
  data: {
    student: {
      _id: 'student1',
      name: 'John Doe',
      rollNo: '001',
      standard: '10',
      section: 'A'
    },
    subjects: [
      {
        subject: 'Mathematics',
        marks: 85,
        maxMarks: 100,
        grade: 'A',
        teacher: 'Jane Smith'
      },
      {
        subject: 'English',
        marks: 78,
        maxMarks: 100,
        grade: 'B+',
        teacher: 'Bob Johnson'
      },
      {
        subject: 'Science',
        marks: 92,
        maxMarks: 100,
        grade: 'A+',
        teacher: 'Alice Brown'
      }
    ],
    attendance: {
      totalDays: 100,
      presentDays: 95,
      percentage: 95
    },
    overallGrade: 'A',
    rank: 3,
    totalStudents: 45
  }
};

describe('ReportCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReportsService.generateReport.mockResolvedValue(mockReportCardData);
  });

  it('renders loading state initially', () => {
    render(<ReportCard studentId="student1" />);
    
    expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders report card data after loading', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Report Card')).toBeInTheDocument();
    });

    // Check student information
    expect(screen.getByText('John Doe - Roll No: 001')).toBeInTheDocument();
    expect(screen.getByText('Class: 10 - A')).toBeInTheDocument();

    // Check overall performance summary
    expect(screen.getByText('A')).toBeInTheDocument(); // Overall grade
    expect(screen.getByText('3')).toBeInTheDocument(); // Rank
    expect(screen.getByText('out of 45')).toBeInTheDocument();
    expect(screen.getByText('95.0%')).toBeInTheDocument(); // Attendance
    expect(screen.getByText('95 of 100 days')).toBeInTheDocument();
  });

  it('displays subject-wise performance correctly', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Subject-wise Performance')).toBeInTheDocument();
    });

    // Check subjects
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();

    // Check teachers
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();

    // Check marks
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();

    // Check percentages
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    expect(screen.getByText('78.0%')).toBeInTheDocument();
    expect(screen.getByText('92.0%')).toBeInTheDocument();
  });

  it('displays correct grade colors', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Subject-wise Performance')).toBeInTheDocument();
    });

    const gradeA = screen.getAllByText('A')[1]; // Second A (first is overall grade)
    const gradeBPlus = screen.getByText('B+');
    const gradeAPlus = screen.getByText('A+');
    
    expect(gradeA).toHaveClass('text-green-600', 'bg-green-100');
    expect(gradeBPlus).toHaveClass('text-blue-600', 'bg-blue-100');
    expect(gradeAPlus).toHaveClass('text-green-600', 'bg-green-100');
  });

  it('handles academic year filter change', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Report Card')).toBeInTheDocument();
    });

    const academicYearSelect = screen.getByDisplayValue('2025-2026');
    fireEvent.change(academicYearSelect, { target: { value: '2024-2025' } });

    await waitFor(() => {
      expect(mockReportsService.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'student-report-card',
          studentId: 'student1',
          academicYear: '2024-2025'
        })
      );
    });
  });

  it('handles download PDF functionality', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Academic Report Card')).toBeInTheDocument();
    });

    const downloadButton = screen.getByText('Download PDF');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockReportsService.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'student-report-card',
          studentId: 'student1',
          format: 'pdf'
        })
      );
    });
  });

  it('handles error state', async () => {
    mockReportsService.generateReport.mockRejectedValue(new Error('Failed to fetch report'));

    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Report Card')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch report')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('handles empty report card data', async () => {
    mockReportsService.generateReport.mockResolvedValue({
      ...mockReportCardData,
      data: null
    });

    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('No report card available')).toBeInTheDocument();
      expect(screen.getByText('Report card data not found for the selected academic year')).toBeInTheDocument();
    });
  });

  it('displays performance overview with progress bars', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    });

    expect(screen.getByText('Subject-wise Percentage')).toBeInTheDocument();
    expect(screen.getByText('Grade Distribution')).toBeInTheDocument();

    // Check if progress bars are rendered (they have specific width styles)
    const progressBars = document.querySelectorAll('.bg-blue-600.h-2.rounded-full');
    expect(progressBars).toHaveLength(3); // One for each subject
  });

  it('displays grade distribution correctly', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Grade Distribution')).toBeInTheDocument();
    });

    // Check grade distribution
    expect(screen.getByText('Grade A')).toBeInTheDocument();
    expect(screen.getByText('Grade B+')).toBeInTheDocument();
    expect(screen.getByText('Grade A+')).toBeInTheDocument();
    
    expect(screen.getByText('1 subject')).toBeInTheDocument(); // For grades with 1 subject
  });

  it('calculates percentages correctly', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Subject-wise Performance')).toBeInTheDocument();
    });

    // Mathematics: 85/100 = 85.0%
    // English: 78/100 = 78.0%
    // Science: 92/100 = 92.0%
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    expect(screen.getByText('78.0%')).toBeInTheDocument();
    expect(screen.getByText('92.0%')).toBeInTheDocument();
  });

  it('calls service with correct parameters', async () => {
    render(<ReportCard studentId="student1" />);
    
    await waitFor(() => {
      expect(mockReportsService.generateReport).toHaveBeenCalledWith({
        reportType: 'student-report-card',
        studentId: 'student1',
        academicYear: expect.stringMatching(/^\d{4}-\d{4}$/)
      });
    });
  });
});