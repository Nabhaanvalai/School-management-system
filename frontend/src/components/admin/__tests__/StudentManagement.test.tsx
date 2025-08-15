import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentManagement } from '../StudentManagement';
import { studentService } from '../../../services/studentService';
import { Student } from '../../../types/student';

// Mock the student service
jest.mock('../../../services/studentService');
const mockStudentService = studentService as jest.Mocked<typeof studentService>;

// Mock data
const mockStudents: Student[] = [
  {
    _id: '1',
    rollNo: '001',
    name: 'John Doe',
    dateOfBirth: new Date('2010-01-01'),
    admissionDate: new Date('2020-04-01'),
    standard: '5',
    section: 'A',
    parentContact: {
      fatherName: 'Robert Doe',
      motherName: 'Jane Doe',
      phone: '1234567890',
      email: 'parent@example.com',
      address: '123 Main St',
    },
    status: 'active',
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    rollNo: '002',
    name: 'Jane Smith',
    dateOfBirth: new Date('2011-02-15'),
    admissionDate: new Date('2021-04-01'),
    standard: '4',
    section: 'B',
    parentContact: {
      fatherName: 'Mike Smith',
      motherName: 'Sarah Smith',
      phone: '0987654321',
      email: 'smith@example.com',
      address: '456 Oak Ave',
    },
    status: 'left',
    leavingDate: new Date('2023-12-01'),
    userId: 'user2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('StudentManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStudentService.getStudents.mockResolvedValue(mockStudents);
  });

  it('renders student management interface', async () => {
    render(<StudentManagement />);
    
    expect(screen.getByText('Student Management')).toBeInTheDocument();
    expect(screen.getByText('Add New Student')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('loads students on mount', async () => {
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(mockStudentService.getStudents).toHaveBeenCalledWith({});
    });
  });

  it('shows loading state initially', () => {
    render(<StudentManagement />);
    
    expect(screen.getByText('Loading students...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockStudentService.getStudents.mockRejectedValue(new Error('Failed to load'));
    
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load students')).toBeInTheDocument();
    });
  });

  it('opens add student form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Add New Student'));
    
    expect(screen.getByText('Add New Student')).toBeInTheDocument();
    expect(screen.getByLabelText('Roll Number')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);
    
    expect(screen.getByText('Edit Student')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('opens transfer modal when transfer button is clicked', async () => {
    const user = userEvent.setup();
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const transferButtons = screen.getAllByText('Transfer');
    await user.click(transferButtons[0]);
    
    expect(screen.getByText('Transfer Student')).toBeInTheDocument();
    expect(screen.getByText('Transfer John Doe to a different class')).toBeInTheDocument();
  });

  it('creates new student successfully', async () => {
    const user = userEvent.setup();
    const newStudent = { ...mockStudents[0], _id: '3', name: 'New Student' };
    mockStudentService.createStudent.mockResolvedValue(newStudent);
    
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Add New Student'));
    
    // Fill form
    await user.type(screen.getByLabelText('Roll Number'), '003');
    await user.type(screen.getByLabelText('Name'), 'New Student');
    await user.type(screen.getByLabelText('Date of Birth'), '2010-03-01');
    await user.type(screen.getByLabelText('Admission Date'), '2020-04-01');
    await user.type(screen.getByLabelText('Father\'s Name'), 'Father Name');
    await user.type(screen.getByLabelText('Mother\'s Name'), 'Mother Name');
    await user.type(screen.getByLabelText('Phone'), '1234567890');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Address'), 'Test Address');
    
    await user.click(screen.getByText('Add Student'));
    
    await waitFor(() => {
      expect(mockStudentService.createStudent).toHaveBeenCalled();
    });
  });

  it('updates student successfully', async () => {
    const user = userEvent.setup();
    const updatedStudent = { ...mockStudents[0], name: 'Updated Name' };
    mockStudentService.updateStudent.mockResolvedValue(updatedStudent);
    
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);
    
    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    
    await user.click(screen.getByText('Update Student'));
    
    await waitFor(() => {
      expect(mockStudentService.updateStudent).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('transfers student successfully', async () => {
    const user = userEvent.setup();
    const transferredStudent = { ...mockStudents[0], standard: '6', section: 'B' };
    mockStudentService.transferStudent.mockResolvedValue(transferredStudent);
    
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const transferButtons = screen.getAllByText('Transfer');
    await user.click(transferButtons[0]);
    
    await user.selectOptions(screen.getByDisplayValue('5'), '6');
    await user.selectOptions(screen.getByDisplayValue('A'), 'B');
    
    await user.click(screen.getByText('Transfer'));
    
    await waitFor(() => {
      expect(mockStudentService.transferStudent).toHaveBeenCalledWith('1', {
        standard: '6',
        section: 'B',
      });
    });
  });

  it('marks student as left successfully', async () => {
    const user = userEvent.setup();
    const leftStudent = { ...mockStudents[0], status: 'left' as const, leavingDate: new Date() };
    mockStudentService.markStudentLeft.mockResolvedValue(leftStudent);
    
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const markLeftButtons = screen.getAllByText('Mark Left');
    await user.click(markLeftButtons[0]);
    
    await user.click(screen.getByText('Mark as Left'));
    
    await waitFor(() => {
      expect(mockStudentService.markStudentLeft).toHaveBeenCalledWith('1', expect.any(String));
    });
  });

  it('archives student with confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);
    mockStudentService.archiveStudent.mockResolvedValue();
    
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const archiveButtons = screen.getAllByText('Archive');
    await user.click(archiveButtons[0]);
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to archive John Doe? This action cannot be undone.'
      );
      expect(mockStudentService.archiveStudent).toHaveBeenCalledWith('1');
    });
  });

  it('filters students when filters change', async () => {
    const user = userEvent.setup();
    render(<StudentManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Change standard filter
    await user.selectOptions(screen.getByDisplayValue('All Standards'), 'Standard 5');
    
    await waitFor(() => {
      expect(mockStudentService.getStudents).toHaveBeenCalledWith({
        standard: '5',
      });
    });
  });
});