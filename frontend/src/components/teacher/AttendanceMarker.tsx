import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatus, ClassRosterStudent, AttendanceMarkingData } from '../../types/attendance';
import { Student } from '../../types/student';

interface AttendanceMarkerProps {
  onAttendanceMarked?: () => void;
}

const AttendanceMarker: React.FC<AttendanceMarkerProps> = ({ onAttendanceMarked }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [academicYear, setAcademicYear] = useState('');
  const [students, setStudents] = useState<ClassRosterStudent[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<{ standard: string; section: string; subject: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<{ [studentId: string]: { status: AttendanceStatus; id: string; remarks?: string } }>({});

  // Generate current academic year
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Academic year starts in April (month 3, 0-indexed)
    if (currentMonth >= 3) {
      setAcademicYear(`${currentYear}-${currentYear + 1}`);
    } else {
      setAcademicYear(`${currentYear - 1}-${currentYear}`);
    }
  }, []);

  // Load teacher's assigned classes
  useEffect(() => {
    const loadAssignedClasses = async () => {
      try {
        const classes = await attendanceService.getTeacherClasses();
        setAssignedClasses(classes);
      } catch (err) {
        console.error('Error loading assigned classes:', err);
        setError('Failed to load assigned classes');
      }
    };

    loadAssignedClasses();
  }, []);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadClassStudents();
    }
  }, [selectedClass, selectedSubject, selectedDate, academicYear]);

  const loadClassStudents = async () => {
    if (!selectedClass || !selectedSubject || !selectedDate || !academicYear) return;

    setLoading(true);
    setError(null);
    
    try {
      // Load students for the class
      const classStudents = await attendanceService.getClassStudents(selectedClass);
      
      // Check if attendance already exists for this date
      const existingRecords = await attendanceService.checkAttendanceExists(
        selectedClass, 
        selectedSubject, 
        selectedDate, 
        academicYear
      );

      // Create a map of existing attendance
      const existingMap: { [studentId: string]: { status: AttendanceStatus; id: string; remarks?: string } } = {};
      existingRecords.forEach(record => {
        existingMap[record.studentId._id] = {
          status: record.status,
          id: record._id,
          remarks: record.remarks
        };
      });

      setExistingAttendance(existingMap);

      // Convert students to roster format
      const rosterStudents: ClassRosterStudent[] = classStudents.map(student => ({
        ...student,
        attendanceStatus: existingMap[student._id]?.status,
        attendanceId: existingMap[student._id]?.id,
        remarks: existingMap[student._id]?.remarks
      }));

      setStudents(rosterStudents.sort((a, b) => a.rollNo.localeCompare(b.rollNo)));
    } catch (err) {
      console.error('Error loading class students:', err);
      setError('Failed to load class students');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    
    // Reset subject when class changes
    setSelectedSubject('');
    setStudents([]);
    setExistingAttendance({});
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(student => 
      student._id === studentId 
        ? { ...student, attendanceStatus: status }
        : student
    ));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev => prev.map(student => 
      student._id === studentId 
        ? { ...student, remarks }
        : student
    ));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(student => ({
      ...student,
      attendanceStatus: status
    })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedSubject || !selectedDate || !academicYear) {
      setError('Please select class, subject, and date');
      return;
    }

    const studentsToMark = students.filter(student => student.attendanceStatus);
    
    if (studentsToMark.length === 0) {
      setError('Please mark attendance for at least one student');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const promises = studentsToMark.map(async (student) => {
        const existingRecord = existingAttendance[student._id];
        
        if (existingRecord) {
          // Update existing attendance
          return attendanceService.updateAttendance(existingRecord.id, {
            status: student.attendanceStatus!,
            remarks: student.remarks
          });
        } else {
          // Mark new attendance
          return attendanceService.markAttendance({
            studentId: student._id,
            classId: selectedClass,
            subject: selectedSubject,
            date: selectedDate,
            status: student.attendanceStatus!,
            academicYear,
            remarks: student.remarks
          });
        }
      });

      await Promise.all(promises);
      
      setSuccess(`Attendance saved successfully for ${studentsToMark.length} students`);
      
      // Reload the attendance data
      await loadClassStudents();
      
      if (onAttendanceMarked) {
        onAttendanceMarked();
      }
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setError(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getAvailableSubjects = () => {
    if (!selectedClass) return [];
    
    const [standard, section] = selectedClass.split('-');
    return assignedClasses
      .filter(cls => cls.standard === standard && cls.section === section)
      .map(cls => cls.subject);
  };

  const getAvailableClasses = () => {
    const uniqueClasses = new Set<string>();
    assignedClasses.forEach(cls => {
      uniqueClasses.add(`${cls.standard}-${cls.section}`);
    });
    return Array.from(uniqueClasses).sort();
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const marked = students.filter(s => s.attendanceStatus).length;
    const present = students.filter(s => s.attendanceStatus === 'present').length;
    const absent = students.filter(s => s.attendanceStatus === 'absent').length;
    const late = students.filter(s => s.attendanceStatus === 'late').length;
    
    return { total, marked, present, absent, late };
  };

  const stats = getAttendanceStats();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
        {existingAttendance && Object.keys(existingAttendance).length > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded">
            Attendance already marked - editing mode
          </span>
        )}
      </div>

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <select
            id="class"
            value={selectedClass}
            onChange={handleClassChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Class</option>
            {getAvailableClasses().map(classId => (
              <option key={classId} value={classId}>
                {classId}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <select
            id="subject"
            value={selectedSubject}
            onChange={handleSubjectChange}
            disabled={!selectedClass}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select Subject</option>
            {getAvailableSubjects().map(subject => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <input
            type="text"
            id="academicYear"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="2023-2024"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Quick Actions */}
      {students.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleMarkAll('present')}
            className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-sm"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
          >
            Mark All Absent
          </button>
          <div className="flex-1"></div>
          <div className="text-sm text-gray-600">
            Total: {stats.total} | Marked: {stats.marked} | Present: {stats.present} | Absent: {stats.absent} | Late: {stats.late}
          </div>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading students...</p>
        </div>
      ) : students.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.rollNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`attendance-${student._id}`}
                          value="present"
                          checked={student.attendanceStatus === 'present'}
                          onChange={() => handleAttendanceChange(student._id, 'present')}
                          className="form-radio h-4 w-4 text-green-600"
                        />
                        <span className="ml-1 text-sm text-green-700">Present</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`attendance-${student._id}`}
                          value="absent"
                          checked={student.attendanceStatus === 'absent'}
                          onChange={() => handleAttendanceChange(student._id, 'absent')}
                          className="form-radio h-4 w-4 text-red-600"
                        />
                        <span className="ml-1 text-sm text-red-700">Absent</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`attendance-${student._id}`}
                          value="late"
                          checked={student.attendanceStatus === 'late'}
                          onChange={() => handleAttendanceChange(student._id, 'late')}
                          className="form-radio h-4 w-4 text-yellow-600"
                        />
                        <span className="ml-1 text-sm text-yellow-700">Late</span>
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={student.remarks || ''}
                      onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                      placeholder="Optional remarks"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedClass && selectedSubject ? (
        <div className="text-center py-8 text-gray-500">
          No students found for the selected class.
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please select a class and subject to view students.
        </div>
      )}

      {/* Save Button */}
      {students.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveAttendance}
            disabled={saving || stats.marked === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarker;