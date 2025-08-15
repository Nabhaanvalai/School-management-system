import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeriodModal } from '../PeriodModal';
import { Period, TeacherOption } from '../../../types/timetable';

const mockTeachers: TeacherOption[] = [
  { _id: 'teacher1', name: 'John Smith', subjects: ['Mathematics', 'Physics'] },
  { _id: 'teacher2', name: 'Jane Doe', subjects: ['English', 'Hindi'] },
  { _id: 'teacher3', name: 'Bob Wilson', subjects: ['Mathematics', 'Chemistry'] },
];

const mockSubjects = ['Mathematics', 'Physics', 'English', 'Hindi', 'Chemistry'];

const mockPeriod: Period = {
  slot: 'A1',
  subject: 'Mathematics',
  teacherId: 'teacher1',
  teacherName: 'John Smith',
  startTime: '08:00',
  endTime: '08:45',
};

describe('PeriodModal', () => {
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders add period modal correctly', () => {
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Add Period')).toBeInTheDocument();
    expect(screen.getByText('Day: Monday')).toBeInTheDocument();
    expect(screen.getByText('Time Slot: A1')).toBeInTheDocument();
    expect(screen.getByText('Select a subject')).toBeInTheDocument();
    expect(screen.getByText('Select a teacher')).toBeInTheDocument();
  });

  it('renders edit period modal with existing data', () => {
    render(
      <PeriodModal
        period={mockPeriod}
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Period')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Current Assignment:')).toBeInTheDocument();
    expect(screen.getByText('Remove Period')).toBeInTheDocument();
  });

  it('displays all available subjects', () => {
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const subjectSelect = screen.getByDisplayValue('');
    mockSubjects.forEach(subject => {
      expect(subjectSelect.querySelector(`option[value="${subject}"]`)).toBeInTheDocument();
    });
  });

  it('filters teachers based on selected subject', async () => {
    const user = userEvent.setup();
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    // Select Mathematics
    await user.selectOptions(screen.getByDisplayValue(''), 'Mathematics');

    // Should show only teachers who teach Mathematics
    const teacherSelect = screen.getAllByDisplayValue('')[0]; // Teacher select
    expect(teacherSelect.querySelector('option[value="teacher1"]')).toBeInTheDocument();
    expect(teacherSelect.querySelector('option[value="teacher3"]')).toBeInTheDocument();
    expect(teacherSelect.querySelector('option[value="teacher2"]')).not.toBeInTheDocument();
  });

  it('disables teacher select when no subject is selected', () => {
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const teacherSelect = screen.getAllByRole('combobox')[1]; // Second select is teacher
    expect(teacherSelect).toBeDisabled();
  });

  it('shows message when no teachers available for subject', async () => {
    const user = userEvent.setup();
    const subjectsWithNoTeachers = ['Art']; // Subject not taught by any teacher
    
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={subjectsWithNoTeachers}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    await user.selectOptions(screen.getByDisplayValue(''), 'Art');

    expect(screen.getByText('No teachers available for this subject')).toBeInTheDocument();
  });

  it('calls onSave with correct data when save button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    await user.selectOptions(screen.getByDisplayValue(''), 'Mathematics');
    await user.selectOptions(screen.getAllByDisplayValue('')[0], 'teacher1');
    await user.click(screen.getByText('Add Period'));

    expect(mockOnSave).toHaveBeenCalledWith({
      subject: 'Mathematics',
      teacherId: 'teacher1',
    });
  });

  it('shows alert when trying to save without subject or teacher', async () => {
    const user = userEvent.setup();
    window.alert = jest.fn();
    
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByText('Add Period'));

    expect(window.alert).toHaveBeenCalledWith('Please select both subject and teacher');
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('disables save button when subject or teacher is not selected', () => {
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText('Add Period');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when both subject and teacher are selected', async () => {
    const user = userEvent.setup();
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    await user.selectOptions(screen.getByDisplayValue(''), 'Mathematics');
    await user.selectOptions(screen.getAllByDisplayValue('')[0], 'teacher1');

    const saveButton = screen.getByText('Add Period');
    expect(saveButton).not.toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PeriodModal
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByText('Cancel'));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onDelete with confirmation when remove button is clicked', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);
    
    render(
      <PeriodModal
        period={mockPeriod}
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByText('Remove Period'));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to remove this period?');
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('does not call onDelete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);
    
    render(
      <PeriodModal
        period={mockPeriod}
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByText('Remove Period'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('resets teacher selection when subject changes to incompatible one', async () => {
    const user = userEvent.setup();
    render(
      <PeriodModal
        period={mockPeriod}
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    // Initially has Mathematics and John Smith selected
    expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Smith')).toBeInTheDocument();

    // Change to English (John Smith doesn't teach English)
    await user.selectOptions(screen.getByDisplayValue('Mathematics'), 'English');

    // Teacher selection should be reset
    const teacherSelect = screen.getAllByRole('combobox')[1];
    expect(teacherSelect).toHaveValue('');
  });

  it('capitalizes day name correctly', () => {
    render(
      <PeriodModal
        day="wednesday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Day: Wednesday')).toBeInTheDocument();
  });

  it('shows correct button text for edit mode', () => {
    render(
      <PeriodModal
        period={mockPeriod}
        day="monday"
        slot="A1"
        teachers={mockTeachers}
        subjects={mockSubjects}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Update Period')).toBeInTheDocument();
  });
});