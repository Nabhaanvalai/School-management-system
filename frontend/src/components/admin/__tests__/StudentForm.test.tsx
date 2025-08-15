import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentForm } from '../StudentForm';
import { Student } from '../../../types/student';

const mockStudent: Student = {
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
};

describe('StudentForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders add student form correctly', () => {
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Add New Student')).toBeInTheDocument();
    expect(screen.getByLabelText('Roll Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByLabelText('Admission Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Standard')).toBeInTheDocument();
    expect(screen.getByLabelText('Section')).toBeInTheDocument();
    expect(screen.getByLabelText('Father\'s Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Mother\'s Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
  });

  it('renders edit student form with pre-filled data', () => {
    render(<StudentForm student={mockStudent} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Edit Student')).toBeInTheDocument();
    expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Robert Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('parent@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.click(screen.getByText('Add Student'));
    
    await waitFor(() => {
      expect(screen.getByText('Roll number is required')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Admission date is required')).toBeInTheDocument();
      expect(screen.getByText('Father name is required')).toBeInTheDocument();
      expect(screen.getByText('Mother name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Address is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates phone number format', async () => {
    const user = userEvent.setup();
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.type(screen.getByLabelText('Phone'), '123');
    await user.click(screen.getByText('Add Student'));
    
    await waitFor(() => {
      expect(screen.getByText('Phone must be 10 digits')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.click(screen.getByText('Add Student'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  it('validates name minimum length', async () => {
    const user = userEvent.setup();
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.type(screen.getByLabelText('Name'), 'A');
    await user.click(screen.getByText('Add Student'));
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('submits form with valid data for new student', async () => {
    const user = userEvent.setup();
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill all required fields
    await user.type(screen.getByLabelText('Roll Number'), '001');
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Date of Birth'), '2010-01-01');
    await user.type(screen.getByLabelText('Admission Date'), '2020-04-01');
    await user.selectOptions(screen.getByLabelText('Standard'), '5');
    await user.selectOptions(screen.getByLabelText('Section'), 'A');
    await user.type(screen.getByLabelText('Father\'s Name'), 'Robert Doe');
    await user.type(screen.getByLabelText('Mother\'s Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Phone'), '1234567890');
    await user.type(screen.getByLabelText('Email'), 'parent@example.com');
    await user.type(screen.getByLabelText('Address'), '123 Main St');
    
    await user.click(screen.getByText('Add Student'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        rollNo: '001',
        name: 'John Doe',
        dateOfBirth: '2010-01-01',
        admissionDate: '2020-04-01',
        standard: '5',
        section: 'A',
        parentContact: {
          fatherName: 'Robert Doe',
          motherName: 'Jane Doe',
          phone: '1234567890',
          email: 'parent@example.com',
          address: '123 Main St',
        },
      });
    });
  });

  it('submits form with valid data for existing student', async () => {
    const user = userEvent.setup();
    render(<StudentForm student={mockStudent} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    
    await user.click(screen.getByText('Update Student'));
    
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
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.click(screen.getByText('Cancel'));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText('Roll Number'), '001');
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Date of Birth'), '2010-01-01');
    await user.type(screen.getByLabelText('Admission Date'), '2020-04-01');
    await user.type(screen.getByLabelText('Father\'s Name'), 'Robert Doe');
    await user.type(screen.getByLabelText('Mother\'s Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Phone'), '1234567890');
    await user.type(screen.getByLabelText('Email'), 'parent@example.com');
    await user.type(screen.getByLabelText('Address'), '123 Main St');
    
    await user.click(screen.getByText('Add Student'));
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();
  });

  it('handles form submission errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSubmit.mockRejectedValue(new Error('Submission failed'));
    
    render(<StudentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText('Roll Number'), '001');
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Date of Birth'), '2010-01-01');
    await user.type(screen.getByLabelText('Admission Date'), '2020-04-01');
    await user.type(screen.getByLabelText('Father\'s Name'), 'Robert Doe');
    await user.type(screen.getByLabelText('Mother\'s Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Phone'), '1234567890');
    await user.type(screen.getByLabelText('Email'), 'parent@example.com');
    await user.type(screen.getByLabelText('Address'), '123 Main St');
    
    await user.click(screen.getByText('Add Student'));
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
    });
    
    consoleError.mockRestore();
  });
});