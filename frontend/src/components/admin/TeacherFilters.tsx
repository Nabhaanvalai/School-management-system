import React from 'react';
import { TeacherFilters } from '../../types/teacher';

const AVAILABLE_SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Hindi',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Physical Education',
  'Art',
  'Music'
];

interface TeacherFiltersComponentProps {
  filters: TeacherFilters;
  onFiltersChange: (filters: TeacherFilters) => void;
}

export const TeacherFiltersComponent: React.FC<TeacherFiltersComponentProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleFilterChange = (key: keyof TeacherFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={filters.subject || ''}
            onChange={(e) => handleFilterChange('subject', e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {AVAILABLE_SUBJECTS.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.standard || ''}
            onChange={(e) => handleFilterChange('standard', e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Standards</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num.toString()}>Standard {num}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.section || ''}
            onChange={(e) => handleFilterChange('section', e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sections</option>
            {['A', 'B', 'C', 'D'].map(sec => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.salaryStatus || ''}
            onChange={(e) => handleFilterChange('salaryStatus', e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Salary Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
          >
            Clear Filters
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.subject && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              Subject: {filters.subject}
              <button
                onClick={() => handleFilterChange('subject', '')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.standard && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
              Standard: {filters.standard}
              <button
                onClick={() => handleFilterChange('standard', '')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.section && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
              Section: {filters.section}
              <button
                onClick={() => handleFilterChange('section', '')}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.salaryStatus && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
              Salary: {filters.salaryStatus}
              <button
                onClick={() => handleFilterChange('salaryStatus', '')}
                className="ml-1 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};