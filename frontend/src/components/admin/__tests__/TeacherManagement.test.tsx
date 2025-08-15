import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeacherManagement } from '../TeacherManagement';
import { teacherService } from '../../../services/teacherService';
import { Teacher } from '../../../types/teacher';

// Mock the teacher service
jest.mock('../../../services/teacherService');
const mockTeacherService = teacherService as jest.Mocked<typeof teacherService>;

// Mock data
const mockTeachers: Teacher[] = [
  {
    _id: '1',
    employeeId: 'T001',
    name: 'John Smith',
    subjects: ['Mathematics', 'Physics'],
    assignedClasses: [
      { standard: '10', section: 'A', subject: 'Mathematics' },
      { standard: '11', section: 'B', subject: 'Physics' }
    ],
    salary: {
      amount: 50000,
      status: 'paid',
      lastPaidDate: new Date('2023-12-01'),
    },
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    employeeId: 'T002',
    name: 'Jane Doe',
    subjects: ['English', 'Hindi'],
    assignedClasses: [],
    salary: {
      amount: 45000,
      status: 'unpaid',
    },
    userId: 'user2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('TeacherManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTeacherService.getTeachers.mockResolvedValue(mockTeachers);
  });

  it('renders teacher management interface', async () => {
    render(<TeacherManagement />);
    
    expect(screen.getByText('Teacher Management')).toBeInTheDocument();
    expect(screen.getByText('Add New Teacher')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('loads teachers on mount', async () => {
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(mockTeacherService.getTeachers).toHaveBeenCalledWith({});
    });
  });

  it('shows loading state initially', () => {
    render(<TeacherManagement />);
    
    expect(screen.getByText('Loading teachers...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockTeacherService.getTeachers.mockRejectedValue(new Error('Failed to load'));
    
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load teachers')).toBeInTheDocument();
    });
  });

  it('opens add teacher form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Add New Teacher'));
    
    expect(screen.getByText('Add New Teacher')).toBeInTheDocument();
    expect(screen.getByLabelText('Employee ID')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);
    
    expect(screen.getByText('Edit Teacher')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Smith')).toBeInTheDocument();
  });

  it('opens assignment modal when assign button is clicked', async () => {
    const user = userEvent.setup();
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    const assignButtons = screen.getAllByText('Assign Classes');
    await user.click(assignButtons[0]);
    
    expect(screen.getByText('Assign Classes to John Smith')).toBeInTheDocument();
  });

  it('opens salary modal when update salary button is clicked', async () => {
    const user = userEvent.setup();
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    const salaryButtons = screen.getAllByText('Update Salary');
    await user.click(salaryButtons[0]);
    
    expect(screen.getByText('Update Salary - John Smith')).toBeInTheDocument();
  });

  it('creates new teacher successfully', async () => {
    const user = userEvent.setup();
    const newTeacher = { ...mockTeachers[0], _id: '3', name: 'New Teacher' };
    mockTeacherService.createTeacher.mockResolvedValue(newTeacher);
    
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Add New Teacher'));
    
    // Fill form
    await user.type(screen.getByLabelText('Employee ID'), 'T003');
    await user.type(screen.getByLabelText('Name'), 'New Teacher');
    await user.click(screen.getByText('+ Add Subject'));
    await user.selectOptions(screen.getByDisplayValue(''), 'Mathematics');
    await user.type(screen.getByLabelText('Salary Amount'), '40000');
    
    await user.click(screen.getByText('Add Teacher'));
    
    await waitFor(() => {
      expect(mockTeacherService.createTeacher).toHaveBeenCalled();
    });
  });

  it('updates teacher successfully', async () => {
    const user = userEvent.setup();
    const updatedTeacher = { ...mockTeachers[0], name: 'Updated Name' };
    mockTeacherService.updateTeacher.mockResolvedValue(updatedTeacher);
    
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);
    
    const nameInput = screen.getByDisplayValue('John Smith');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    
    await user.click(screen.getByText('Update Teacher'));
    
    await waitFor(() => {
      expect(mockTeacherService.updateTeacher).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('assigns teacher to classes successfully', async () => {
    const user = userEvent.setup();
    const assignedTeacher = { ...mockTeachers[0] };
    mockTeacherService.assignTeacherToClass.mockResolvedValue(assignedTeacher);
    
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    const assignButtons = screen.getAllByText('Assign Classes');
    await user.click(assignButtons[0]);
    
    await user.click(screen.getByText('Update Assignments'));
    
    await waitFor(() => {
      expect(mockTeacherService.assignTeacherToClass).toHaveBeenCalledWith('1', expect.any(Array));
    });
  });

  it('updates salary successfully', async () => {
    const user = userEvent.setup();
    const updatedTeacher = { ...mockTeachers[0] };
    mockTeacherService.updateSalaryStatus.mockResolvedValue(updatedTeacher);
    
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    const salaryButtons = screen.getAllByText('Update Salary');
    await user.click(salaryButtons[0]);
    
    await user.clear(screen.getByDisplayValue('50000'));
    await user.type(screen.getByDisplayValue(''), '55000');
    
    await user.click(screen.getByText('Update Salary'));
    
    await waitFor(() => {
      expect(mockTeacherService.updateSalaryStatus).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('deletes teacher with confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);
    mockTeacherService.deleteTeacher.mockResolvedValue();
    
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete John Smith? This action cannot be undone.'
      );
      expect(mockTeacherService.deleteTeacher).toHaveBeenCalledWith('1');
    });
  });

  it('filters teachers when filters change', async () => {
    const user = userEvent.setup();
    render(<TeacherManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Change subject filter
    await user.selectOptions(screen.getByDisplayValue('All Subjects'), 'Mathematics');
    
    await waitFor(() => {
      expect(mockTeacherService.getTeachers).toHaveBeenCalledWith({
        subject: 'Mathematics',
      });
    });
  });
});