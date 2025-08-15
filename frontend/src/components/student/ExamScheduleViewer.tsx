import React, { useState, useEffect } from 'react';
import { examService, Exam, ExamSubject } from '../../services/examService';

interface ExamScheduleViewerProps {
  studentClass: { standard: string; section: string };
  className?: string;
}

const ExamScheduleViewer: React.FC<ExamScheduleViewerProps> = ({ studentClass, className = '' }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const examTypeColors = {
    'unit-test': 'bg-blue-100 text-blue-800',
    'mid-term': 'bg-yellow-100 text-yellow-800',
    'final': 'bg-red-100 text-red-800',
    'annual': 'bg-purple-100 text-purple-800',
    'entrance': 'bg-green-100 text-green-800'
  };

  const statusColors = {
    'upcoming': 'bg-blue-100 text-blue-800',
    'ongoing': 'bg-green-100 text-green-800',
    'completed': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  const examTypeIcons = {
    'written': '✍️',
    'practical': '🔬',
    'oral': '🗣️',
    'project': '📋'
  };

  useEffect(() => {
    fetchExamSchedules();
  }, [studentClass]);

  const fetchExamSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const exams = await examService.getStudentExams(studentClass);
      setExams(exams);
      
      if (exams.length > 0) {
        setSelectedExam(exams[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exam schedules');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredExams = () => {
    if (filterStatus === 'all') return exams;
    return exams.filter(exam => exam.status === filterStatus);
  };

  const getSelectedExamData = () => {
    return exams.find(exam => exam._id === selectedExam);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysUntilExam = (examDate: Date) => {
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
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
          <p className="text-lg font-semibold mb-2">Error Loading Exam Schedule</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchExamSchedules}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredExams = getFilteredExams();
  const selectedExamData = getSelectedExamData();

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam Schedule</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Exam selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {exams.map(exam => (
                <option key={exam._id} value={exam._id}>
                  {exam.name} ({exam.academicYear})
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Exam list for mobile */}
        <div className="md:hidden">
          <div className="space-y-2">
            {filteredExams.map(exam => (
              <button
                key={exam._id}
                onClick={() => setSelectedExam(exam._id)}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedExam === exam._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{exam.name}</div>
                    <div className="text-sm text-gray-500">{formatDate(exam.startDate)}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[exam.status]}`}>
                    {exam.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredExams.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">No exams found</p>
            <p className="text-sm">No exams match the selected criteria</p>
          </div>
        ) : selectedExamData ? (
          <div className="space-y-6">
            {/* Exam header */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedExamData.name}</h3>
                  <p className="text-sm text-gray-600">Academic Year: {selectedExamData.academicYear}</p>
                  <p className="text-sm text-gray-600">
                    Class: {selectedExamData.standard} - {selectedExamData.section}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${examTypeColors[selectedExamData.type]} mb-2`}>
                    {selectedExamData.type.replace('-', ' ').toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedExamData.status]}`}>
                    {selectedExamData.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Start Date:</span>
                  <span className="ml-2 text-gray-600">{formatDate(selectedExamData.startDate)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">End Date:</span>
                  <span className="ml-2 text-gray-600">{formatDate(selectedExamData.endDate)}</span>
                </div>
              </div>

              {selectedExamData.status === 'upcoming' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-blue-600 font-medium">
                      ⏰ Exam starts in {getDaysUntilExam(selectedExamData.startDate)} days
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* General instructions */}
            {selectedExamData.instructions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📋 General Instructions</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {selectedExamData.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subject schedule */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📚 Subject Schedule</h4>
              <div className="space-y-4">
                {selectedExamData.subjects.map((subject, index) => {
                  const daysUntil = getDaysUntilExam(subject.date);
                  const isToday = daysUntil === 0;
                  const isPast = daysUntil < 0;
                  
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        isToday
                          ? 'border-green-500 bg-green-50'
                          : isPast
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h5 className="text-lg font-semibold text-gray-900 mr-3">
                              {subject.subject}
                            </h5>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              subject.examType === 'written' ? 'bg-blue-100 text-blue-800' :
                              subject.examType === 'practical' ? 'bg-green-100 text-green-800' :
                              subject.examType === 'oral' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {examTypeIcons[subject.examType]} {subject.examType}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="font-medium text-gray-700">Date:</span>
                              <span className="ml-2 text-gray-600">{formatDate(subject.date)}</span>
                              {isToday && <span className="ml-2 text-green-600 font-medium">(Today)</span>}
                              {daysUntil > 0 && <span className="ml-2 text-blue-600">({daysUntil} days)</span>}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Time:</span>
                              <span className="ml-2 text-gray-600">
                                {formatTime(subject.startTime)} - {formatTime(subject.endTime)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Max Marks:</span>
                              <span className="ml-2 text-gray-600">{subject.maxMarks}</span>
                            </div>
                            {subject.venue && (
                              <div>
                                <span className="font-medium text-gray-700">Venue:</span>
                                <span className="ml-2 text-gray-600">{subject.venue}</span>
                              </div>
                            )}
                          </div>

                          <div className="mb-3">
                            <span className="font-medium text-gray-700">Syllabus:</span>
                            <p className="text-gray-600 text-sm mt-1">{subject.syllabus}</p>
                          </div>

                          {subject.instructions && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <span className="font-medium text-blue-800">Special Instructions:</span>
                              <p className="text-blue-700 text-sm mt-1">{subject.instructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Study tips */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">💡 Study Tips</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                <li>Review your notes and textbooks thoroughly</li>
                <li>Practice previous year question papers</li>
                <li>Get adequate sleep before the exam</li>
                <li>Arrive at the exam venue early</li>
                <li>Read all questions carefully before answering</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">Select an exam to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamScheduleViewer;