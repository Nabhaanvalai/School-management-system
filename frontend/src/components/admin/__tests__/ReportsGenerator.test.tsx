import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportsGenerator } from '../ReportsGenerator';
import { reportsService } from '../../../services/reportsService';
import { ReportData } from '../../../types/reports';

// Mock the reports service
jest.mock('../../../services/reportsService');
const mockReportsService = reportsService as jest.Mocked<typeof reportsService>;

// Mock data
const mockReportData: ReportData = {
  type: 'student-report-card',
  title: 'Student Report Card',
  generatedAt: new Date(),
  filters: {
    reportType: 'student-report-card',
    academicYear: '2024',
    studentId: 'student1',
  },
  data: {
    student: {
      _id: 'student1',
      name: 'John Doe',
      rollNo: '001',
      standard: '10',
      section: 'A',
    },
    subjects: [
      {
        subject: 'Mathematics',
        marks: 85,
        maxMarks: 100,
        grade: 'A',
        teacher: 'John Smith',
      },
    ],
    attendance: {
      totalDays: 200,
      presentDays: 180,
      percentage: 90,
    },
    overallGrade: 'A',
    rank: 5,
    totalStudents: 30,
  },
};

describe('ReportsGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reports generator interface', () => {
    render(<ReportsGenerator />);
    
    expect(screen.getByText('Reports Generator')).toBeInTheDocument();
    expect(screen.getByText('Select Report Type')).toBeInTheDocument();
    expect(screen.getByText('Student Report Card')).toBeInTheDocument();
  });

  it('displays all report types', () => {
    render(<ReportsGenerator />);
    
    const reportTypes = [
      'Student Report Card',
      'Class Performance',
      'Attendance Summary',
      'Student Count Report',
      'Teacher Assignments',
      'Fee Status Report',
      'Salary Status Report',
    ];

    reportTypes.forEach(type => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });

  it('selects report type when clicked', async () => {
    const user = userEvent.setup();
    render(<ReportsGenerator />);
    
    await user.click(screen.getByText('Class Performance'));
    
    const classPerformanceCard = screen.getByText('Class Performance').closest('div');
    expect(classPerformanceCard).toHaveClass('bg-blue-100', 'border-blue-500');
  });

  it('shows appropriate filters for selected report type', async () => {
    const user = userEvent.setup();
    render(<ReportsGenerator />);
    
    // Default is student report card
    expect(screen.getByText('Student ID')).toBeInTheDocument();
    
    // Switch to attendance summary
    await user.click(screen.getByText('Attendance Summary'));
    
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('generates report when generate button is clicked', async () => {
    const user = userEvent.setup();
    mockReportsService.generateReport.mockResolvedValue(mockReportData);
    
    render(<ReportsGenerator />);
    
    await user.click(screen.getByText('Generate Report'));
    
    await waitFor(() => {
      expect(mockReportsService.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'student-report-card',
        })
      );
    });
  });

  it('displays report data after generation', async () => {
    const user = userEvent.setup();
    mockReportsService.generateReport.mockResolvedValue(mockReportData);
    
    render(<ReportsGenerator />);
    
    await user.click(screen.getByText('Generate Report'));
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
  });

  it('shows loading state during report generation', async () => {
    const user = userEvent.setup();
    mockReportsService.generateReport.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockReportData), 100))
    );
    
    render(<ReportsGenerator />);
    
    await user.click(screen.getByText('Generate Report'));
    
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByText('Generating report...')).toBeInTheDocument();
  });

  it('handles error during report generation', async () => {
    const user = userEvent.setup();
    mockReportsService.generateReport.mockRejectedValue(new Error('Failed to generate'));
    
    render(<ReportsGenerator />);
    
    await user.click(screen.getByText('Generate Report'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to generate report')).toBeInTheDocument();
    });
  });

  it('exports report as PDF', async () => {
    const user = userEvent.setup();
    mockReportsService.generateReport.mockResolvedValue(mockReportData);
    mockReportsService.downloadReport.mockResolvedValue();
    
    render(<ReportsGenerator />);
    
    await user.click(screen.getByText('Generate Report'));
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Export PDF'));
    
    await waitFor(() => {
      expect(mockReportsService.downloadReport).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'pdf' }),
        expect.stringContaining('.pdf')
      );
    });
  });

  it('exports report as Excel', async () => {
    const user = userEvent.setup();
    mockReportsService.generateReport.mockResolvedValue(mockReportData);
    mockReportsService.downloadReport.mockResolvedValue();
    
    render(<ReportsGenerator />);
    
    await user.click(screen.getByText('Generate Report'));
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Export Excel'));
    
    await waitFor(() => {
      expect(mockReportsService.downloadReport).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'excel' }),
        expect.stringContaining('.xlsx')
      );
    });
  });

  it('disables export buttons when no report is generated', () => {
    render(<ReportsGenerator />);
    
    const pdfButton = screen.getByText('Export PDF');
    const excelButton = screen.getByText('Export Excel');
    
    expect(pdfButton).toBeDisabled();
    expect(excelButton).toBeDisabled();
  });

  it('shows empty state message when no report is generated', () => {
    render(<ReportsGenerator />);
    
    expect(screen.getByText('No report generated yet')).toBeInTheDocument();
    expect(screen.getByText('Configure filters and click "Generate Report" to get started')).toBeInTheDocument();
  });

  it('updates filters when academic year is changed', async () => {
    const user = userEvent.setup();
    render(<ReportsGenerator />);
    
    const yearSelect = screen.getByDisplayValue('2024');
    await user.selectOptions(yearSelect, '2023');
    
    expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
  });

  it('updates filters when format is changed', async () => {
    const user = userEvent.setup();
    render(<ReportsGenerator />);
    
    const formatSelect = screen.getByDisplayValue('PDF');
    await user.selectOptions(formatSelect, 'Excel');
    
    expect(screen.getByDisplayValue('Excel')).toBeInTheDocument();
  });

  it('clears report data when report type changes', async () => {
    const user = userEvent.setup();
    mockReportsService.generateReport.mockResolvedValue(mockReportData);
    
    render(<ReportsGenerator />);
    
    // Generate a report
    await user.click(screen.getByText('Generate Report'));
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Change report type
    await user.click(screen.getByText('Class Performance'));
    
    // Report data should be cleared
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('No report generated yet')).toBeInTheDocument();
  });

  it('handles export errors gracefully', async () => {
    const user = userEvent.setup();
    mockReportsService.generateReport.mockResolvedValue(mockReportData);
    mockReportsService.downloadReport.mockRejectedValue(new Error('Export failed'));
    
    render(<ReportsGenerator />);
    
    await user.click(screen.getByText('Generate Report'));
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Export PDF'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to export report')).toBeInTheDocument();
    });
  });
});