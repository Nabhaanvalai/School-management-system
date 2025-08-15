import React from 'react';
import { Timetable, TimeSlot } from '../../types/timetable';

interface TimetableGridProps {
  timetable: Timetable;
  timeSlots: TimeSlot[];
  onPeriodClick: (day: string, slotIndex: number) => void;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  timetable,
  timeSlots,
  onPeriodClick,
}) => {
  const getPeriodForDayAndSlot = (day: string, slotIndex: number) => {
    const daySchedule = timetable.schedule.find(s => s.day === day);
    return daySchedule?.periods[slotIndex];
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2 bg-gray-50 text-left font-medium">
              Time / Day
            </th>
            {DAYS.map(day => (
              <th key={day.key} className="border border-gray-300 p-2 bg-gray-50 text-center font-medium min-w-32">
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((timeSlot, slotIndex) => (
            <tr key={timeSlot.slot}>
              <td className="border border-gray-300 p-2 bg-gray-50 font-medium text-sm">
                <div className="text-center">
                  <div className="font-semibold">{timeSlot.slot}</div>
                  <div className="text-xs text-gray-600">
                    {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
                  </div>
                </div>
              </td>
              {DAYS.map(day => {
                const period = getPeriodForDayAndSlot(day.key, slotIndex);
                const isEmpty = !period?.subject || !period?.teacherId;
                
                return (
                  <td
                    key={`${day.key}-${slotIndex}`}
                    className={`border border-gray-300 p-1 cursor-pointer transition-colors ${
                      isEmpty 
                        ? 'bg-gray-50 hover:bg-gray-100' 
                        : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                    onClick={() => onPeriodClick(day.key, slotIndex)}
                  >
                    {period && !isEmpty ? (
                      <div className="text-center">
                        <div className="font-medium text-sm text-blue-900">
                          {period.subject}
                        </div>
                        <div className="text-xs text-blue-700">
                          {period.teacherName || 'Unknown Teacher'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-sm py-4">
                        <div>Click to add</div>
                        <div className="text-xs">period</div>
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
  );
};