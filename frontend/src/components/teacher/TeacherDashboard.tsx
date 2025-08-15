import React, { useState } from 'react';
import AttendanceMarker from './AttendanceMarker';
import AttendanceHistory from './AttendanceHistory';
import ClassSchedule from './ClassSchedule';
import LeaveApplication from './LeaveApplication';
import LeaveStatus from './LeaveStatus';

const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'schedule' | 'leave' | 'leave-status'>('mark');
  const [leaveRefreshTrigger, setLeaveRefreshTrigger] = useState(0);

  const tabs = [
    { id: 'mark', label: 'Mark Attendance', icon: '✓' },
    { id: 'history', label: 'Attendance History', icon: '📋' },
    { id: 'schedule', label: 'My Schedule', icon: '📅' },
    { id: 'leave', label: 'Apply Leave', icon: '📝' },
    { id: 'leave-status', label: 'Leave Status', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage student attendance and view your records</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'mark' | 'history' | 'schedule' | 'leave' | 'leave-status')}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'mark' && (
            <AttendanceMarker 
              onAttendanceMarked={() => {
                // Optionally refresh history tab data or show success message
                console.log('Attendance marked successfully');
              }}
            />
          )}
          
          {activeTab === 'history' && (
            <AttendanceHistory />
          )}

          {activeTab === 'schedule' && (
            <ClassSchedule />
          )}

          {activeTab === 'leave' && (
            <LeaveApplication 
              onLeaveSubmitted={() => {
                // Refresh leave status when new leave is submitted
                setLeaveRefreshTrigger(prev => prev + 1);
                // Switch to leave status tab to show the new request
                setActiveTab('leave-status');
              }}
            />
          )}

          {activeTab === 'leave-status' && (
            <LeaveStatus refreshTrigger={leaveRefreshTrigger} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;