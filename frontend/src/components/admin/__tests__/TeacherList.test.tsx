import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeacherList } from '../TeacherList';
import { Teacher } from '../../../types/teacher';

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

describe('TeacherList', () => {
  const mockOnEdit = jest.fn();
  const mockOnAssign = jest.fn();
  const mockOnUpdateSalary = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders teacher list correctly', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('ID: T001')).toBeInTheDocument();
    expect(screen.getByText('ID: T002')).toBeInTheDocument();
  });

  it('displays teacher subjects as badges', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Hindi')).toBeInTheDocument();
  });

  it('displays class assignments correctly', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('10-A (Mathematics)')).toBeInTheDocument();
    expect(screen.getByText('11-B (Physics)')).toBeInTheDocument();
    expect(screen.getByText('No assignments')).toBeInTheDocument();
  });

  it('displays salary information correctly', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('₹50,000')).toBeInTheDocument();
    expect(screen.getByText('₹45,000')).toBeInTheDocument();
    
    const paidStatus = screen.getByText('paid');
    const unpaidStatus = screen.getByText('unpaid');
    
    expect(paidStatus).toHaveClass('bg-green-100', 'text-green-800');
    expect(unpaidStatus).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('shows last paid date for paid salaries', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/Last paid: 12\/1\/2023/)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTeachers[0]);
  });

  it('calls onAssign when assign classes button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    const assignButtons = screen.getAllByText('Assign Classes');
    await user.click(assignButtons[0]);

    expect(mockOnAssign).toHaveBeenCalledWith(mockTeachers[0]);
  });

  it('calls onUpdateSalary when update salary button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    const salaryButtons = screen.getAllByText('Update Salary');
    await user.click(salaryButtons[0]);

    expect(mockOnUpdateSalary).toHaveBeenCalledWith(mockTeachers[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTeachers[0]);
  });

  it('shows empty state when no teachers', () => {
    render(
      <TeacherList
        teachers={[]}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No teachers found')).toBeInTheDocument();
  });

  it('formats salary amounts with proper locale formatting', () => {
    const teacherWithLargeSalary: Teacher = {
      ...mockTeachers[0],
      salary: {
        amount: 1234567,
        status: 'paid',
      }
    };

    render(
      <TeacherList
        teachers={[teacherWithLargeSalary]}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('₹1,234,567')).toBeInTheDocument();
  });

  it('handles teachers with no last paid date', () => {
    const teacherWithoutLastPaid: Teacher = {
      ...mockTeachers[0],
      salary: {
        amount: 50000,
        status: 'paid',
        // No lastPaidDate
      }
    };

    render(
      <TeacherList
        teachers={[teacherWithoutLastPaid]}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    // Should not show last paid date
    expect(screen.queryByText(/Last paid:/)).not.toBeInTheDocument();
  });

  it('displays all action buttons for each teacher', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        onEdit={mockOnEdit}
        onAssign={mockOnAssign}
        onUpdateSalary={mockOnUpdateSalary}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    const assignButtons = screen.getAllByText('Assign Classes');
    const salaryButtons = screen.getAllByText('Update Salary');
    const deleteButtons = screen.getAllByText('Delete');

    expect(editButtons).toHaveLength(2);
    expect(assignButtons).toHaveLength(2);
    expect(salaryButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });
});