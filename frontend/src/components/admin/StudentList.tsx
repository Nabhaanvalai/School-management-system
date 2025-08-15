import React, { useState } from 'react';
import { Student } from '../../types/student';

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onTransfer: (student: Student) => void;
  onMarkLeft: (student: Student, leavingDate: string) => Promise<void>;
  onArchive: (student: Student) => Promise<void>;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  onEdit,
  onTransfer,
  onMarkLeft,
  onArchive,
}) => {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleMarkLeft = (student: Student) => {
    setSelectedStudent(student);
    setShowLeaveModal(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (status === 'active') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-red-100 text-red-800`;
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No students found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Roll No: {student.rollNo}
                      </div>
                      <div className="text-sm text-gray-500">
                        DOB: {formatDate(student.dateOfBirth)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Standard {student.standard} - {student.section}
                    </div>
                    <div className="text-sm text-gray-500">
                      Admitted: {formatDate(student.admissionDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.parentContact.fatherName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.parentContact.phone}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.parentContact.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(student.status)}>
                      {student.status}
                    </span>
                    {student.status === 'left' && student.leavingDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Left: {formatDate(student.leavingDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(student)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {student.status === 'active' && (
                        <>
                          <button
                            onClick={() => onTransfer(student)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Transfer
                          </button>
                          <button
                            onClick={() => handleMarkLeft(student)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Mark Left
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onArchive(student)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showLeaveModal && selectedStudent && (
        <LeaveModal
          student={selectedStudent}
          onConfirm={async (leavingDate) => {
            await onMarkLeft(selectedStudent, leavingDate);
            setShowLeaveModal(false);
            setSelectedStudent(null);
          }}
          onCancel={() => {
            setShowLeaveModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </>
  );
};

interface LeaveModalProps {
  student: Student;
  onConfirm: (leavingDate: string) => Promise<void>;
  onCancel: () => void;
}

const LeaveModal: React.FC<LeaveModalProps> = ({ student, onConfirm, onCancel }) => {
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onConfirm(leavingDate);
    } catch (err) {
      console.error('Error marking student as left:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Mark Student as Left</h2>
        <p className="mb-4">
          Mark <strong>{student.name}</strong> as having left the school?
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Leaving Date</label>
            <input
              type="date"
              value={leavingDate}
              onChange={(e) => setLeavingDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Mark as Left'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};