import React, { useState, useEffect } from 'react';
import { Period, TeacherOption } from '../../types/timetable';

interface PeriodModalProps {
  period?: Period;
  day: string;
  slot: string;
  teachers: TeacherOption[];
  subjects: string[];
  onSave: (periodData: Partial<Period>) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const PeriodModal: React.FC<PeriodModalProps> = ({
  period,
  day,
  slot,
  teachers,
  subjects,
  onSave,
  onDelete,
  onCancel,
}) => {
  const [selectedSubject, setSelectedSubject] = useState(period?.subject || '');
  const [selectedTeacher, setSelectedTeacher] = useState(period?.teacherId || '');
  const [availableTeachers, setAvailableTeachers] = useState<TeacherOption[]>([]);

  useEffect(() => {
    if (selectedSubject) {
      // Filter teachers who can teach the selected subject
      const filteredTeachers = teachers.filter(teacher => 
        teacher.subjects.includes(selectedSubject)
      );
      setAvailableTeachers(filteredTeachers);
      
      // Reset teacher selection if current teacher can't teach the subject
      if (selectedTeacher && !filteredTeachers.find(t => t._id === selectedTeacher)) {
        setSelectedTeacher('');
      }
    } else {
      setAvailableTeachers([]);
      setSelectedTeacher('');
    }
  }, [selectedSubject, teachers, selectedTeacher]);

  const handleSave = () => {
    if (!selectedSubject || !selectedTeacher) {
      alert('Please select both subject and teacher');
      return;
    }

    onSave({
      subject: selectedSubject,
      teacherId: selectedTeacher,
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove this period?')) {
      onDelete();
    }
  };

  const capitalizeDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const hasPeriod = period?.subject && period?.teacherId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {hasPeriod ? 'Edit' : 'Add'} Period
        </h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">
            <strong>Day:</strong> {capitalizeDay(day)}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Time Slot:</strong> {slot}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={!selectedSubject}
            >
              <option value="">Select a teacher</option>
              {availableTeachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            {selectedSubject && availableTeachers.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No teachers available for this subject
              </p>
            )}
          </div>

          {hasPeriod && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-2">Current Assignment:</div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-medium">{period.subject}</div>
                <div className="text-sm text-gray-600">
                  {period.teacherName || 'Unknown Teacher'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {hasPeriod && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                Remove Period
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedSubject || !selectedTeacher}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasPeriod ? 'Update' : 'Add'} Period
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};