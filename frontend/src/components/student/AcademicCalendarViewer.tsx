import React, { useState, useEffect } from 'react';
import { calendarService, AcademicEvent } from '../../services/calendarService';

interface AcademicCalendarViewerProps {
  className?: string;
}

const AcademicCalendarViewer: React.FC<AcademicCalendarViewerProps> = ({ className = '' }) => {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const eventTypes = {
    holiday: { color: 'bg-red-100 text-red-800', icon: '🏖️' },
    exam: { color: 'bg-orange-100 text-orange-800', icon: '📝' },
    event: { color: 'bg-blue-100 text-blue-800', icon: '🎉' },
    sports: { color: 'bg-green-100 text-green-800', icon: '⚽' },
    cultural: { color: 'bg-purple-100 text-purple-800', icon: '🎭' },
    academic: { color: 'bg-indigo-100 text-indigo-800', icon: '📚' }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [selectedMonth, selectedYear]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const events = await calendarService.getEvents({
        month: selectedMonth,
        year: selectedYear,
        academicYear: `${selectedYear}-${selectedYear + 1}`
      });

      setEvents(events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventsForDate = (date: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const eventEndDate = event.endDate ? new Date(event.endDate) : eventDate;
      const currentDate = new Date(selectedYear, selectedMonth, date);
      
      return currentDate >= eventDate && currentDate <= eventEndDate;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isToday = (date: number) => {
    const today = new Date();
    return today.getDate() === date && 
           today.getMonth() === selectedMonth && 
           today.getFullYear() === selectedYear;
  };

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>
      );
    }

    // Days of the month
    for (let date = 1; date <= daysInMonth; date++) {
      const dayEvents = getEventsForDate(date);
      const isCurrentDay = isToday(date);

      days.push(
        <div key={date} className={`h-24 border border-gray-200 p-1 ${isCurrentDay ? 'bg-blue-50' : 'bg-white'}`}>
          <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
            {date}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event._id}
                className={`text-xs px-1 py-0.5 rounded truncate ${eventTypes[event.type].color}`}
                title={event.title}
              >
                {eventTypes[event.type].icon} {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 p-2 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">No events scheduled</p>
            <p className="text-sm">No events found for {months[selectedMonth]} {selectedYear}</p>
          </div>
        ) : (
          sortedEvents.map(event => (
            <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${eventTypes[event.type].color} mr-3`}>
                      {eventTypes[event.type].icon} {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-2">{event.description}</p>
                  <div className="text-sm text-gray-500">
                    {event.isMultiDay && event.endDate ? (
                      <span>{formatDate(event.date)} - {formatDate(event.endDate)}</span>
                    ) : (
                      <span>{formatDate(event.date)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <p className="text-lg font-semibold mb-2">Error Loading Calendar</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchCalendarEvents}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Academic Calendar</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Month/Year selectors */}
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* View mode toggle */}
            <div className="flex rounded-md border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Event type legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(eventTypes).map(([type, config]) => (
            <div key={type} className="flex items-center">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color} mr-2`}>
                {config.icon} {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
      </div>
    </div>
  );
};

export default AcademicCalendarViewer;