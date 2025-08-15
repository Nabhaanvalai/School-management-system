import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AttendanceMarker from '../AttendanceMarker';
import { attendanceService } from '../../../services/attendanceService';

// Mock the attendance service
vi.mock('../../../services/attendanceService', () => ({
  attendanceService: {
    getTeacherClasses: vi.fn(),
    getClassStudents: vi.fn(),
    checkAttendanceExists: vi.fn(),
    markAttendance: vi.fn(),
    updateAttendance: vi.fn()
  }
}));

const mockTeacherClasses = [
  { standard: '8', section: 'A', subject: 'Mathematics' },
  { standard: '8', section: 'A', subject: 'Science' },
  { standard: '9', section: 'B', subject: 'Mathematics' }
];

const mockStudents = [
  {
    _id: 'student1',
    name: 'John Doe',
    rollNo: '001',
    standard: '8',
    section: 'A',
    status: 'active' as const,
    dateOfBirth: new Date('2010-01-01'),
    admissionDate: new Date('2020-04-01'),
    parentContact: {
      fatherName: 'Father Name',
      motherName: 'Mother Name',
      phone: '1234567890',
      email: 'parent@example.com',
      address: 'Address'
    },
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'student2',
    name: 'Jane Smith',
    rollNo: '002',
    standard: '8',
    section: 'A',
    status: 'active' as const,
    dateOfBirth: new Date('2010-02-01'),
    admissionDate: new Date('2020-04-01'),
    parentContact: {
      fatherName: 'Father Name',
      motherName: 'Mother Name',
      phone: '1234567890',
      email: 'parent@example.com',
      address: 'Address'
    },
    userId: 'user2',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('AttendanceMarker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (attendanceService.getTeacherClasses as any).mockResolvedValue(mockTeacherClasses);
    (attendanceService.getClassStudents as any).mockResolvedValue(mockStudents);
    (attendanceService.checkAttendanceExists as any).mockResolvedValue([]);
  });

  it('renders attendance marker component', async () => {
    render(<AttendanceMarker />);
    
    expect(screen.getByText('Mark Attendance')).toBeInTheDocument();
    expect(screen.getByLabelText('Class')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Academic Year')).toBeInTheDocument();
  });

  it('loads teacher classes on mount', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });
  });

  it('populates class dropdown with available classes', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      const classSelect = screen.getByLabelText('Class');
      expect(classSelect).toBeInTheDocument();
    });

    // Check if classes are populated
    const classSelect = screen.getByLabelText('Class') as HTMLSelectElement;
    fireEvent.click(classSelect);
    
    await waitFor(() => {
      expect(screen.getByText('8-A')).toBeInTheDocument();
      expect(screen.getByText('9-B')).toBeInTheDocument();
    });
  });

  it('loads students when class and subject are selected', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    // Select subject
    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(attendanceService.getClassStudents).toHaveBeenCalledWith('8-A');
      expect(attendanceService.checkAttendanceExists).toHaveBeenCalled();
    });
  });

  it('displays students in table when loaded', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('001')).toBeInTheDocument();
      expect(screen.getByText('002')).toBeInTheDocument();
    });
  });

  it('allows marking attendance for individual students', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mark first student as present
    const presentRadios = screen.getAllByLabelText(/Present/);
    fireEvent.click(presentRadios[0]);

    // Check if the radio button is selected
    expect(presentRadios[0]).toBeChecked();
  });

  it('provides mark all present functionality', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click mark all present
    const markAllPresentBtn = screen.getByText('Mark All Present');
    fireEvent.click(markAllPresentBtn);

    // Check if all present radio buttons are selected
    const presentRadios = screen.getAllByLabelText(/Present/);
    presentRadios.forEach(radio => {
      expect(radio).toBeChecked();
    });
  });

  it('provides mark all absent functionality', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click mark all absent
    const markAllAbsentBtn = screen.getByText('Mark All Absent');
    fireEvent.click(markAllAbsentBtn);

    // Check if all absent radio buttons are selected
    const absentRadios = screen.getAllByLabelText(/Absent/);
    absentRadios.forEach(radio => {
      expect(radio).toBeChecked();
    });
  });

  it('saves attendance when save button is clicked', async () => {
    (attendanceService.markAttendance as any).mockResolvedValue({
      _id: 'attendance1',
      studentId: { _id: 'student1', name: 'John Doe', rollNo: '001' },
      status: 'present'
    });

    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mark first student as present
    const presentRadios = screen.getAllByLabelText(/Present/);
    fireEvent.click(presentRadios[0]);

    // Click save button
    const saveButton = screen.getByText('Save Attendance');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(attendanceService.markAttendance).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student1',
          classId: '8-A',
          subject: 'Mathematics',
          status: 'present'
        })
      );
    });
  });

  it('displays success message after saving attendance', async () => {
    (attendanceService.markAttendance as any).mockResolvedValue({
      _id: 'attendance1',
      studentId: { _id: 'student1', name: 'John Doe', rollNo: '001' },
      status: 'present'
    });

    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mark first student as present
    const presentRadios = screen.getAllByLabelText(/Present/);
    fireEvent.click(presentRadios[0]);

    // Click save button
    const saveButton = screen.getByText('Save Attendance');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Attendance saved successfully/)).toBeInTheDocument();
    });
  });

  it('displays error message when save fails', async () => {
    (attendanceService.markAttendance as any).mockRejectedValue(
      new Error('Failed to save attendance')
    );

    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mark first student as present
    const presentRadios = screen.getAllByLabelText(/Present/);
    fireEvent.click(presentRadios[0]);

    // Click save button
    const saveButton = screen.getByText('Save Attendance');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to save attendance/)).toBeInTheDocument();
    });
  });

  it('allows adding remarks for students', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Add remarks for first student
    const remarksInputs = screen.getAllByPlaceholderText('Optional remarks');
    fireEvent.change(remarksInputs[0], { target: { value: 'Late due to traffic' } });

    expect(remarksInputs[0]).toHaveValue('Late due to traffic');
  });

  it('shows editing mode when attendance already exists', async () => {
    const existingAttendance = [
      {
        _id: 'attendance1',
        studentId: { _id: 'student1', name: 'John Doe', rollNo: '001' },
        status: 'present' as const,
        remarks: 'Already marked',
        date: new Date(),
        markedAt: new Date(),
        teacherId: { _id: 'teacher1', name: 'Teacher', employeeId: 'T001' },
        classId: '8-A',
        subject: 'Mathematics',
        academicYear: '2023-2024',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    (attendanceService.checkAttendanceExists as any).mockResolvedValue(existingAttendance);

    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('Attendance already marked - editing mode')).toBeInTheDocument();
    });
  });

  it('displays attendance statistics', async () => {
    render(<AttendanceMarker />);
    
    await waitFor(() => {
      expect(attendanceService.getTeacherClasses).toHaveBeenCalled();
    });

    // Select class and subject
    const classSelect = screen.getByLabelText('Class');
    fireEvent.change(classSelect, { target: { value: '8-A' } });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mark one student as present
    const presentRadios = screen.getAllByLabelText(/Present/);
    fireEvent.click(presentRadios[0]);

    // Check statistics
    expect(screen.getByText(/Total: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Marked: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Present: 1/)).toBeInTheDocument();
  });
});