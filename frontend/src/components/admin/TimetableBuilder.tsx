import React, { useState, useEffect } from 'react';
import { Timetable, CreateTimetableData, UpdateTimetableData, ClassInfo, TeacherOption, DaySchedule, Period, TimeSlot } from '../../types/timetable';
import { timetableService } from '../../services/timetableService';
import { TimetableGrid } from './TimetableGrid';
import { PeriodModal } from './PeriodModal';

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { slot: 'A1', startTime: '08:00', endTime: '08:45' },
  { slot: 'A2', startTime: '08:45', endTime: '09:30' },
  { slot: 'B1', startTime: '09:45', endTime: '10:30' },
  { slot: 'B2', startTime: '10:30', endTime: '11:15' },
  { slot: 'C1', startTime: '11:30', endTime: '12:15' },
  { slot: 'C2', startTime: '12:15', endTime: '13:00' },
  { slot: 'D1', startTime: '14:00', endTime: '14:45' },
  { slot: 'D2', startTime: '14:45', endTime: '15:30' },
];

const DAYS: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'> = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
];

export const TimetableBuilder: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<{
    day: string;
    slotIndex: number;
    period?: Period;
  } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadTimetableForClass();
    }
  }, [selectedClass, academicYear]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [classesData, teachersData, subjectsData] = await Promise.all([
        timetableService.getClasses(),
        timetableService.getTeachers(),
        timetableService.getAvailableSubjects(),
      ]);
      
      setClasses(classesData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableForClass = async () => {
    try {
      const timetable = await timetableService.getTimetableByClass(selectedClass);
      setSelectedTimetable(timetable);
    } catch (err) {
      console.error('Error loading timetable:', err);
      setSelectedTimetable(null);
    }
  };

  const createEmptyTimetable = (): CreateTimetableData => {
    const schedule: DaySchedule[] = DAYS.map(day => ({
      day,
      periods: DEFAULT_TIME_SLOTS.map(slot => ({
        slot: slot.slot,
        subject: '',
        teacherId: '',
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    }));

    return {
      classId: selectedClass,
      academicYear,
      schedule,
    };
  };

  const handleCreateTimetable = async () => {
    if (!selectedClass) return;

    try {
      const newTimetableData = createEmptyTimetable();
      const newTimetable = await timetableService.createTimetable(newTimetableData);
      setSelectedTimetable(newTimetable);
    } catch (err) {
      setError('Failed to create timetable');
      console.error('Error creating timetable:', err);
    }
  };

  const handleUpdateTimetable = async (updatedSchedule: DaySchedule[]) => {
    if (!selectedTimetable) return;

    try {
      const updatedTimetable = await timetableService.updateTimetable(selectedTimetable._id, {
        schedule: updatedSchedule,
      });
      setSelectedTimetable(updatedTimetable);
    } catch (err) {
      setError('Failed to update timetable');
      console.error('Error updating timetable:', err);
    }
  };

  const handlePeriodClick = (day: string, slotIndex: number) => {
    if (!selectedTimetable) return;

    const daySchedule = selectedTimetable.schedule.find(s => s.day === day);
    const period = daySchedule?.periods[slotIndex];

    setEditingPeriod({
      day,
      slotIndex,
      period,
    });
    setShowPeriodModal(true);
  };

  const handlePeriodSave = (periodData: Partial<Period>) => {
    if (!selectedTimetable || !editingPeriod) return;

    const updatedSchedule = selectedTimetable.schedule.map(daySchedule => {
      if (daySchedule.day === editingPeriod.day) {
        const updatedPeriods = [...daySchedule.periods];
        const timeSlot = DEFAULT_TIME_SLOTS[editingPeriod.slotIndex];
        
        updatedPeriods[editingPeriod.slotIndex] = {
          slot: timeSlot.slot,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          subject: periodData.subject || '',
          teacherId: periodData.teacherId || '',
          teacherName: periodData.teacherId ? 
            teachers.find(t => t._id === periodData.teacherId)?.name : '',
        };
        
        return { ...daySchedule, periods: updatedPeriods };
      }
      return daySchedule;
    });

    handleUpdateTimetable(updatedSchedule);
    setShowPeriodModal(false);
    setEditingPeriod(null);
  };

  const handlePeriodDelete = () => {
    if (!selectedTimetable || !editingPeriod) return;

    const updatedSchedule = selectedTimetable.schedule.map(daySchedule => {
      if (daySchedule.day === editingPeriod.day) {
        const updatedPeriods = [...daySchedule.periods];
        const timeSlot = DEFAULT_TIME_SLOTS[editingPeriod.slotIndex];
        
        updatedPeriods[editingPeriod.slotIndex] = {
          slot: timeSlot.slot,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          subject: '',
          teacherId: '',
        };
        
        return { ...daySchedule, periods: updatedPeriods };
      }
      return daySchedule;
    });

    handleUpdateTimetable(updatedSchedule);
    setShowPeriodModal(false);
    setEditingPeriod(null);
  };

  const selectedClassInfo = classes.find(c => c._id === selectedClass);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading timetable builder...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Timetable Builder</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.standard} - {cls.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year.toString()}>
                    {year}-{year + 1}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            {selectedClass && !selectedTimetable && (
              <button
                onClick={handleCreateTimetable}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Timetable
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedClass && selectedClassInfo && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              Timetable for Class {selectedClassInfo.standard} - {selectedClassInfo.section}
            </h2>
            <p className="text-sm text-gray-600">Academic Year: {academicYear}-{parseInt(academicYear) + 1}</p>
          </div>

          {selectedTimetable ? (
            <TimetableGrid
              timetable={selectedTimetable}
              timeSlots={DEFAULT_TIME_SLOTS}
              onPeriodClick={handlePeriodClick}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No timetable found for this class.</p>
              <p>Click "Create Timetable" to get started.</p>
            </div>
          )}
        </div>
      )}

      {showPeriodModal && editingPeriod && (
        <PeriodModal
          period={editingPeriod.period}
          day={editingPeriod.day}
          slot={DEFAULT_TIME_SLOTS[editingPeriod.slotIndex].slot}
          teachers={teachers}
          subjects={subjects}
          onSave={handlePeriodSave}
          onDelete={handlePeriodDelete}
          onCancel={() => {
            setShowPeriodModal(false);
            setEditingPeriod(null);
          }}
        />
      )}
    </div>
  );
};