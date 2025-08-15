import React, { useState } from 'react';
import AttendanceViewer from './AttendanceViewer';
import ReportCard from './ReportCard';
import PaymentStatus from './PaymentStatus';
import TimetableViewer from './TimetableViewer';
import AcademicCalendarViewer from './AcademicCalendarViewer';
import ExamScheduleViewer from './ExamScheduleViewer';

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'reports' | 'payments' | 'timetable' | 'calendar' | 'exams'>('attendance');

  const tabs = [
    { id: 'attendance', label: 'My Attendance', icon: '📊' },
    { id: 'reports', label: 'Report Cards', icon: '📋' },
    { id: 'payments', label: 'Fee Status', icon: '💳' },
    { id: 'timetable', label: 'Class Schedule', icon: '📅' },
    { id: 'calendar', label: 'Academic Calendar', icon: '🗓️' },
    { id: 'exams', label: 'Exam Schedule', icon: '📝' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="mt-2 text-gray-600">View your academic information and progress</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex flex-wrap gap-2" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'attendance' | 'reports' | 'payments' | 'timetable' | 'calendar' | 'exams')}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-t-lg transition-all duration-200`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
          <div className="p-6">
            {activeTab === 'attendance' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">My Attendance</h2>
                  <p className="text-gray-600">View your attendance records by subject</p>
                </div>
                <AttendanceViewer />
              </div>
            )}
            
            {activeTab === 'reports' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Report Cards</h2>
                  <p className="text-gray-600">View your academic performance and grades</p>
                </div>
                <ReportCard />
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Fee Status</h2>
                  <p className="text-gray-600">Check your payment status and history</p>
                </div>
                <PaymentStatus />
              </div>
            )}

            {activeTab === 'timetable' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Class Schedule</h2>
                  <p className="text-gray-600">View your weekly class timetable</p>
                </div>
                <TimetableViewer />
              </div>
            )}

            {activeTab === 'calendar' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Academic Calendar</h2>
                  <p className="text-gray-600">View school events and holidays</p>
                </div>
                <AcademicCalendarViewer />
              </div>
            )}

            {activeTab === 'exams' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Exam Schedule</h2>
                  <p className="text-gray-600">View upcoming exams and results</p>
                </div>
                <ExamScheduleViewer />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;