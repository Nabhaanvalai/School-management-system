import React from 'react';
import { ReportFilters, ReportType } from '../../types/reports';

interface ReportFiltersFormProps {
  reportType: ReportType;
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
}

export const ReportFiltersForm: React.FC<ReportFiltersFormProps> = ({
  reportType,
  filters,
  onFiltersChange,
}) => {
  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    // Academic year starts in April (month 3)
    return currentMonth >= 3 ? currentYear : currentYear - 1;
  };

  const getAcademicYearOptions = () => {
    const currentYear = getCurrentAcademicYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  const renderCommonFilters = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Academic Year</label>
          <select
            value={filters.academicYear || ''}
            onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {getAcademicYearOptions().map(year => (
              <option key={year} value={year.toString()}>
                {year}-{year + 1}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Format</label>
          <select
            value={filters.format || 'pdf'}
            onChange={(e) => handleFilterChange('format', e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
        </div>
      </div>
    </>
  );

  const renderClassFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-2">Standard</label>
        <select
          value={filters.standard || ''}
          onChange={(e) => handleFilterChange('standard', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Standards</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
            <option key={num} value={num.toString()}>{num}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Section</label>
        <select
          value={filters.section || ''}
          onChange={(e) => handleFilterChange('section', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sections</option>
          {['A', 'B', 'C', 'D'].map(sec => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderDateFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-2">Start Date</label>
        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">End Date</label>
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderSubjectFilter = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Subject</label>
      <select
        value={filters.subject || ''}
        onChange={(e) => handleFilterChange('subject', e.target.value)}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Subjects</option>
        <option value="Mathematics">Mathematics</option>
        <option value="English">English</option>
        <option value="Science">Science</option>
        <option value="Social Studies">Social Studies</option>
        <option value="Hindi">Hindi</option>
        <option value="Physics">Physics</option>
        <option value="Chemistry">Chemistry</option>
        <option value="Biology">Biology</option>
        <option value="Computer Science">Computer Science</option>
        <option value="Physical Education">Physical Education</option>
        <option value="Art">Art</option>
        <option value="Music">Music</option>
      </select>
    </div>
  );

  const renderStudentFilter = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Student ID</label>
      <input
        type="text"
        value={filters.studentId || ''}
        onChange={(e) => handleFilterChange('studentId', e.target.value)}
        placeholder="Enter student ID or leave empty for all students"
        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const renderTeacherFilter = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Teacher ID</label>
      <input
        type="text"
        value={filters.teacherId || ''}
        onChange={(e) => handleFilterChange('teacherId', e.target.value)}
        placeholder="Enter teacher ID or leave empty for all teachers"
        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const renderFeeStatusFilter = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Fee Status</label>
      <select
        value={filters.studentId || ''}
        onChange={(e) => handleFilterChange('studentId', e.target.value)}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Status</option>
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
        <option value="overdue">Overdue</option>
      </select>
    </div>
  );

  const renderFiltersForReportType = () => {
    switch (reportType) {
      case 'student-report-card':
        return (
          <>
            {renderStudentFilter()}
            {renderClassFilters()}
          </>
        );

      case 'class-performance':
        return (
          <>
            {renderClassFilters()}
            {renderSubjectFilter()}
          </>
        );

      case 'attendance-summary':
        return (
          <>
            {renderStudentFilter()}
            {renderClassFilters()}
            {renderSubjectFilter()}
            {renderDateFilters()}
          </>
        );

      case 'student-count':
        return (
          <>
            {renderClassFilters()}
          </>
        );

      case 'teacher-assignments':
        return (
          <>
            {renderTeacherFilter()}
            {renderSubjectFilter()}
          </>
        );

      case 'fee-status':
        return (
          <>
            {renderClassFilters()}
            {renderFeeStatusFilter()}
          </>
        );

      case 'salary-status':
        return (
          <>
            {renderTeacherFilter()}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {renderCommonFilters()}
      {renderFiltersForReportType()}
    </div>
  );
};