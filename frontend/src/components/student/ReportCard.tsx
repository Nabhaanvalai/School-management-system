import React, { useState, useEffect } from 'react';
import { StudentReportCard } from '../../types/reports';
import { reportsService } from '../../services/reportsService';

interface ReportCardProps {
  studentId: string;
  className?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ studentId, className = '' }) => {
  const [reportCard, setReportCard] = useState<StudentReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
  );

  useEffect(() => {
    fetchReportCard();
  }, [studentId, selectedYear]);

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      setError(null);

      const reportData = await reportsService.generateReport({
        reportType: 'student-report-card',
        studentId,
        academicYear: selectedYear
      });

      setReportCard(reportData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report card');
    } finally {
      setLoading(false);
    }
  };

  const downloadReportCard = async () => {
    try {
      await reportsService.generateReport({
        reportType: 'student-report-card',
        studentId,
        academicYear: selectedYear,
        format: 'pdf'
      });
    } catch (err) {
      console.error('Failed to download report card:', err);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100';
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-100';
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-100';
      case 'D':
        return 'text-orange-600 bg-orange-100';
      case 'F':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const calculatePercentage = (marks: number, maxMarks: number) => {
    return ((marks / maxMarks) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Report Card</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchReportCard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reportCard) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">No report card available</p>
          <p className="text-sm">Report card data not found for the selected academic year</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Academic Report Card</h2>
            <p className="text-sm text-gray-600 mt-1">
              {reportCard.student.name} - Roll No: {reportCard.student.rollNo}
            </p>
            <p className="text-sm text-gray-600">
              Class: {reportCard.student.standard} - {reportCard.student.section}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
            
            <button
              onClick={downloadReportCard}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Overall Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {reportCard.overallGrade}
            </div>
            <div className="text-sm text-blue-700">Overall Grade</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {reportCard.rank}
            </div>
            <div className="text-sm text-green-700">Class Rank</div>
            <div className="text-xs text-gray-600">
              out of {reportCard.totalStudents}
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {reportCard.attendance.percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-purple-700">Attendance</div>
            <div className="text-xs text-gray-600">
              {reportCard.attendance.presentDays} of {reportCard.attendance.totalDays} days
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {reportCard.subjects.length}
            </div>
            <div className="text-sm text-orange-700">Subjects</div>
          </div>
        </div>
      </div>

      {/* Subject-wise Performance */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject-wise Performance</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marks Obtained
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportCard.subjects.map((subject, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {subject.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subject.teacher}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subject.marks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subject.maxMarks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculatePercentage(subject.marks, subject.maxMarks)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(subject.grade)}`}>
                      {subject.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Performance Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Subject-wise Percentage</h5>
              <div className="space-y-2">
                {reportCard.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-24 text-xs text-gray-600 truncate">
                      {subject.subject}
                    </div>
                    <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${calculatePercentage(subject.marks, subject.maxMarks)}%`
                        }}
                      ></div>
                    </div>
                    <div className="w-12 text-xs text-gray-600 text-right">
                      {calculatePercentage(subject.marks, subject.maxMarks)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Grade Distribution</h5>
              <div className="space-y-2">
                {Object.entries(
                  reportCard.subjects.reduce((acc, subject) => {
                    acc[subject.grade] = (acc[subject.grade] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([grade, count]) => (
                  <div key={grade} className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(grade)}`}>
                      Grade {grade}
                    </span>
                    <span className="text-sm text-gray-600">{count} subject{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;