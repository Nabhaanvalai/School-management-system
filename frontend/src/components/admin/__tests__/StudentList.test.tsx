import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentList } from '../StudentList';
import { Student } from '../../../types/student';

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

describe('StudentList', () => {
  const mockOnEdit = jest.fn();
  const mockOnTransfer = jest.fn();
  const mockOnMarkLeft = jest.fn();
  const mockOnArchive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders student list correctly', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Roll No: 001')).toBeInTheDocument();
    expect(screen.getByText('Roll No: 002')).toBeInTheDocument();
    expect(screen.getByText('Standard 5 - A')).toBeInTheDocument();
    expect(screen.getByText('Standard 4 - B')).toBeInTheDocument();
  });

  it('displays parent contact information', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText('Robert Doe')).toBeInTheDocument();
    expect(screen.getByText('Mike Smith')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('0987654321')).toBeInTheDocument();
    expect(screen.getByText('parent@example.com')).toBeInTheDocument();
    expect(screen.getByText('smith@example.com')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const activeStatus = screen.getByText('active');
    const leftStatus = screen.getByText('left');

    expect(activeStatus).toHaveClass('bg-green-100', 'text-green-800');
    expect(leftStatus).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('shows leaving date for left students', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText(/Left: 12\/1\/2023/)).toBeInTheDocument();
  });

  it('shows appropriate action buttons for active students', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    const transferButtons = screen.getAllByText('Transfer');
    const markLeftButtons = screen.getAllByText('Mark Left');
    const archiveButtons = screen.getAllByText('Archive');

    expect(editButtons).toHaveLength(2); // Both students have edit button
    expect(transferButtons).toHaveLength(1); // Only active student has transfer button
    expect(markLeftButtons).toHaveLength(1); // Only active student has mark left button
    expect(archiveButtons).toHaveLength(2); // Both students have archive button
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockStudents[0]);
  });

  it('calls onTransfer when transfer button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const transferButton = screen.getByText('Transfer');
    await user.click(transferButton);

    expect(mockOnTransfer).toHaveBeenCalledWith(mockStudents[0]);
  });

  it('opens leave modal when mark left button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const markLeftButton = screen.getByText('Mark Left');
    await user.click(markLeftButton);

    expect(screen.getByText('Mark Student as Left')).toBeInTheDocument();
    expect(screen.getByText('Mark John Doe as having left the school?')).toBeInTheDocument();
  });

  it('calls onMarkLeft when leave modal is confirmed', async () => {
    const user = userEvent.setup();
    mockOnMarkLeft.mockResolvedValue(undefined);
    
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const markLeftButton = screen.getByText('Mark Left');
    await user.click(markLeftButton);

    const confirmButton = screen.getByText('Mark as Left');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnMarkLeft).toHaveBeenCalledWith(mockStudents[0], expect.any(String));
    });
  });

  it('calls onArchive when archive button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const archiveButtons = screen.getAllByText('Archive');
    await user.click(archiveButtons[0]);

    expect(mockOnArchive).toHaveBeenCalledWith(mockStudents[0]);
  });

  it('shows empty state when no students', () => {
    render(
      <StudentList
        students={[]}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText('No students found')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText(/DOB: 1\/1\/2010/)).toBeInTheDocument();
    expect(screen.getByText(/DOB: 2\/15\/2011/)).toBeInTheDocument();
    expect(screen.getByText(/Admitted: 4\/1\/2020/)).toBeInTheDocument();
    expect(screen.getByText(/Admitted: 4\/1\/2021/)).toBeInTheDocument();
  });

  it('handles leave modal cancellation', async () => {
    const user = userEvent.setup();
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const markLeftButton = screen.getByText('Mark Left');
    await user.click(markLeftButton);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByText('Mark Student as Left')).not.toBeInTheDocument();
    expect(mockOnMarkLeft).not.toHaveBeenCalled();
  });

  it('shows loading state in leave modal during submission', async () => {
    const user = userEvent.setup();
    mockOnMarkLeft.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onTransfer={mockOnTransfer}
        onMarkLeft={mockOnMarkLeft}
        onArchive={mockOnArchive}
      />
    );

    const markLeftButton = screen.getByText('Mark Left');
    await user.click(markLeftButton);

    const confirmButton = screen.getByText('Mark as Left');
    await user.click(confirmButton);

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.getByText('Updating...')).toBeDisabled();
  });
});