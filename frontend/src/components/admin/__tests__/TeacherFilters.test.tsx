import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeacherFiltersComponent } from '../TeacherFilters';
import { TeacherFilters } from '../../../types/teacher';

describe('TeacherFiltersComponent', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter controls', () => {
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByPlaceholderText('Search by name or employee ID...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Subjects')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Standards')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Sections')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Salary Status')).toBeInTheDocument();
  });

  it('displays current filter values', () => {
    const filters: TeacherFilters = {
      search: 'John',
      subject: 'Mathematics',
      standard: '10',
      section: 'A',
      salaryStatus: 'paid',
    };
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Standard 10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Section A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paid')).toBeInTheDocument();
  });

  it('calls onFiltersChange when search input changes', async () => {
    const user = userEvent.setup();
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or employee ID...');
    await user.type(searchInput, 'John');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: 'John',
    });
  });

  it('calls onFiltersChange when subject filter changes', async () => {
    const user = userEvent.setup();
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const subjectSelect = screen.getByDisplayValue('All Subjects');
    await user.selectOptions(subjectSelect, 'Mathematics');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      subject: 'Mathematics',
    });
  });

  it('calls onFiltersChange when standard filter changes', async () => {
    const user = userEvent.setup();
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const standardSelect = screen.getByDisplayValue('All Standards');
    await user.selectOptions(standardSelect, 'Standard 10');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      standard: '10',
    });
  });

  it('calls onFiltersChange when section filter changes', async () => {
    const user = userEvent.setup();
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sectionSelect = screen.getByDisplayValue('All Sections');
    await user.selectOptions(sectionSelect, 'Section A');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      section: 'A',
    });
  });

  it('calls onFiltersChange when salary status filter changes', async () => {
    const user = userEvent.setup();
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const salarySelect = screen.getByDisplayValue('All Salary Status');
    await user.selectOptions(salarySelect, 'Paid');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      salaryStatus: 'paid',
    });
  });

  it('shows clear filters button when filters are active', () => {
    const filters: TeacherFilters = {
      search: 'John',
      subject: 'Mathematics',
    };
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('hides clear filters button when no filters are active', () => {
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const filters: TeacherFilters = {
      search: 'John',
      subject: 'Mathematics',
      standard: '10',
      section: 'A',
      salaryStatus: 'paid',
    };
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByText('Clear Filters');
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('displays active filter tags', () => {
    const filters: TeacherFilters = {
      search: 'John',
      subject: 'Mathematics',
      standard: '10',
      section: 'A',
      salaryStatus: 'paid',
    };
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Search: "John"')).toBeInTheDocument();
    expect(screen.getByText('Subject: Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Standard: 10')).toBeInTheDocument();
    expect(screen.getByText('Section: A')).toBeInTheDocument();
    expect(screen.getByText('Salary: paid')).toBeInTheDocument();
  });

  it('removes individual filter tags when x is clicked', async () => {
    const user = userEvent.setup();
    const filters: TeacherFilters = {
      search: 'John',
      subject: 'Mathematics',
    };
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchTag = screen.getByText('Search: "John"');
    const removeButton = searchTag.querySelector('button');
    
    if (removeButton) {
      await user.click(removeButton);
    }

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      subject: 'Mathematics',
      search: undefined,
    });
  });

  it('handles empty filter values correctly', async () => {
    const user = userEvent.setup();
    const filters: TeacherFilters = { search: 'John' };
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const subjectSelect = screen.getByDisplayValue('All Subjects');
    await user.selectOptions(subjectSelect, 'All Subjects');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: 'John',
      subject: undefined,
    });
  });

  it('renders all available subjects', () => {
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const subjectSelect = screen.getByDisplayValue('All Subjects');
    
    const expectedSubjects = [
      'Mathematics', 'English', 'Science', 'Social Studies', 'Hindi',
      'Physics', 'Chemistry', 'Biology', 'Computer Science', 
      'Physical Education', 'Art', 'Music'
    ];
    
    expectedSubjects.forEach(subject => {
      expect(subjectSelect.querySelector(`option[value="${subject}"]`)).toBeInTheDocument();
    });
  });

  it('renders all standard options', () => {
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const standardSelect = screen.getByDisplayValue('All Standards');
    
    // Check that all 12 standards are available
    for (let i = 1; i <= 12; i++) {
      expect(standardSelect.querySelector(`option[value="${i}"]`)).toBeInTheDocument();
    }
  });

  it('renders all section options', () => {
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sectionSelect = screen.getByDisplayValue('All Sections');
    
    ['A', 'B', 'C', 'D'].forEach(section => {
      expect(sectionSelect.querySelector(`option[value="${section}"]`)).toBeInTheDocument();
    });
  });

  it('renders salary status options', () => {
    const filters: TeacherFilters = {};
    
    render(
      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const salarySelect = screen.getByDisplayValue('All Salary Status');
    
    expect(salarySelect.querySelector('option[value="paid"]')).toBeInTheDocument();
    expect(salarySelect.querySelector('option[value="unpaid"]')).toBeInTheDocument();
  });
});