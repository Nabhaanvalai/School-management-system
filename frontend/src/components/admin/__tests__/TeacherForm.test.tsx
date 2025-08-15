import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeacherForm } from '../TeacherForm';
import { Teacher } from '../../../types/teacher';

const mockTeacher: Teacher = {
  _id: '1',
  employeeId: 'T001',
  name: 'John Smith',
  subjects: ['Mathematics', 'Physics'],
  assignedClasses: [
    { standard: '10', section: 'A', subject: 'Mathematics' }
  ],
  salary: {
    amount: 50000,
    status: 'paid',
    lastPaidDate: new Date('2023-12-01'),
  },
  userId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TeacherForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders add teacher form correctly', () => {
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Add New Teacher')).toBeInTheDocument();
    expect(screen.getByLabelText('Employee ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Subjects')).toBeInTheDocument();
    expect(screen.getByLabelText('Salary Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Salary Status')).toBeInTheDocument();
  });

  it('renders edit teacher form with pre-filled data', () => {
    render(<TeacherForm teacher={mockTeacher} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Edit Teacher')).toBeInTheDocument();
    expect(screen.getByDisplayValue('T001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.click(screen.getByText('Add Teacher'));
    
    await waitFor(() => {
      expect(screen.getByText('Employee ID is required')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('At least one subject is required')).toBeInTheDocument();
      expect(screen.getByText('Salary amount is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates name minimum length', async () => {
    const user = userEvent.setup();
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.type(screen.getByLabelText('Name'), 'A');
    await user.click(screen.getByText('Add Teacher'));
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('validates salary amount is positive', async () => {
    const user = userEvent.setup();
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.type(screen.getByLabelText('Salary Amount'), '-1000');
    await user.click(screen.getByText('Add Teacher'));
    
    await waitFor(() => {
      expect(screen.getByText('Salary must be positive')).toBeInTheDocument();
    });
  });

  it('allows adding and removing subjects', async () => {
    const user = userEvent.setup();
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Add a subject
    await user.click(screen.getByText('+ Add Subject'));
    expect(screen.getByText('Select a subject')).toBeInTheDocument();
    
    // Select a subject
    const subjectSelect = screen.getByDisplayValue('');
    await user.selectOptions(subjectSelect, 'Mathematics');
    
    // Add another subject
    await user.click(screen.getByText('+ Add Subject'));
    const subjectSelects = screen.getAllByDisplayValue('');
    await user.selectOptions(subjectSelects[0], 'Physics');
    
    // Remove a subject
    const removeButtons = screen.getAllByText('Remove');
    await user.click(removeButtons[0]);
    
    expect(screen.getAllByText('Remove')).toHaveLength(1);
  });

  it('submits form with valid data for new teacher', async () => {
    const user = userEvent.setup();
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill all required fields
    await user.type(screen.getByLabelText('Employee ID'), 'T001');
    await user.type(screen.getByLabelText('Name'), 'John Smith');
    
    // Add subject
    await user.click(screen.getByText('+ Add Subject'));
    await user.selectOptions(screen.getByDisplayValue(''), 'Mathematics');
    
    await user.type(screen.getByLabelText('Salary Amount'), '50000');
    await user.selectOptions(screen.getByLabelText('Salary Status'), 'paid');
    
    await user.click(screen.getByText('Add Teacher'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        employeeId: 'T001',
        name: 'John Smith',
        subjects: ['Mathematics'],
        salary: {
          amount: 50000,
          status: 'paid',
        },
      });
    });
  });

  it('submits form with valid data for existing teacher', async () => {
    const user = userEvent.setup();
    render(<TeacherForm teacher={mockTeacher} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByDisplayValue('John Smith');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    
    await user.click(screen.getByText('Update Teacher'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.click(screen.getByText('Cancel'));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText('Employee ID'), 'T001');
    await user.type(screen.getByLabelText('Name'), 'John Smith');
    await user.click(screen.getByText('+ Add Subject'));
    await user.selectOptions(screen.getByDisplayValue(''), 'Mathematics');
    await user.type(screen.getByLabelText('Salary Amount'), '50000');
    
    await user.click(screen.getByText('Add Teacher'));
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();
  });

  it('handles form submission errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSubmit.mockRejectedValue(new Error('Submission failed'));
    
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText('Employee ID'), 'T001');
    await user.type(screen.getByLabelText('Name'), 'John Smith');
    await user.click(screen.getByText('+ Add Subject'));
    await user.selectOptions(screen.getByDisplayValue(''), 'Mathematics');
    await user.type(screen.getByLabelText('Salary Amount'), '50000');
    
    await user.click(screen.getByText('Add Teacher'));
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
    });
    
    consoleError.mockRestore();
  });

  it('displays all available subjects in dropdown', () => {
    render(<TeacherForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Add a subject to see the dropdown
    fireEvent.click(screen.getByText('+ Add Subject'));
    
    const subjectSelect = screen.getByDisplayValue('');
    const expectedSubjects = [
      'Mathematics', 'English', 'Science', 'Social Studies', 'Hindi',
      'Physics', 'Chemistry', 'Biology', 'Computer Science', 
      'Physical Education', 'Art', 'Music'
    ];
    
    expectedSubjects.forEach(subject => {
      expect(subjectSelect.querySelector(`option[value="${subject}"]`)).toBeInTheDocument();
    });
  });
});