import React, { useState, useEffect } from 'react';
import { Student, StudentFilters, CreateStudentData, UpdateStudentData, TransferStudentData } from '../../types/student';
import { studentService } from '../../services/studentService';
import { StudentForm } from './StudentForm';
import { StudentList } from './StudentList';
import { StudentFiltersComponent } from './StudentFilters';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudentFilters>({});
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, [filters]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getStudents(filters);
      setStudents(data);
    } catch (err) {
      setError('Failed to load students');
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (studentData: CreateStudentData) => {
    try {
      const newStudent = await studentService.createStudent(studentData);
      setStudents(prev => [...prev, newStudent]);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating student:', err);
      throw err;
    }
  };

  const handleUpdateStudent = async (id: string, studentData: UpdateStudentData) => {
    try {
      const updatedStudent = await studentService.updateStudent(id, studentData);
      setStudents(prev => prev.map(s => s._id === id ? updatedStudent : s));
      setEditingStudent(null);
      setShowForm(false);
    } catch (err) {
      console.error('Error updating student:', err);
      throw err;
    }
  };

  const handleTransferStudent = async (transferData: TransferStudentData) => {
    if (!transferStudent) return;
    
    try {
      const updatedStudent = await studentService.transferStudent(transferStudent._id, transferData);
      setStudents(prev => prev.map(s => s._id === transferStudent._id ? updatedStudent : s));
      setShowTransferModal(false);
      setTransferStudent(null);
    } catch (err) {
      console.error('Error transferring student:', err);
      throw err;
    }
  };

  const handleMarkStudentLeft = async (student: Student, leavingDate: string) => {
    try {
      const updatedStudent = await studentService.markStudentLeft(student._id, leavingDate);
      setStudents(prev => prev.map(s => s._id === student._id ? updatedStudent : s));
    } catch (err) {
      console.error('Error marking student as left:', err);
      throw err;
    }
  };

  const handleArchiveStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to archive ${student.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await studentService.archiveStudent(student._id);
      setStudents(prev => prev.filter(s => s._id !== student._id));
    } catch (err) {
      console.error('Error archiving student:', err);
      throw err;
    }
  };

  const openEditForm = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const openTransferModal = (student: Student) => {
    setTransferStudent(student);
    setShowTransferModal(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStudent(null);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferStudent(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Student
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <StudentFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
      />

      <StudentList
        students={students}
        onEdit={openEditForm}
        onTransfer={openTransferModal}
        onMarkLeft={handleMarkStudentLeft}
        onArchive={handleArchiveStudent}
      />

      {showForm && (
        <StudentForm
          student={editingStudent}
          onSubmit={editingStudent ? 
            (data) => handleUpdateStudent(editingStudent._id, data as UpdateStudentData) : 
            (data) => handleCreateStudent(data as CreateStudentData)
          }
          onCancel={closeForm}
        />
      )}

      {showTransferModal && transferStudent && (
        <TransferModal
          student={transferStudent}
          onTransfer={handleTransferStudent}
          onCancel={closeTransferModal}
        />
      )}
    </div>
  );
};

interface TransferModalProps {
  student: Student;
  onTransfer: (data: TransferStudentData) => Promise<void>;
  onCancel: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ student, onTransfer, onCancel }) => {
  const [standard, setStandard] = useState(student.standard);
  const [section, setSection] = useState(student.section);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onTransfer({ standard, section });
    } catch (err) {
      console.error('Transfer failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Transfer Student</h2>
        <p className="mb-4">Transfer {student.name} to a different class</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Standard</label>
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num.toString()}>{num}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};