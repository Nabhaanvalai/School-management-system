import React, { useState } from 'react';
import { 
  StudentManagement, 
  TeacherManagement, 
  TimetableBuilder, 
  ReportsGenerator 
} from './index';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'timetable' | 'reports'>('students');

  const tabs = [
    { id: 'students', label: 'Student Management', icon: '👥' },
    { id: 'teachers', label: 'Teacher Management', icon: '👨‍🏫' },
    { id: 'timetable', label: 'Timetable Builder', icon: '📅' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage all aspects of the school system</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'students' | 'teachers' | 'timetable' | 'reports')}
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
            {activeTab === 'students' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
                  <p className="text-gray-600">Add, edit, and manage student records</p>
                </div>
                <StudentManagement />
              </div>
            )}
            
            {activeTab === 'teachers' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Teacher Management</h2>
                  <p className="text-gray-600">Manage teacher records and assignments</p>
                </div>
                <TeacherManagement />
              </div>
            )}

            {activeTab === 'timetable' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Timetable Builder</h2>
                  <p className="text-gray-600">Create and manage class schedules</p>
                </div>
                <TimetableBuilder />
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
                  <p className="text-gray-600">Generate comprehensive school reports</p>
                </div>
                <ReportsGenerator />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;