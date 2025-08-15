import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentFiltersComponent } from '../StudentFilters';
import { StudentFilters } from '../../../types/student';

describe('StudentFiltersComponent', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter controls', () => {
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByPlaceholderText('Search by name or roll number...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Standards')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Sections')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
  });

  it('displays current filter values', () => {
    const filters: StudentFilters = {
      search: 'John',
      standard: '5',
      section: 'A',
      status: 'active',
    };
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Standard 5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Section A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Active')).toBeInTheDocument();
  });

  it('calls onFiltersChange when search input changes', async () => {
    const user = userEvent.setup();
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or roll number...');
    await user.type(searchInput, 'John');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: 'John',
    });
  });

  it('calls onFiltersChange when standard filter changes', async () => {
    const user = userEvent.setup();
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const standardSelect = screen.getByDisplayValue('All Standards');
    await user.selectOptions(standardSelect, 'Standard 5');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      standard: '5',
    });
  });

  it('calls onFiltersChange when section filter changes', async () => {
    const user = userEvent.setup();
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
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

  it('calls onFiltersChange when status filter changes', async () => {
    const user = userEvent.setup();
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const statusSelect = screen.getByDisplayValue('All Status');
    await user.selectOptions(statusSelect, 'Active');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      status: 'active',
    });
  });

  it('shows clear filters button when filters are active', () => {
    const filters: StudentFilters = {
      search: 'John',
      standard: '5',
    };
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('hides clear filters button when no filters are active', () => {
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const filters: StudentFilters = {
      search: 'John',
      standard: '5',
      section: 'A',
      status: 'active',
    };
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByText('Clear Filters');
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('displays active filter tags', () => {
    const filters: StudentFilters = {
      search: 'John',
      standard: '5',
      section: 'A',
      status: 'active',
    };
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Search: "John"')).toBeInTheDocument();
    expect(screen.getByText('Standard: 5')).toBeInTheDocument();
    expect(screen.getByText('Section: A')).toBeInTheDocument();
    expect(screen.getByText('Status: active')).toBeInTheDocument();
  });

  it('removes individual filter tags when x is clicked', async () => {
    const user = userEvent.setup();
    const filters: StudentFilters = {
      search: 'John',
      standard: '5',
    };
    
    render(
      <StudentFiltersComponent
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
      standard: '5',
      search: undefined,
    });
  });

  it('handles empty filter values correctly', async () => {
    const user = userEvent.setup();
    const filters: StudentFilters = { search: 'John' };
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const standardSelect = screen.getByDisplayValue('All Standards');
    await user.selectOptions(standardSelect, 'All Standards');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: 'John',
      standard: undefined,
    });
  });

  it('renders all standard options', () => {
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
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
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sectionSelect = screen.getByDisplayValue('All Sections');
    
    ['A', 'B', 'C', 'D'].forEach(section => {
      expect(sectionSelect.querySelector(`option[value="${section}"]`)).toBeInTheDocument();
    });
  });

  it('renders all status options', () => {
    const filters: StudentFilters = {};
    
    render(
      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const statusSelect = screen.getByDisplayValue('All Status');
    
    expect(statusSelect.querySelector('option[value="active"]')).toBeInTheDocument();
    expect(statusSelect.querySelector('option[value="left"]')).toBeInTheDocument();
  });
});