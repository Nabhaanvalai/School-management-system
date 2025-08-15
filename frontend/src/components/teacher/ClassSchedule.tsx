import React, { useState, useEffect } from 'react';
import { timetableService } from '../../services/timetableService';
import { Timetable, Period } from '../../types/timetable';
import { useAuth } from '../../context/AuthContext';

interface ClassScheduleProps {
  teacherId?: string;
}

const ClassSchedule: React.FC<ClassScheduleProps> = ({ teacherId }) => {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());

  const currentTeacherId = teacherId || user?.profile?._id;

  const timeSlots = [
    { slot: 'A1', time: '08:00 - 08:45' },
    { slot: 'B1', time: '08:45 - 09:30' },
    { slot: 'C1', time: '09:30 - 10:15' },
    { slot: 'D1', time: '10:15 - 11:00' },
    { slot: 'E1', time: '11:15 - 12:00' },
    { slot: 'F1', time: '12:00 - 12:45' },
    { slot: 'G1', time: '12:45 - 13:30' },
    { slot: 'H1', time: '13:30 - 14:15' }
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

  useEffect(() => {
    if (currentTeacherId) {
      fetchTeacherTimetable();
    }
  }, [currentTeacherId]);

  const fetchTeacherTimetable = async () => {
    if (!currentTeacherId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await timetableService.getTeacherTimetable(currentTeacherId);
      setTimetables(data);
    } catch (err: any) {
      console.error('Error fetching teacher timetable:', err);
      setError(err.response?.data?.message || 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodForSlot = (day: string, slot: string): Period | null => {
    for (const timetable of timetables) {
      const daySchedule = timetable.schedule.find(s => s.day === day);
      if (daySchedule) {
        const period = daySchedule.periods.find(p => p.slot === slot);
        if (period) {
          return period;
        }
      }
    }
    return null;
  };

  const getClassInfo = (period: Period): string => {
    // Find the timetable that contains this period to get class info
    for (const timetable of timetables) {
      const daySchedule = timetable.schedule.find(s => 
        s.periods.some(p => p.slot === period.slot && p.subject === period.subject)
      );
      if (daySchedule) {
        // Extract class info from timetable classId or other source
        return `Class ${timetable.classId}`;
      }
    }
    return 'Unknown Class';
  };

  const getCurrentWeekDates = () => {
    const startOfWeek = new Date(selectedWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading timetable</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchTeacherTimetable}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const weekDates = getCurrentWeekDates();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Class Schedule</h2>
            <p className="mt-1 text-sm text-gray-600">
              Your weekly teaching schedule
            </p>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              aria-label="Previous week"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-sm font-medium text-gray-900">
              {formatDate(weekDates[0])} - {formatDate(weekDates[4])}
            </div>
            
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              aria-label="Next week"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => setSelectedWeek(new Date())}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {timetables.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m-6-4h6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No schedule available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your class schedule hasn't been created yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  {days.map((day, index) => (
                    <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal">
                        {formatDate(weekDates[index])}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map((timeSlot) => (
                  <tr key={timeSlot.slot} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>
                        <div className="font-semibold">{timeSlot.slot}</div>
                        <div className="text-xs text-gray-500">{timeSlot.time}</div>
                      </div>
                    </td>
                    {days.map((day) => {
                      const period = getPeriodForSlot(day, timeSlot.slot);
                      return (
                        <td key={`${day}-${timeSlot.slot}`} className="px-4 py-4 whitespace-nowrap text-sm">
                          {period ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                              <div className="font-medium text-blue-900">{period.subject}</div>
                              <div className="text-xs text-blue-700">{getClassInfo(period)}</div>
                              {period.teacherName && (
                                <div className="text-xs text-blue-600 mt-1">
                                  {period.teacherName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-center py-2">
                              <span className="text-xs">Free</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassSchedule;