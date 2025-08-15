import React, { useState, useEffect } from 'react';
import { ReportFilters, ReportType, ReportData } from '../../types/reports';
import { reportsService } from '../../services/reportsService';
import { ReportFiltersForm } from './ReportFiltersForm';
import { ReportDisplay } from './ReportDisplay';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'student-report-card',
    label: 'Student Report Card',
    description: 'Individual student academic performance and attendance'
  },
  {
    value: 'class-performance',
    label: 'Class Performance',
    description: 'Overall performance analysis for a specific class'
  },
  {
    value: 'attendance-summary',
    label: 'Attendance Summary',
    description: 'Attendance statistics for students, classes, or subjects'
  },
  {
    value: 'student-count',
    label: 'Student Count Report',
    description: 'Enrollment statistics by standard and section'
  },
  {
    value: 'teacher-assignments',
    label: 'Teacher Assignments',
    description: 'Teacher workload and class assignments'
  },
  {
    value: 'fee-status',
    label: 'Fee Status Report',
    description: 'Student fee payment status and pending amounts'
  },
  {
    value: 'salary-status',
    label: 'Salary Status Report',
    description: 'Teacher salary payment status'
  },
];

export const ReportsGenerator: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('student-report-card');
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'student-report-card',
    academicYear: new Date().getFullYear().toString(),
    format: 'pdf',
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilters(prev => ({ ...prev, reportType: selectedReportType }));
    setReportData(null);
    setError(null);
  }, [selectedReportType]);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.generateReport(filters);
      setReportData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      setLoading(true);
      const exportFilters = { ...filters, format };
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${selectedReportType}-${timestamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      
      await reportsService.downloadReport(exportFilters, filename);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export report');
      console.error('Error exporting report:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedReportInfo = REPORT_TYPES.find(type => type.value === selectedReportType);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports Generator</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Type Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Select Report Type</h2>
            <div className="space-y-2">
              {REPORT_TYPES.map(type => (
                <div
                  key={type.value}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedReportType === type.value
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedReportType(type.value)}
                >
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{type.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Generation */}
        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {selectedReportInfo?.label}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedReportInfo?.description}
            </p>

            <ReportFiltersForm
              reportType={selectedReportType}
              filters={filters}
              onFiltersChange={setFilters}
            />

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExportReport('pdf')}
                  disabled={loading || !reportData}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => handleExportReport('excel')}
                  disabled={loading || !reportData}
                  className="px-4 py-2 text-green-600 border border-green-300 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Excel
                </button>
              </div>
              
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Report Display */}
          {reportData && (
            <div className="bg-white rounded-lg shadow">
              <ReportDisplay reportData={reportData} />
            </div>
          )}

          {loading && !reportData && (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-lg text-gray-600">Generating report...</div>
              <div className="mt-2 text-sm text-gray-500">This may take a few moments</div>
            </div>
          )}

          {!reportData && !loading && (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              <div className="text-lg">No report generated yet</div>
              <div className="mt-2 text-sm">Configure filters and click "Generate Report" to get started</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};