import React, { useState, useEffect } from 'react';
import { Timetable } from '../../types/timetable';
import { timetableService } from '../../services/timetableService';

interface TimetableViewerProps {
  classId: string;
  className?: string;
}

const TimetableViewer: React.FC<TimetableViewerProps> = ({ classId, className = '' }) => {
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('monday');

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' }
  ];

  const timeSlots = [
    { slot: 'A1', time: '09:00 - 09:45' },
    { slot: 'A2', time: '09:45 - 10:30' },
    { slot: 'B1', time: '10:45 - 11:30' },
    { slot: 'B2', time: '11:30 - 12:15' },
    { slot: 'C1', time: '13:00 - 13:45' },
    { slot: 'C2', time: '13:45 - 14:30' },
    { slot: 'D1', time: '14:30 - 15:15' },
    { slot: 'D2', time: '15:15 - 16:00' }
  ];

  useEffect(() => {
    fetchTimetable();
  }, [classId]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError(null);

      const timetableData = await timetableService.getTimetableByClass(classId);
      setTimetable(timetableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodForSlot = (day: string, slot: string) => {
    if (!timetable) return null;
    
    const daySchedule = timetable.schedule.find(s => s.day === day);
    if (!daySchedule) return null;
    
    return daySchedule.periods.find(p => p.slot === slot);
  };

  const getSubjectColor = (subject: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800'
    ];
    
    const hash = subject.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-6 gap-4">
            {[...Array(48)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <p className="text-lg font-semibold mb-2">Error Loading Timetable</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchTimetable}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">No timetable available</p>
          <p className="text-sm">Timetable has not been created for this class yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Class Timetable</h2>
        
        {/* Day selector for mobile */}
        <div className="md:hidden mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Day
          </label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {daysOfWeek.map(day => (
              <option key={day.key} value={day.key}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Academic year info */}
        <div className="text-sm text-gray-600 mb-4">
          Academic Year: {timetable.academicYear}
        </div>
      </div>

      <div className="p-6">
        {/* Desktop view - Full week grid */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-700">
                  Time Slot
                </th>
                {daysOfWeek.map(day => (
                  <th key={day.key} className="border border-gray-300 px-4 py-3 bg-gray-50 text-center text-sm font-medium text-gray-700">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot.slot}>
                  <td className="border border-gray-300 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700">
                    <div>{timeSlot.slot}</div>
                    <div className="text-xs text-gray-500">{timeSlot.time}</div>
                  </td>
                  {daysOfWeek.map(day => {
                    const period = getPeriodForSlot(day.key, timeSlot.slot);
                    return (
                      <td key={`${day.key}-${timeSlot.slot}`} className="border border-gray-300 px-2 py-3 text-center">
                        {period ? (
                          <div className={`rounded-lg p-2 text-sm ${getSubjectColor(period.subject)}`}>
                            <div className="font-medium">{period.subject}</div>
                            <div className="text-xs mt-1 opacity-75">
                              {period.teacherName || 'TBA'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile view - Single day */}
        <div className="md:hidden">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
            {selectedDay}
          </h3>
          <div className="space-y-3">
            {timeSlots.map(timeSlot => {
              const period = getPeriodForSlot(selectedDay, timeSlot.slot);
              return (
                <div key={timeSlot.slot} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-800">{timeSlot.slot}</div>
                      <div className="text-sm text-gray-500">{timeSlot.time}</div>
                    </div>
                    {period && (
                      <div className={`rounded-lg px-3 py-1 text-sm ${getSubjectColor(period.subject)}`}>
                        {period.subject}
                      </div>
                    )}
                  </div>
                  {period ? (
                    <div className="text-sm text-gray-600">
                      Teacher: {period.teacherName || 'TBA'}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No class scheduled</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
              <span>Core Subjects</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
              <span>Languages</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
              <span>Practical</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-100 rounded mr-2"></div>
              <span>Activities</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <p>• Break times: 10:30-10:45 (Tea Break), 12:15-13:00 (Lunch Break)</p>
            <p>• TBA = To Be Announced</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableViewer;